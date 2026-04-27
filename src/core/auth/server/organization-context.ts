import type { AuthSession } from "@/core/auth/types";
import { env } from "@/core/config/env";

type BackendOrganization = {
  id: string;
  name: string;
  logo: string | null;
};

function normalizeRole(role: string) {
  return role
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isSuperUserSession(session: AuthSession) {
  return session.roles.some((role) => {
    const normalized = normalizeRole(role);
    return normalized === "SUPER_USER" || normalized === "ADMIN";
  });
}

function isOperatorSession(session: AuthSession) {
  const hasOperatorRole = session.roles.some((role) => {
    const normalized = normalizeRole(role);
    return (
      normalized === "ORG_ADMIN" ||
      normalized === "ORGADMIN" ||
      normalized === "OPERATOR" ||
      normalized === "ORGANIZATION_ADMIN" ||
      normalized === "ORGANIZATIONADMIN"
    );
  });

  if (hasOperatorRole) {
    return true;
  }

  return session.memberships.some((membership) =>
    membership.roles.some((role) => {
      const normalized = normalizeRole(role);
      return (
        normalized === "ORG_ADMIN" ||
        normalized === "ORGADMIN" ||
        normalized === "OPERATOR" ||
        normalized === "ORGANIZATION_ADMIN" ||
        normalized === "ORGANIZATIONADMIN"
      );
    }),
  );
}

async function fetchOrganizationById(
  accessToken: string,
  organizationId: string,
): Promise<BackendOrganization | null> {
  try {
    const response = await fetch(
      `${env.backendApiBaseUrl}/api/organizations/${organizationId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BackendOrganization;
  } catch {
    return null;
  }
}

export async function enrichSessionOrganizationContext(
  session: AuthSession,
  accessToken: string,
): Promise<{ session: AuthSession; hasChanges: boolean }> {
  let hasChanges = false;
  const nextSession: AuthSession = { ...session };
  const previousActiveOrganizationId = session.activeOrganizationId ?? null;

  if (!nextSession.activeOrganizationId && isOperatorSession(nextSession)) {
    const operatorDefaultOrganizationId =
      nextSession.memberships[0]?.organizationId;
    if (operatorDefaultOrganizationId) {
      nextSession.activeOrganizationId = operatorDefaultOrganizationId;
      hasChanges = true;
    }
  }

  if (!nextSession.activeOrganizationId) {
    if (
      nextSession.activeOrganizationName !== undefined ||
      nextSession.activeOrganizationLogo !== undefined
    ) {
      nextSession.activeOrganizationName = null;
      nextSession.activeOrganizationLogo = null;
      hasChanges = true;
    }

    return { session: nextSession, hasChanges };
  }

  if (previousActiveOrganizationId !== nextSession.activeOrganizationId) {
    nextSession.activeOrganizationName = null;
    nextSession.activeOrganizationLogo = null;
    hasChanges = true;
  }

  const hasMembership = nextSession.memberships.some(
    (membership) =>
      membership.organizationId === nextSession.activeOrganizationId,
  );

  if (!hasMembership && !isSuperUserSession(nextSession)) {
    nextSession.activeOrganizationId = null;
    nextSession.activeOrganizationName = null;
    nextSession.activeOrganizationLogo = null;
    return { session: nextSession, hasChanges: true };
  }

  const organization = await fetchOrganizationById(
    accessToken,
    nextSession.activeOrganizationId,
  );

  if (!organization) {
    return { session: nextSession, hasChanges };
  }

  if (nextSession.activeOrganizationName !== organization.name) {
    nextSession.activeOrganizationName = organization.name;
    hasChanges = true;
  }

  const nextLogo = organization.logo ?? null;
  if ((nextSession.activeOrganizationLogo ?? null) !== nextLogo) {
    nextSession.activeOrganizationLogo = nextLogo;
    hasChanges = true;
  }

  return { session: nextSession, hasChanges };
}
