import Link from "next/link";
import { LoginForm } from "../auth-forms";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Log in to your tutor, admin, or family account.</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
      <div className="space-y-2 border-t pt-5 text-sm text-muted-foreground">
        <p>
          New family?{" "}
          <Link href="/get-started" className="font-medium text-foreground underline-offset-4 hover:underline">
            Start onboarding
          </Link>
        </p>
        <p>
          Want to tutor with us?{" "}
          <Link href="/apply" className="font-medium text-foreground underline-offset-4 hover:underline">
            Apply here
          </Link>
        </p>
        <p className="text-xs">Accounts are created by invite. Check your email for an invite link.</p>
      </div>
    </div>
  );
}
