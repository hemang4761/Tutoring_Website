"use server";

import { revalidatePath } from "next/cache";
import { assignTutorToLead } from "@/lib/assign";
import { logActivity } from "@/lib/activity";
import { postSystemMessage } from "@/lib/channels";
import { connectDB } from "@/lib/db";
import { adminEmails, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/settings";
import { ActionError, action, requireAdmin, requireUser } from "@/lib/session";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { ClaimRequest, Lead, TutorProfile } from "@/models";

const revalidate = (leadId?: string) => {
  revalidatePath("/admin", "layout");
  revalidatePath("/tutor", "layout");
};

export async function claimLead(leadId: string, message?: string) {
  return action(async () => {
    const tutor = await requireUser(["tutor"]);
    await connectDB();
    const lead = await Lead.findById(leadId);
    if (!lead) throw new ActionError("Lead not found.");
    if (!CLAIMABLE_STATUSES.includes(lead.status as (typeof CLAIMABLE_STATUSES)[number])) {
      throw new ActionError("This student is no longer available to claim.");
    }
    const existing = await ClaimRequest.findOne({ lead: lead._id, tutor: tutor._id, status: { $in: ["pending", "approved"] } });
    if (existing) throw new ActionError(existing.status === "pending" ? "You already claimed this student." : "You're already assigned.");

    const profile = await TutorProfile.findOne({ user: tutor._id });
    const activeCount = profile
      ? (await import("@/models")).Assignment.countDocuments({ tutor: tutor._id, status: "active" })
      : 0;
    if (profile && (await activeCount) >= profile.maxStudents) {
      throw new ActionError(`You're at your max of ${profile.maxStudents} students. Ask an admin to raise the cap.`);
    }

    const claim = await ClaimRequest.create({ lead: lead._id, tutor: tutor._id, message: message?.trim() });
    lead.lastActivityAt = new Date();
    await lead.save();
    await postSystemMessage(lead.channel, `${tutor.name} claimed this lead${message?.trim() ? `: ${message.trim()}` : "."}`);
    await logActivity({
      actor: tutor._id,
      action: "lead.claimed",
      entityType: "lead",
      entityId: lead._id,
      summary: `${tutor.name} claimed ${lead.students[0]?.name ?? lead.parent.name}`,
    });
    await sendEmail({
      to: await adminEmails(),
      kind: "claim_new",
      subject: `${tutor.name} claimed ${lead.students[0]?.name ?? lead.parent.name}`,
      heading: "New claim to review",
      paragraphs: message?.trim() ? [message.trim()] : [],
      details: [
        ["Tutor", tutor.name],
        ["Family", lead.parent.name],
        ["Student", lead.students.map((s) => `${s.name} (grade ${s.grade})`).join(", ")],
        ["Subjects", lead.subjects.join(", ")],
      ],
      cta: { label: "Review on the dashboard", url: `${appUrl()}/admin` },
    });
    revalidate(leadId);
    return claim._id.toString();
  }, "Claim submitted. An admin will review it.");
}

export async function withdrawClaim(claimId: string) {
  return action(async () => {
    const tutor = await requireUser(["tutor"]);
    await connectDB();
    const claim = await ClaimRequest.findById(claimId);
    if (!claim || claim.tutor.toString() !== tutor._id.toString()) throw new ActionError("Claim not found.");
    if (claim.status !== "pending") throw new ActionError("This claim can't be withdrawn.");
    claim.status = "withdrawn";
    await claim.save();
    revalidate(claim.lead.toString());
  }, "Claim withdrawn");
}

export async function decideClaim(claimId: string, decision: "approved" | "rejected", note?: string, rate?: number) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const claim = await ClaimRequest.findById(claimId);
    if (!claim || claim.status !== "pending") throw new ActionError("This claim is no longer pending.");
    if (decision === "approved") {
      await assignTutorToLead({
        leadId: claim.lead,
        tutorId: claim.tutor,
        actorId: admin._id,
        claimId: claim._id,
        rate,
      });
    } else {
      claim.status = "rejected";
      claim.decidedBy = admin._id;
      claim.decidedAt = new Date();
      claim.decisionNote = note;
      await claim.save();
      await postSystemMessage(claim.lead && (await Lead.findById(claim.lead))?.channel, `${admin.name} declined a claim.`);
    }
    revalidate(claim.lead.toString());
  }, decision === "approved" ? "Tutor assigned" : "Claim declined");
}
