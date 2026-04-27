import { NextResponse } from "next/server";
import { env } from "@/core/config/env";
import { clearAuthCookies } from "@/core/auth/server/auth-session";

export function buildBackendUrl(path: string, search = "") {
  return `${env.backendApiBaseUrl}${path}${search}`;
}

export async function createProxyResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, { status: response.status });
  }

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const location = response.headers.get("location");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (location) {
    headers.set("location", location);
  }

  const body = await response.text();
  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers,
  });

  if (response.status === 401) {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}