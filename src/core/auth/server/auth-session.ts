import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type {
  AuthSession,
  AuthenticatedMembership,
  AuthenticatedMembershipDto,
  BackendLoginResponse,
  BackendLoginResponseDto,
} from "@/core/auth/types";
import { env } from "@/core/config/env";

export const authTokenCookieName = "gza.pa.access-token";
export const authSessionCookieName = "gza.pa.session";

type AuthSessionReadResult = {
  session: AuthSession | null;
  reason: "missing" | "invalid" | "expired" | "valid";
};

function getCookieOptions(expiresAtUtc: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAtUtc),
  };
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", env.authSessionSecret)
    .update(payload)
    .digest("base64url");
}

function normalizeMembership(
  membership: AuthenticatedMembershipDto,
): AuthenticatedMembership {
  return {
    membershipId: membership.membershipId ?? "",
    organizationId: membership.organizationId ?? "",
    status: membership.status ?? "",
    roles: (membership.roles ?? []).filter(
      (role): role is string => typeof role === "string",
    ),
  };
}

function normalizeAuthSession(input: BackendLoginResponseDto): AuthSession {
  return {
    userId: input.userId ?? "",
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    email: input.email ?? "",
    activeOrganizationId: input.activeOrganizationId ?? null,
    activeOrganizationName: input.activeOrganizationName ?? null,
    activeOrganizationLogo: input.activeOrganizationLogo ?? null,
    mustChangePassword: Boolean(input.mustChangePassword),
    expiresAtUtc: input.expiresAtUtc ?? "",
    memberships: (input.memberships ?? []).map(normalizeMembership),
    roles: (input.roles ?? []).filter(
      (role): role is string => typeof role === "string",
    ),
  };
}

function encodeSession(session: AuthSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  const signature = signSessionPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSession(value: string): AuthSessionReadResult {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) {
      return { session: null, reason: "invalid" };
    }

    const expectedSignature = signSessionPayload(payload);
    const receivedSignatureBuffer = Buffer.from(signature, "utf8");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      receivedSignatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(receivedSignatureBuffer, expectedSignatureBuffer)
    ) {
      return { session: null, reason: "invalid" };
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AuthSession;

    if (new Date(session.expiresAtUtc).getTime() <= Date.now()) {
      return { session: null, reason: "expired" };
    }

    return { session, reason: "valid" };
  } catch {
    return { session: null, reason: "invalid" };
  }
}

export function readAuthSessionFromCookieValue(
  value: string | undefined,
): AuthSessionReadResult {
  if (!value) {
    return { session: null, reason: "missing" };
  }

  return decodeSession(value);
}

export function getAccessTokenFromRequest(request: NextRequest) {
  return request.cookies.get(authTokenCookieName)?.value ?? null;
}

export function readAuthSessionFromRequest(
  request: NextRequest,
): AuthSessionReadResult {
  return readAuthSessionFromCookieValue(
    request.cookies.get(authSessionCookieName)?.value,
  );
}

export function getAuthSessionFromRequest(request: NextRequest) {
  return readAuthSessionFromRequest(request).session;
}

export function toAuthSession(
  loginResponse: BackendLoginResponse | BackendLoginResponseDto,
): AuthSession {
  return normalizeAuthSession(loginResponse);
}

export function toBackendLoginResponse(
  loginResponse: BackendLoginResponseDto,
): BackendLoginResponse {
  return {
    ...normalizeAuthSession(loginResponse),
    accessToken: loginResponse.accessToken ?? "",
  };
}

export function setAuthCookies(
  response: NextResponse,
  loginResponse: BackendLoginResponse,
  sessionOverride?: AuthSession,
) {
  const session = sessionOverride ?? toAuthSession(loginResponse);
  const cookieOptions = getCookieOptions(loginResponse.expiresAtUtc);

  response.cookies.set(
    authTokenCookieName,
    loginResponse.accessToken,
    cookieOptions,
  );
  response.cookies.set(
    authSessionCookieName,
    encodeSession(session),
    cookieOptions,
  );
}

export function setAuthSessionCookie(
  response: NextResponse,
  session: AuthSession,
) {
  response.cookies.set(
    authSessionCookieName,
    encodeSession(session),
    getCookieOptions(session.expiresAtUtc),
  );
}

export function clearAuthCookies(response: NextResponse) {
  const clearedCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };

  response.cookies.set(authTokenCookieName, "", clearedCookieOptions);
  response.cookies.set(authSessionCookieName, "", clearedCookieOptions);
}
