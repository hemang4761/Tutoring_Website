"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { sendInvite } from "@/lib/invites";
import { sendEmail } from "@/lib/email";
import { ActionError, action, requireAdmin, requireUser } from "@/lib/session";
import { TutorApplication, TutorProfile, User } from "@/models";

const refresh = () => {
  revalidatePath("/admin/tutors");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
};

export async function reviewApplication(applicationId: string, decision: "approved" | "rejected", note?: string) {
  return action(async () => {
    const admin = await requireAdmin();
    await connectDB();
    const app = await TutorApplication.findById(applicationId);
    if (!app || app.status !== "pending") throw new ActionError("This application is no longer pending.");
    app.status = decision;
    app.reviewedBy = admin._id;
    app.reviewedAt = new Date();
    app.reviewNote = note;
    if (decision === "rejected") {
      await app.save();
      await sendEmail({
        to: app.email,
        kind: "application_rejected",
        subject: "Update on your BCLearns tutor application",
        heading: `Thanks for applying, ${app.name.split(" ")[0]}`,
        paragraphs: [
          "We reviewed your application and don't have a spot that fits right now. You're welcome to apply again later.",
          note || "",
        ].filter(Boolean),
      });
      refresh();
      return;
    }
    if (await User.exists({ email: app.email })) throw new ActionError("An account with this email already exists.");
    const user = await User.create({
      name: app.name,
      email: app.email,
      phone: app.phone,
      role: "tutor",
      status: "invited",
    });
    const profile = await TutorProfile.create({
      user: user._id,
      headline: `${app.subjects.slice(0, 2).join(" & ")} Tutor`,
      bio: app.experience ?? "",
      school: app.school ?? "Bergen County Academies",
      gradYear: app.gradYear ?? "",
      subjects: app.subjects,
      gradeLevels: app.gradeLevels,
      status: "invited",
      application: app._id,
    });
    user.tutorProfile = profile._id;
    await user.save();
    app.user = user._id;
    await app.save();
    await sendInvite(user);
    await logActivity({
      actor: admin._id,
      action: "application.approved",
      entityType: "application",
      entityId: app._id,
      summary: `Approved ${app.name} and sent a tutor invite`,
    });
    refresh();
  }, decision === "approved" ? "Invite sent" : "Application declined");
}

export async function resendInvite(userId: string) {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    const user = await User.findById(userId);
    if (!user) throw new ActionError("User not found.");
    if (user.status === "disabled") throw new ActionError("This account is disabled.");
    await sendInvite(user);
  }, "Invite resent");
}

const profileSchema = z.object({
  headline: z.string().trim().max(140).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  subjects: z.array(z.string()).optional(),
  gradeLevels: z.array(z.string()).optional(),
  maxStudents: z.number().int().min(1).max(20).optional(),
  showOnSite: z.boolean().optional(),
  siteOrder: z.number().int().optional(),
  photoUrl: z.string().optional(),
  school: z.string().trim().max(120).optional(),
  gradYear: z.string().trim().max(8).optional(),
});

export async function updateTutorProfile(tutorUserId: string, input: z.input<typeof profileSchema>) {
  return action(async () => {
    const actor = await requireUser(["admin", "tutor"]);
    if (actor.role === "tutor" && actor._id.toString() !== tutorUserId) throw new ActionError("Not allowed.");
    const data = profileSchema.parse(input);
    await connectDB();
    const user = await User.findById(tutorUserId);
    if (!user || user.role !== "tutor") throw new ActionError("Tutor not found.");
    if (data.phone !== undefined) user.phone = data.phone;
    await user.save();
    const profile = await TutorProfile.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          ...(data.headline !== undefined ? { headline: data.headline } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.subjects ? { subjects: data.subjects } : {}),
          ...(data.gradeLevels ? { gradeLevels: data.gradeLevels } : {}),
          ...(data.maxStudents ? { maxStudents: data.maxStudents } : {}),
          ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
          ...(data.school !== undefined ? { school: data.school } : {}),
          ...(data.gradYear !== undefined ? { gradYear: data.gradYear } : {}),
          ...(actor.role === "admin" && data.showOnSite !== undefined ? { showOnSite: data.showOnSite } : {}),
          ...(actor.role === "admin" && data.siteOrder !== undefined ? { siteOrder: data.siteOrder } : {}),
        },
      },
      { new: true, upsert: true },
    );
    user.tutorProfile = profile._id;
    await user.save();
    revalidatePath("/tutor/profile");
    revalidatePath(`/admin/tutors/${user._id}`);
    refresh();
  }, "Profile saved");
}

export async function setTutorStatus(tutorUserId: string, status: "active" | "inactive") {
  return action(async () => {
    await requireAdmin();
    await connectDB();
    const user = await User.findById(tutorUserId);
    if (!user) throw new ActionError("Tutor not found.");
    user.status = status === "inactive" ? "disabled" : "active";
    await user.save();
    await TutorProfile.updateOne({ user: user._id }, { status });
    refresh();
  }, "Tutor updated");
}

const adminSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
});

export async function inviteAdmin(input: z.input<typeof adminSchema>) {
  return action(async () => {
    const actor = await requireAdmin();
    const data = adminSchema.parse(input);
    await connectDB();
    const email = data.email.toLowerCase();
    if (await User.exists({ email })) throw new ActionError("That email already has an account.");
    const user = await User.create({
      name: data.name,
      email,
      role: "admin",
      status: "invited",
      onboarding: { status: "complete", completedAt: new Date() },
    });
    await sendInvite(user);
    await logActivity({
      actor: actor._id,
      action: "admin.invited",
      entityType: "user",
      entityId: user._id,
      summary: `${actor.name} invited ${data.name} as an admin`,
    });
    revalidatePath("/admin/settings");
  }, "Admin invite sent");
}
