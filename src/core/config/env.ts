const fallbackApiBaseUrl = "http://localhost:5187";
const fallbackAuthSessionSecret = "development-auth-session-secret";

export const env = {
  backendApiBaseUrl:
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    fallbackApiBaseUrl,
  authSessionSecret:
    process.env.AUTH_SESSION_SECRET ?? fallbackAuthSessionSecret,
};
