import "server-only";
import { Resend } from "resend";
import { NotificationEmail, type NotificationEmailProps } from "@/emails/notification-email";
import { connectDB } from "@/lib/db";
import { EmailLog, Settings, User } from "@/models";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "BCLearns <onboarding@resend.dev>";

export type EmailInput = NotificationEmailProps & {
  to: string | string[];
  subject: string;
  kind: string;
  replyTo?: string;
};

// sends one email per recipient so addresses are never exposed to each other
export async function sendEmail({ to, subject, kind, replyTo, ...template }: EmailInput) {
  const recipients = [...new Set((Array.isArray(to) ? to : [to]).filter(Boolean).map((e) => e.toLowerCase()))];
  if (!recipients.length) return;
  await connectDB();

  if (!resend) {
    console.log(`[email] skipped (no RESEND_API_KEY) kind=${kind} to=${recipients.join(",")} subject="${subject}"`);
    await EmailLog.create({ to: recipients, subject, kind, status: "skipped", error: "RESEND_API_KEY not set" });
    return;
  }

  try {
    for (let i = 0; i < recipients.length; i += 100) {
      const chunk = recipients.slice(i, i + 100);
      const { data, error } = await resend.batch.send(
        chunk.map((addr) => ({
          from: FROM,
          to: addr,
          subject,
          replyTo: replyTo || process.env.EMAIL_REPLY_TO || undefined,
          react: <NotificationEmail {...template} />,
        })),
      );
      if (error) throw new Error(error.message);
      await EmailLog.create({
        to: chunk,
        subject,
        kind,
        status: "sent",
        providerId: data?.data?.map((d) => d.id).join(","),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] failed kind=${kind}: ${message}`);
    await EmailLog.create({ to: recipients, subject, kind, status: "failed", error: message });
  }
}

export async function adminEmails() {
  await connectDB();
  const admins = await User.find({ role: "admin", status: { $ne: "disabled" }, notifyByEmail: true })
    .select("email")
    .lean();
  const settings = await Settings.findOne({ key: "global" }).select("extraNotifyEmails").lean();
  return [...admins.map((a) => a.email), ...(settings?.extraNotifyEmails ?? [])];
}

export async function activeTutorEmails() {
  await connectDB();
  const tutors = await User.find({
    role: "tutor",
    status: "active",
    "onboarding.status": "complete",
    notifyByEmail: true,
  })
    .select("email")
    .lean();
  return tutors.map((t) => t.email);
}
