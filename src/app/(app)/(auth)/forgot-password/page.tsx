import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "../auth-forms";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to login
      </Link>
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
