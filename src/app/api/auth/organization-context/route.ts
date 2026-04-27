import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  readAuthSessionFromRequest,
  setAuthSessionCookie,
} from "@/core/auth/server/auth-session";
import { enrichSessionOrganizationContext } from "@/core/auth/server/organization-context";

type SetOrganizationContextRequest = {
  organizationId?: string;
};

function normalizeRole(role: string) {
  return role
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isSuperUserRole(roles: string[] | undefined) {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some((role) => {
    const normalized = normalizeRole(role);
    return normalized === "SUPER_USER" || normalized === "ADMIN";
  });
}

export async function POST(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);
  const sessionResult = readAuthSessionFromRequest(request);

  if (!accessToken || !sessionResult.session) {
    const response = NextResponse.json(
      {
        title: "Unauthorized",
        detail: "Authentication required.",
        status: 401,
      },
      { status: 401 },
    );

    if (accessToken || sessionResult.reason === "invalid") {
      clearAuthCookies(response);
    }

    return response;
  }

  const payload = (await request.json()) as SetOrganizationContextRequest;
  const organizationId = payload.organizationId?.trim();

  if (!organizationId) {
    return NextResponse.json(
      {
        title: "Validation error",
        detail: "organizationId is required.",
        status: 400,
      },
      { status: 400 },
    );
  }

  const currentSession = sessionResult.session;
  const hasMembership = currentSession.memberships.some(
    (membership) => membership.organizationId === organizationId,
  );

  if (!hasMembership && !isSuperUserRole(currentSession.roles)) {
    return NextResponse.json(
      {
        title: "Forbidden",
        detail: "You are not allowed to enter this organization context.",
        status: 403,
      },
      { status: 403 },
    );
  }

  const nextSession = {
    ...currentSession,
    activeOrganizationId: organizationId,
  };

  const enrichedSessionResult = await enrichSessionOrganizationContext(
    nextSession,
    accessToken,
  );

  const response = NextResponse.json(enrichedSessionResult.session);
  setAuthSessionCookie(response, enrichedSessionResult.session);
  return response;
}

export async function DELETE(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);
  const sessionResult = readAuthSessionFromRequest(request);

  if (!accessToken || !sessionResult.session) {
    const response = NextResponse.json(
      {
        title: "Unauthorized",
        detail: "Authentication required.",
        status: 401,
      },
      { status: 401 },
    );

    if (accessToken || sessionResult.reason === "invalid") {
      clearAuthCookies(response);
    }

    return response;
  }

  const nextSession = {
    ...sessionResult.session,
    activeOrganizationId: null,
    activeOrganizationName: null,
    activeOrganizationLogo: null,
  };

  const response = NextResponse.json(nextSession);
  setAuthSessionCookie(response, nextSession);
  return response;
}
