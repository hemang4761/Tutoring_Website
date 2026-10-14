"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { hashPassword, signIn, signOut } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/settings";
import { createToken, findValidToken } from "@/lib/tokens";
import { logActivity } from "@/lib/activity";
import { User } from "@/models";

export type FormState = { error?: string; success?: string } | undefined;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 60_000))) return { error: "Too many attempts. Wait a minute and try again." };
  const callbackUrl = String(formData.get("callbackUrl") || "");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "That email and password don't match an active account." };
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export async function setPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (password !== confirm) return { error: "Passwords don't match." };

  await connectDB();
  const record = await findValidToken(token);
  if (!record) return { error: "This link has expired or was already used. Ask an admin for a new one." };
  const user = await User.findById(record.user);
  if (!user || user.status === "disabled") return { error: "This account is no longer available." };

  user.passwordHash = await hashPassword(password);
  user.status = "active";
  await user.save();
  record.usedAt = new Date();
  await record.save();
  await logActivity({
    actor: user._id,
    action: record.type === "invite" ? "user.invite_accepted" : "user.password_reset",
    entityType: "user",
    entityId: user._id,
    summary: record.type === "invite" ? `${user.name} accepted their invite` : `${user.name} reset their password`,
  });

  try {
    await signIn("credentials", { email: user.email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) return { success: "Password set. You can now log in." };
    throw err;
  }
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("forgot", 5, 10 * 60_000))) return { error: "Too many requests. Try again later." };
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const done = { success: "If that email has an account, a reset link is on its way." };
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email." };

  await connectDB();
  const user = await User.findOne({ email, status: "active" });
  if (!user) return done;
  const token = await createToken(user._id, "reset");
  await sendEmail({
    to: user.email,
    kind: "password_reset",
    subject: "Reset your BCLearns password",
    heading: "Reset your password",
    paragraphs: [`Hi ${user.name.split(" ")[0]},`, "Use the button below to choose a new password. This link expires in 2 hours."],
    cta: { label: "Choose a new password", url: `${appUrl()}/reset/${token}` },
    footnote: "If you didn't request this, you can ignore this email.",
  });
  return done;
}
