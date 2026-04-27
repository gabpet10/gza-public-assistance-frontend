import { PageContainer } from "@/shared/ui/page-container";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-10 md:py-16">
      {children}
    </PageContainer>
  );
}
