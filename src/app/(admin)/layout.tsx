import { AuthGuard } from "@/core/auth/auth-guard";
import { AppShell } from "@/shared/ui/app-shell";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
