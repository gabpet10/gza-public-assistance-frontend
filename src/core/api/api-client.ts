import { ApiError } from "@/core/api/errors";
import type { ProblemDetails } from "@/core/api/types";

type ApiRequestOptions = RequestInit;

export const authUnauthorizedEventName = "gza:auth-unauthorized";

async function readProblem(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/json") &&
    !contentType.includes("application/problem+json")
  ) {
    return undefined;
  }

  return (await response.json()) as ProblemDetails;
}

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const problem = await readProblem(response);
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(authUnauthorizedEventName));
    }

    throw new ApiError(
      problem?.title ?? `HTTP ${response.status}`,
      response.status,
      problem,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
