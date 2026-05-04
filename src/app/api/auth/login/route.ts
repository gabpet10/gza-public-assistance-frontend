import { NextRequest, NextResponse } from "next/server";
import type { BackendLoginResponseDto } from "@/core/auth/types";
import {
  buildBackendUrl,
  createProxyResponse,
} from "@/core/auth/server/bff-proxy";
import {
  setAuthCookies,
  toAuthSession,
  toBackendLoginResponse,
} from "@/core/auth/server/auth-session";
import { enrichSessionOrganizationContext } from "@/core/auth/server/organization-context";

export async function POST(request: NextRequest) {
  const body = await request.text();
  let backendResponse: Response;

  try {
    backendResponse = await fetch(buildBackendUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        title: "Bad Gateway",
        detail:
          "Login non riuscito: backend auth non raggiungibile dall'app frontend.",
        status: 502,
      },
      { status: 502 },
    );
  }

  if (!backendResponse.ok) {
    return createProxyResponse(backendResponse);
  }

  const loginResponse = toBackendLoginResponse(
    (await backendResponse.json()) as BackendLoginResponseDto,
  );

  if (!loginResponse.accessToken) {
    return NextResponse.json(
      {
        title: "Bad Gateway",
        detail: "Backend login response did not include an access token.",
        status: 502,
      },
      { status: 502 },
    );
  }

  const authSession = toAuthSession(loginResponse);
  const { session } = await enrichSessionOrganizationContext(
    authSession,
    loginResponse.accessToken,
  );

  const response = NextResponse.json(session);
  setAuthCookies(response, loginResponse, session);
  return response;
}
