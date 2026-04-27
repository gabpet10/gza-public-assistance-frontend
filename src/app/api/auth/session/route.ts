import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  readAuthSessionFromRequest,
  setAuthSessionCookie,
} from "@/core/auth/server/auth-session";
import { enrichSessionOrganizationContext } from "@/core/auth/server/organization-context";

export async function GET(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);
  const sessionResult = readAuthSessionFromRequest(request);

  if (!accessToken || !sessionResult.session) {
    const response = NextResponse.json(
      {
        title: "Unauthorized",
        detail:
          sessionResult.reason === "expired"
            ? "Session expired. Please sign in again."
            : "Authentication required.",
        status: 401,
      },
      { status: 401 },
    );

    if (accessToken || sessionResult.reason === "invalid") {
      clearAuthCookies(response);
    }

    return response;
  }

  const { session, hasChanges } = await enrichSessionOrganizationContext(
    sessionResult.session,
    accessToken,
  );

  const response = NextResponse.json(session);
  if (hasChanges) {
    setAuthSessionCookie(response, session);
  }

  return response;
}
