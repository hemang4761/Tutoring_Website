import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function PortalAccountPage() {
  const user = await requireUser(["family"]);
  return (
    <>
      <PageHeader title="Account" description="Your family portal login." />
      <div className="max-w-md rounded-xl border bg-card p-6 text-sm">
        <p><span className="text-muted-foreground">Name:</span> {user.name}</p>
        <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
        <p><span className="text-muted-foreground">Phone:</span> {user.phone || "—"}</p>
        <p className="mt-4 text-muted-foreground">Need a password reset? Use “Forgot password” on the login page, or email hello@bclearns.com.</p>
      </div>
    </>
  );
}
