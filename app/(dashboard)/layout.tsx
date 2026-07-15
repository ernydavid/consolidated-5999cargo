import { AppShell } from "@/components/dashboard/app-shell";
import { getCurrentUser, requireSession } from "@/lib/dal";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSession();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
