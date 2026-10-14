import "server-only";
import type { Types } from "mongoose";
import { logActivity } from "@/lib/activity";
import { postSystemMessage } from "@/lib/channels";
import { sendEmail } from "@/lib/email";
import { appUrl, rateFor } from "@/lib/settings";
import { ActionError } from "@/lib/session";
import { Assignment, ClaimRequest, Lead, User } from "@/models";

type Id = Types.ObjectId | string;

// creates an assignment and moves the lead forward; used by direct assignment and claim approval
export async function assignTutorToLead(input: {
  leadId: Id;
  tutorId: Id;
  actorId: Id;
  studentId?: string;
  subjects?: string[];
  rateTier?: string;
  claimId?: Id;
}) {
  const lead = await Lead.findById(input.leadId);
  if (!lead) throw new ActionError("Lead not found.");
  const tutor = await User.findOne({ _id: input.tutorId, role: "tutor" });
  if (!tutor) throw new ActionError("Tutor not found.");

  const students = input.studentId ? lead.students.filter((s) => s._id.toString() === input.studentId) : lead.students;
  if (!students.length) throw new ActionError("This lead has no students yet.");

  const rateTier = (input.rateTier || lead.rateTier || "hs") as "k8" | "hs" | "testprep" | "specialized";
  const rate = await rateFor(rateTier);
  const assignments: Array<{ _id: { toString(): string } }> = [];
  for (const student of students) {
    const exists = await Assignment.findOne({ lead: lead._id, studentId: student._id, tutor: tutor._id, status: { $ne: "ended" } });
    if (exists) continue;
    assignments.push(
      await Assignment.create({
        lead: lead._id,
        studentId: student._id,
        studentName: student.name,
        tutor: tutor._id,
        subjects: input.subjects?.length ? input.subjects : student.subjects,
        rateTier,
        rate,
        createdBy: input.actorId,
      }),
    );
  }
  if (!assignments.length) throw new ActionError(`${tutor.name} is already assigned to this student.`);

  if (!lead.assignedTutors.some((t) => t.toString() === tutor._id.toString())) lead.assignedTutors.push(tutor._id);
  if (["new", "contacted", "open", "claimed"].includes(lead.status)) lead.status = "assigned";
  lead.assignedAt ??= new Date();
  if (!lead.rateTier) lead.rateTier = rateTier;
  lead.lastActivityAt = new Date();
  await lead.save();

  // approve this tutor's claim and decline the rest
  const now = new Date();
  if (input.claimId) {
    await ClaimRequest.updateOne({ _id: input.claimId }, { status: "approved", decidedBy: input.actorId, decidedAt: now });
  } else {
    await ClaimRequest.updateMany(
      { lead: lead._id, tutor: tutor._id, status: "pending" },
      { status: "approved", decidedBy: input.actorId, decidedAt: now },
    );
  }
  const losers = await ClaimRequest.find({ lead: lead._id, status: "pending" }).populate<{ tutor: { email: string; name: string } }>("tutor", "email name");
  await ClaimRequest.updateMany(
    { lead: lead._id, status: "pending" },
    { status: "rejected", decidedBy: input.actorId, decidedAt: now, decisionNote: "Another tutor was assigned" },
  );

  const studentNames = students.map((s) => s.name).join(", ");
  await logActivity({
    actor: input.actorId,
    action: "lead.assigned",
    entityType: "lead",
    entityId: lead._id,
    summary: `Assigned ${tutor.name} to ${studentNames}`,
  });
  await postSystemMessage(lead.channel, `${tutor.name} was assigned to ${studentNames}.`);

  await Promise.all([
    sendEmail({
      to: tutor.email,
      kind: "assignment_new",
      subject: `You've been assigned: ${studentNames}`,
      heading: "You have a new student!",
      paragraphs: [
        `You're now the tutor for ${studentNames}. Reach out to the family to set up your first session, then add it to your schedule.`,
      ],
      details: [
        ["Parent", `${lead.parent.name} · ${lead.parent.email}${lead.parent.phone ? ` · ${lead.parent.phone}` : ""}`],
        ["Subjects", (input.subjects?.length ? input.subjects : lead.subjects).join(", ")],
        ["Rate", `$${rate}/hr`],
      ],
      cta: { label: "Open my students", url: `${appUrl()}/tutor/students` },
    }),
    ...losers.map((c) =>
      sendEmail({
        to: c.tutor.email,
        kind: "claim_declined",
        subject: "Update on your claim",
        heading: "This student was matched with another tutor",
        paragraphs: [`Thanks for claiming ${studentNames}. This time another tutor was a better fit. Keep an eye on the claim board for new students!`],
        cta: { label: "View claim board", url: `${appUrl()}/tutor/claim-board` },
      }),
    ),
  ]);

  return { lead, assignments, tutor };
}
