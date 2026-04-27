import { NextRequest, NextResponse } from "next/server";
import {
  buildBackendUrl,
  createProxyResponse,
} from "@/core/auth/server/bff-proxy";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
} from "@/core/auth/server/auth-session";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
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

  const { path } = await context.params;
  const targetUrl = buildBackendUrl(
    `/api/${path.join("/")}`,
    request.nextUrl.search,
  );

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  headers.set("authorization", `Bearer ${accessToken}`);

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
    cache: "no-store",
  });

  return createProxyResponse(backendResponse);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
