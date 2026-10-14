"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/settings";
import { ActionError, action, requireAdmin } from "@/lib/session";
import { Assignment, Channel, Message, User } from "@/models";

const schema = z.object({
  audience: z.enum(["tutors", "everyone", "some"]),
  tutorIds: z.array(z.string()).optional().default([]),
  subject: z.string().trim().max(140).optional().default(""),
  body: z.string().trim().min(2, "Write a message").max(8000),
  email: z.boolean().optional().default(true),
});

// one message to the team: posted in #general and, by default, emailed too
export async function announce(input: z.input<typeof schema>) {
  return action(async () => {
    const admin = await requireAdmin();
    const data = schema.parse(input);
    await connectDB();
    const query: Record<string, unknown> = { status: { $ne: "disabled" }, _id: { $ne: admin._id } };
    if (data.audience === "tutors") query.role = "tutor";
    if (data.audience === "everyone") query.role = { $in: ["tutor", "admin"] };
    if (data.audience === "some") {
      if (!data.tutorIds.length) throw new ActionError("Pick at least one tutor.");
      query._id = { $in: data.tutorIds };
    }
    const people = await User.find(query).select("name email").lean();
    if (!people.length) throw new ActionError("Nobody matches that.");

    if (data.audience !== "some") {
      const general = await Channel.findOne({ kind: "general" });
      if (general) {
        await Message.create({ channel: general._id, author: admin._id, body: data.body });
        general.lastMessageAt = new Date();
        await general.save();
      }
    }
    if (data.email || data.audience === "some") {
      await sendEmail({
        to: people.map((p) => p.email),
        kind: "broadcast",
        subject: data.subject || `Message from ${admin.name.split(" ")[0]} at BCLearns`,
        heading: data.subject || "A note from BCLearns",
        paragraphs: data.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
        cta: { label: "Open BCLearns", url: `${appUrl()}/tutor` },
      });
    }
    revalidatePath("/admin/chat");
    revalidatePath("/tutor/chat");
    return people.length;
  }, "Sent");
}

export async function loadAssignmentOptions() {
  await requireAdmin();
  await connectDB();
  const rows = await Assignment.find({ status: "active" })
    .populate<{ tutor: { _id: unknown; name: string } }>("tutor", "name")
    .sort({ studentName: 1 })
    .lean();
  return rows.map((a) => ({
    id: String(a._id),
    student: a.studentName,
    tutor: a.tutor?.name ?? "",
    tutorId: String(a.tutor?._id ?? ""),
    subject: a.subjects?.[0] ?? "",
    leadId: String(a.lead),
  }));
}
