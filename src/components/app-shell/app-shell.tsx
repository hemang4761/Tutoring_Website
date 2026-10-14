import { getNavBadges } from "@/lib/queries/badges";
import type { CurrentUser } from "@/lib/session";
import { NAV } from "./nav-config";
import { AppSidebar } from "./sidebar";

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  // not awaited: the page renders while badge counts stream into the sidebar
  const badges = getNavBadges(user).catch(() => ({}));
  return (
    <div className="min-h-svh bg-background">
      <AppSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        sections={NAV[user.role]}
        badges={badges}
      />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
