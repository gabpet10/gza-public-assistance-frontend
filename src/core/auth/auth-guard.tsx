"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/shared/ui/feedback-states";
import { useAuth } from "@/core/auth/auth-context";
import { usePermissions } from "@/core/auth/use-permissions";

export function AuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isReady } = useAuth();
  const { canAccessPath } = usePermissions();

  useEffect(() => {
    if (isReady && !session) {
      const search = searchParams.toString();
      const nextPath = search ? `${pathname}?${search}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (
      isReady &&
      session?.mustChangePassword &&
      pathname !== "/change-password"
    ) {
      router.replace("/change-password?mode=forced");
      return;
    }

    if (
      isReady &&
      session &&
      !session.mustChangePassword &&
      pathname !== "/change-password" &&
      !canAccessPath(pathname)
    ) {
      router.replace("/dashboard");
      return;
    }
  }, [canAccessPath, isReady, pathname, router, searchParams, session]);

  if (!isReady) {
    return <LoadingState message="Ripristino sessione in corso..." />;
  }

  if (!session) {
    return (
      <LoadingState message="Reindirizzamento alla pagina di accesso..." />
    );
  }

  if (session.mustChangePassword && pathname !== "/change-password") {
    return (
      <LoadingState message="Reindirizzamento al cambio password obbligatorio..." />
    );
  }

  if (pathname !== "/change-password" && !canAccessPath(pathname)) {
    return <LoadingState message="Verifica autorizzazioni in corso..." />;
  }

  return <>{children}</>;
}
