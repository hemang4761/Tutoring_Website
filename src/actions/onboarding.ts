"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { adminEmails, sendEmail } from "@/lib/email";
import { DEFAULT_FAMILY_TEMPLATE, DEFAULT_TUTOR_TEMPLATE } from "@/lib/onboarding-defaults";
import { ActionError, action, requireAdmin, requireUser } from "@/lib/session";
import { OnboardingTemplate, TutorProfile, User } from "@/models";

export async function getTemplate(audience: "tutor" | "family") {
  await connectDB();
  const existing = await OnboardingTemplate.findOne({ audience }).lean();
  if (existing) return existing;
  const fallback = audience === "tutor" ? DEFAULT_TUTOR_TEMPLATE : DEFAULT_FAMILY_TEMPLATE;
  return { audience, ...fallback };
}

export async function saveOnboardingStep(stepKey: string, value: unknown) {
  return action(async () => {
    const user = await requireUser(["tutor", "family"], { allowIncompleteOnboarding: true });
    await connectDB();
    const fresh = await User.findById(user._id);
    if (!fresh) throw new ActionError("Account not found.");
    const existing = (fresh.onboarding?.responses ?? []).map((r) => ({
      stepKey: r.stepKey,
      value: r.stepKey === stepKey ? value : r.value,
      completedAt: r.stepKey === stepKey ? new Date() : r.completedAt,
    }));
    if (!existing.some((r) => r.stepKey === stepKey)) existing.push({ stepKey, value, completedAt: new Date() });
    fresh.set("onboarding.responses", existing);
    fresh.set("onboarding.status", fresh.onboarding?.status ?? "pending");
    await fresh.save();

    if (stepKey === "profile" && value && typeof value === "object") {
      const v = value as { name?: string; phone?: string; headline?: string; bio?: string; subjects?: string[] };
      if (v.name) fresh.name = v.name;
      if (v.phone) fresh.phone = v.phone;
      await fresh.save();
      if (user.role === "tutor") {
        await TutorProfile.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              ...(v.headline ? { headline: v.headline } : {}),
              ...(v.bio ? { bio: v.bio } : {}),
              ...(v.subjects ? { subjects: v.subjects } : {}),
            },
          },
          { upsert: true },
        );
      }
    }
    if (stepKey === "availability" && Array.isArray(value) && user.role === "tutor") {
      const slots = (value as Array<{ day: number; start?: string; end?: string; block?: string }>)
        .filter((s) => s.start && s.end)
        .map((s) => ({ day: s.day, start: s.start as string, end: s.end as string }));
      if (slots.length) {
        await TutorProfile.findOneAndUpdate({ user: user._id }, { $set: { availability: slots } }, { upsert: true });
      }
    }
    revalidatePath("/onboarding");
  }, "Saved");
}

export async function completeOnboarding() {
  return action(async () => {
    const user = await requireUser(["tutor", "family"], { allowIncompleteOnboarding: true });
    const template = await getTemplate(user.role === "tutor" ? "tutor" : "family");
    const done = new Set((user.onboarding?.responses ?? []).map((r) => r.stepKey));
    const missing = template.steps.filter((s) => s.required && !done.has(s.key));
    if (missing.length) throw new ActionError(`Still need: ${missing.map((s) => s.title).join(", ")}`);
    await connectDB();
    await User.updateOne(
      { _id: user._id },
      { $set: { "onboarding.status": "complete", "onboarding.completedAt": new Date(), status: "active" } },
    );
    if (user.role === "tutor") {
      await TutorProfile.updateOne({ user: user._id }, { $set: { status: "active" } });
    }
    await logActivity({
      actor: user._id,
      action: "onboarding.complete",
      entityType: "user",
      entityId: user._id,
      summary: `${user.name} finished ${user.role} onboarding`,
    });
    await sendEmail({
      to: await adminEmails(),
      kind: "onboarding_complete",
      subject: `${user.name} finished onboarding`,
      heading: `${user.name} is ready`,
      paragraphs: [`${user.name} completed ${user.role} onboarding and now has full access.`],
    });
    revalidatePath("/onboarding");
    revalidatePath("/admin", "layout");
    revalidatePath("/tutor", "layout");
    revalidatePath("/portal", "layout");
  }, "Onboarding complete");
}

export async function saveOnboardingTemplate(
  audience: "tutor" | "family",
  intro: string,
  steps: Array<{ key: string; type: string; title: string; description?: string; body?: string; options?: string[]; required: boolean }>,
) {
  return action(async () => {
    const admin = await requireAdmin();
    if (!steps.length) throw new ActionError("Add at least one step.");
    await connectDB();
    await OnboardingTemplate.findOneAndUpdate(
      { audience },
      { $set: { intro, steps, updatedBy: admin._id } },
      { upsert: true },
    );
    revalidatePath("/admin/settings");
    revalidatePath("/onboarding");
  }, "Template saved");
}
