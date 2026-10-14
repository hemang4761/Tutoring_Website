import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeFor } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { User, type UserDoc } from "@/models";

export type CurrentUser = UserDoc;

// fresh db lookup per request so role/onboarding changes apply immediately
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).lean<CurrentUser>();
  if (!user || user.status === "disabled") return null;
  return user;
});

export function isOnboarded(user: Pick<CurrentUser, "role" | "onboarding">) {
  return user.role === "admin" || user.onboarding?.status === "complete";
}

export async function requireUser(roles?: Role[], opts: { allowIncompleteOnboarding?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  if (!opts.allowIncompleteOnboarding && !isOnboarded(user)) redirect("/onboarding");
  return user;
}

export const requireAdmin = () => requireUser(["admin"]);
export const requireStaff = () => requireUser(["admin", "tutor"]);

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

// wraps server actions so thrown errors become a friendly result instead of a crash
export async function action<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message };
  } catch (err) {
    if (err instanceof Error && (err.message === "NEXT_REDIRECT" || "digest" in err)) throw err;
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error("[action] unexpected error", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
