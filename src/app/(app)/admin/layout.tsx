import { AppShell } from "@/components/app-shell/app-shell";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AppShell user={user}>{children}</AppShell>;
}
