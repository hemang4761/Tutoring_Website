import "server-only";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/settings";
import { createToken } from "@/lib/tokens";
import type { UserDoc } from "@/models";

const COPY = {
  admin: {
    subject: "You've been added as a BCLearns admin",
    body: "You've been given admin access to the BCLearns CRM. Set your password to get started.",
  },
  tutor: {
    subject: "Welcome to the BCLearns tutor team",
    body: "Your tutor application was approved! Set your password, then finish a short onboarding checklist to unlock the claim board, your schedule, and the team chat.",
  },
  family: {
    subject: "Your BCLearns family portal is ready",
    body: "We've matched your student with a tutor. Set your password and complete a quick onboarding checklist to see your schedule, session notes, and hours.",
  },
} as const;

export async function sendInvite(user: Pick<UserDoc, "_id" | "name" | "email" | "role">, extra?: string) {
  const token = await createToken(user._id, "invite");
  const url = `${appUrl()}/invite/${token}`;
  const copy = COPY[user.role];
  await sendEmail({
    to: user.email,
    kind: `invite_${user.role}`,
    subject: copy.subject,
    heading: `Hi ${user.name.split(" ")[0]}, you're invited`,
    paragraphs: [copy.body, ...(extra ? [extra] : [])],
    cta: { label: "Set your password", url },
    footnote: "This invite link expires in 7 days.",
  });
  return url;
}
