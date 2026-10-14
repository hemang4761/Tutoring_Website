import Link from "next/link";
import { connectDB } from "@/lib/db";
import { findValidToken } from "@/lib/tokens";
import { User } from "@/models";
import { SetPasswordForm } from "./auth-forms";

export async function TokenPage({ token, type }: { token: string; type: "invite" | "reset" }) {
  await connectDB();
  const record = await findValidToken(token, type);
  const user = record ? await User.findById(record.user).select("name role").lean() : null;

  if (!record || !user) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Link expired</h2>
        <p className="text-sm text-muted-foreground">
          This link has expired or was already used. {type === "invite" ? "Ask an admin to resend your invite." : "Request a new reset link."}
        </p>
        <Link href={type === "invite" ? "/login" : "/forgot-password"} className="text-sm font-medium underline">
          {type === "invite" ? "Go to login" : "Request a new link"}
        </Link>
      </div>
    );
  }

  const first = user.name.split(" ")[0];
  const roleCopy = user.role === "family" ? "family portal" : user.role === "tutor" ? "tutor account" : "admin account";
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold">{type === "invite" ? `Welcome, ${first}!` : "Choose a new password"}</h2>
        <p className="text-sm text-muted-foreground">
          {type === "invite"
            ? `Set a password to activate your BCLearns ${roleCopy}. Next you'll complete a short onboarding checklist.`
            : `Hi ${first}, choose a new password for your account.`}
        </p>
      </div>
      <SetPasswordForm token={token} cta={type === "invite" ? "Activate account" : "Update password"} />
    </div>
  );
}
