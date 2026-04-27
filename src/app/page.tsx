import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authTokenCookieName,
  authSessionCookieName,
  readAuthSessionFromCookieValue,
} from "@/core/auth/server/auth-session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authTokenCookieName)?.value;
  const sessionResult = readAuthSessionFromCookieValue(
    cookieStore.get(authSessionCookieName)?.value,
  );

  if (!accessToken || !sessionResult.session) {
    redirect("/login");
  }
  redirect(
    sessionResult.session.mustChangePassword
      ? "/change-password?mode=forced"
      : "/dashboard",
  );
}
