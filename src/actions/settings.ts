"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { adminEmails, sendEmail } from "@/lib/email";
import { ActionError, action, requireAdmin } from "@/lib/session";
import { EmailLog, Settings, User } from "@/models";

const settingsSchema = z.object({
  orgName: z.string().trim().min(1).max(80),
  replyTo: z.string().trim().email().or(z.literal("")),
  notifyTutorsOnNewLead: z.boolean(),
  extraNotifyEmails: z.string().optional().default(""),
  remindersEnabled: z.boolean(),
  digestEnabled: z.boolean(),
  rateTiers: z.array(z.object({ key: z.string(), label: z.string(), rate: z.number().min(0) })),
});

export async function saveSettings(input: z.input<typeof settingsSchema>) {
  return action(async () => {
    await requireAdmin();
    const data = settingsSchema.parse(input);
    await connectDB();
    await Settings.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          orgName: data.orgName,
          replyTo: data.replyTo,
          notifyTutorsOnNewLead: data.notifyTutorsOnNewLead,
          extraNotifyEmails: data.extraNotifyEmails
            .split(/[,\s]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
          remindersEnabled: data.remindersEnabled,
          digestEnabled: data.digestEnabled,
          rateTiers: data.rateTiers,
        },
      },
      { upsert: true },
    );
    revalidatePath("/admin/settings");
  }, "Settings saved");
}

const broadcastSchema = z.object({
  audience: z.enum(["all_tutors", "active_tutors", "admins", "all_staff"]),
  subject: z.string().trim().min(3).max(140),
  heading: z.string().trim().min(3).max(140),
  body: z.string().trim().min(3).max(8000),
});

export async function broadcastEmail(input: z.input<typeof broadcastSchema>) {
  return action(async () => {
    await requireAdmin();
    const data = broadcastSchema.parse(input);
    await connectDB();
    let query: Record<string, unknown> = { status: { $ne: "disabled" }, notifyByEmail: true };
    if (data.audience === "all_tutors") query = { ...query, role: "tutor" };
    if (data.audience === "active_tutors") query = { ...query, role: "tutor", status: "active", "onboarding.status": "complete" };
    if (data.audience === "admins") query = { ...query, role: "admin" };
    if (data.audience === "all_staff") query = { ...query, role: { $in: ["admin", "tutor"] } };
    const users = await User.find(query).select("email").lean();
    const emails = users.map((u) => u.email);
    if (!emails.length) throw new ActionError("No recipients match that audience.");
    await sendEmail({
      to: emails,
      kind: "broadcast",
      subject: data.subject,
      heading: data.heading,
      paragraphs: data.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    });
    return emails.length;
  }, "Email sent");
}

export async function loadEmailLogs() {
  await requireAdmin();
  await connectDB();
  return EmailLog.find().sort({ createdAt: -1 }).limit(50).lean();
}

export { adminEmails };

const templatesSchema = z.array(z.object({ label: z.string().trim().min(1).max(60), body: z.string().trim().min(1).max(1000) })).max(30);

export async function saveTemplates(input: z.input<typeof templatesSchema>) {
  return action(async () => {
    await requireAdmin();
    const data = templatesSchema.parse(input);
    await connectDB();
    await Settings.findOneAndUpdate({ key: "global" }, { $set: { templates: data } }, { upsert: true });
    revalidatePath("/admin", "layout");
  }, "Templates saved");
}
