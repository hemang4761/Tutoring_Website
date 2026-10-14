"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { adminEmails, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/settings";
import { ActionError, action, requireStaff, requireUser } from "@/lib/session";
import { REQUEST_STATUSES, REQUEST_TYPES, type RequestStatus } from "@/lib/constants";
import { AdminRequest } from "@/models";

const createSchema = z.object({
  type: z.enum(REQUEST_TYPES),
  title: z.string().trim().min(3, "Give this a short title").max(140),
  body: z.string().trim().max(4000).optional().default(""),
  leadId: z.string().optional(),
  sessionId: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
});

const refresh = (id?: string) => {
  revalidatePath("/admin");
  revalidatePath("/tutor/requests");
  revalidatePath("/portal/requests");
  revalidatePath("/admin", "layout");
  revalidatePath("/tutor", "layout");
};

export async function createRequest(input: z.input<typeof createSchema>) {
  return action(async () => {
    const user = await requireUser(["tutor", "family"]);
    const data = createSchema.parse(input);
    await connectDB();
    const req = await AdminRequest.create({
      requester: user._id,
      requesterRole: user.role,
      type: data.type,
      title: data.title,
      body: data.body,
      lead: data.leadId || user.lead || undefined,
      session: data.sessionId || undefined,
      priority: data.priority,
    });
    await logActivity({
      actor: user._id,
      action: "request.created",
      entityType: "request",
      entityId: req._id,
      summary: `${user.name} requested: ${data.title}`,
    });
    await sendEmail({
      to: await adminEmails(),
      kind: "request_new",
      subject: `New ${data.type.replace("_", " ")} request from ${user.name}`,
      heading: data.title,
      paragraphs: [data.body || `${user.name} submitted a request.`],
      details: [
        ["From", `${user.name} (${user.role})`],
        ["Type", data.type.replace(/_/g, " ")],
      ],
      cta: { label: "Open the dashboard", url: `${appUrl()}/admin` },
    });
    refresh();
    return req._id.toString();
  }, "Request sent to admins");
}

export async function replyToRequest(requestId: string, body: string) {
  return action(async () => {
    const user = await requireStaff();
    const text = body.trim();
    if (!text) throw new ActionError("Reply can't be empty.");
    await connectDB();
    const req = await AdminRequest.findById(requestId);
    if (!req) throw new ActionError("Request not found.");
    if (user.role === "tutor" && req.requester.toString() !== user._id.toString()) {
      throw new ActionError("Not allowed.");
    }
    req.replies.push({ author: user._id, body: text });
    if (user.role === "admin" && req.status === "open") req.status = "in_progress";
    await req.save();
    refresh();
  }, "Reply sent");
}

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  return action(async () => {
    const user = await requireUser(["admin"]);
    if (!REQUEST_STATUSES.includes(status)) throw new ActionError("Unknown status.");
    await connectDB();
    const req = await AdminRequest.findById(requestId);
    if (!req) throw new ActionError("Request not found.");
    req.status = status;
    if (status === "resolved" || status === "declined") req.resolvedAt = new Date();
    if (!req.assignee) req.assignee = user._id;
    await req.save();
    refresh();
  }, "Request updated");
}
