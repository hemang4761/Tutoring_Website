import { Suspense } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminTopBar } from "@/components/admin/top-bar";
import { PanelHost } from "@/components/admin/panels";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getTutorOptions } from "@/lib/queries/dashboard";
import { DEFAULT_TEMPLATES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [settings, tutors] = await Promise.all([getSettings(), getTutorOptions()]);
  return (
    <AppShell user={user}>
      <AdminProvider
        value={{
          adminName: user.name,
          tutors,
          rateTiers: settings.rateTiers.map((r) => ({ key: r.key ?? "", label: r.label ?? "", rate: r.rate ?? 0 })),
          templates: settings.templates?.length
            ? settings.templates.map((t) => ({ id: String(t._id), label: t.label ?? "", body: t.body ?? "" }))
            : DEFAULT_TEMPLATES.map((t, i) => ({ id: `default-${i}`, ...t })),
        }}
      >
        <Suspense>
          <AdminTopBar />
          {children}
          <PanelHost />
        </Suspense>
      </AdminProvider>
    </AppShell>
  );
}
