import { NextRequest, NextResponse } from "next/server";
import {
  buildBackendUrl,
  createProxyResponse,
} from "@/core/auth/server/bff-proxy";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  readAuthSessionFromRequest,
  setAuthSessionCookie,
} from "@/core/auth/server/auth-session";

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

    clearAuthCookies(response);
    return response;
  }

  const body = await request.text();
  const backendResponse = await fetch(
    buildBackendUrl("/api/auth/change-password"),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body,
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    return createProxyResponse(backendResponse);
  }

  const response = new NextResponse(null, { status: 204 });

  setAuthSessionCookie(response, {
    ...sessionResult.session,
    mustChangePassword: false,
  });

  return response;
}
