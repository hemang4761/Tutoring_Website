import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["family"]);
  return <AppShell user={user}>{children}</AppShell>;
}
