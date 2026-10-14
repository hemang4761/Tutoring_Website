"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { forgotPasswordAction, loginAction, setPasswordAction, type FormState } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.success) return null;
  const error = Boolean(state.error);
  return (
    <div
      role="status"
      className={
        error
          ? "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          : "flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
      }
    >
      {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      {state.error ?? state.success}
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(loginAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="h-10 w-full" pendingText="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="h-10 w-full" pendingText="Sending...">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function SetPasswordForm({ token, cta }: { token: string; cta: string }) {
  const [state, formAction] = useActionState(setPasswordAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <p className="text-xs text-muted-foreground">At least 8 characters with a letter and a number.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <FormMessage state={state} />
      {state?.success ? (
        <Link href="/login" className="block text-center text-sm font-medium underline">
          Go to login
        </Link>
      ) : (
        <SubmitButton className="h-10 w-full" pendingText="Saving...">
          {cta}
        </SubmitButton>
      )}
    </form>
  );
}
