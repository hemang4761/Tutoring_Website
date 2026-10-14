"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { activeTutorEmails, adminEmails, sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { createLeadChannel, postSystemMessage } from "@/lib/channels";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl, getSettings } from "@/lib/settings";
import { DAYS, FORMATS, TIME_BLOCKS } from "@/lib/constants";
import { applicationSchema, leadSchema, type ApplicationInput, type LeadInput } from "@/lib/validation";
import { Lead, TutorApplication, User } from "@/models";

type Result = { ok: true } | { ok: false; error: string };

export async function submitLead(input: LeadInput): Promise<Result> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const data = parsed.data;
  // bots fill the hidden field; pretend success
  if (data.website) return { ok: true };
  if (!(await rateLimit("lead", 5, 60 * 60_000))) {
    return { ok: false, error: "We've received several submissions from you. Please text us at (201) 951-7942." };
  }

  await connectDB();
  const subjects = [...new Set(data.students.flatMap((s) => s.subjects))];
  const lead = await Lead.create({
    parent: data.parent,
    students: data.students,
    subjects,
    services: data.services,
    goals: data.goals,
    format: data.format,
    location: data.location,
    availability: data.availability,
    availabilityNotes: data.availabilityNotes,
    sessionsPerWeek: data.sessionsPerWeek,
    startTiming: data.startTiming,
    source: data.source,
    referral: data.referral,
    message: data.message,
    status: "new",
  });
  const channel = await createLeadChannel(lead);
  lead.channel = channel._id;
  await lead.save();

  const studentLine = data.students.map((s) => `${s.name} (grade ${s.grade})`).join(", ");
  await postSystemMessage(channel._id, `New lead from the onboarding form: ${studentLine} · ${subjects.join(", ")}`);
  await logActivity({ action: "lead.created", entityType: "lead", entityId: lead._id, summary: "Lead submitted via onboarding form" });

  const format = FORMATS.find((f) => f.key === data.format)?.label ?? data.format;
  const when = data.availability.length
    ? data.availability.map((a) => `${DAYS[a.day]} ${TIME_BLOCKS.find((b) => b.key === a.block)?.label.toLowerCase()}`).join(", ")
    : data.availabilityNotes || "Not specified";
  const grades = [...new Set(data.students.map((s) => s.grade))].join(", ");

  const settings = await getSettings();
  const [admins, tutors] = await Promise.all([
    adminEmails(),
    settings.notifyTutorsOnNewLead ? activeTutorEmails() : Promise.resolve([] as string[]),
  ]);

  await Promise.all([
    sendEmail({
      to: admins,
      kind: "lead_new_admin",
      subject: `New lead: ${data.parent.name} · ${subjects.slice(0, 2).join(", ")}`,
      heading: "A new family just signed up",
      preview: `${studentLine} needs help with ${subjects.join(", ")}`,
      details: [
        ["Parent", `${data.parent.name} (${data.parent.email}, ${data.parent.phone})`],
        ["Students", studentLine],
        ["Subjects", subjects.join(", ")],
        ["Format", `${format}${data.location ? ` · ${data.location}` : ""}`],
        ["Availability", when],
        ["Source", data.source || "Not specified"],
      ],
      paragraphs: data.goals ? [`Goals: ${data.goals}`] : [],
      cta: { label: "Open lead", url: `${appUrl()}/admin/leads/${lead._id}` },
    }),
    sendEmail({
      to: tutors.filter((t) => !admins.includes(t)),
      kind: "lead_new_tutor",
      subject: `New student available: ${subjects.slice(0, 2).join(", ")} (grade ${grades})`,
      heading: "A new student is up for grabs",
      preview: `Grade ${grades} · ${subjects.join(", ")}`,
      paragraphs: ["A new family is looking for a tutor. If it's a good fit for you, claim it on the claim board and an admin will review."],
      details: [
        ["Grade", grades],
        ["Subjects", subjects.join(", ")],
        ["Format", format],
        ["Availability", when],
      ],
      cta: { label: "View on the claim board", url: `${appUrl()}/tutor/claim-board` },
    }),
    sendEmail({
      to: data.parent.email,
      kind: "lead_confirmation",
      subject: "We received your BCLearns request",
      heading: `Thanks, ${data.parent.name.split(" ")[0]}!`,
      paragraphs: [
        "We've received your information and will reach out within 24–48 hours to match your student with a tutor.",
        "Once you're matched, we'll send you a link to your family portal where you can see your schedule and session notes.",
      ],
      details: [
        ["Students", studentLine],
        ["Subjects", subjects.join(", ")],
      ],
    }),
  ]);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function submitApplication(input: ApplicationInput): Promise<Result> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const data = parsed.data;
  if (data.website) return { ok: true };
  if (!(await rateLimit("apply", 3, 60 * 60_000))) return { ok: false, error: "Too many submissions. Try again later." };

  await connectDB();
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) {
    return { ok: false, error: "An account with this email already exists. Try logging in instead." };
  }
  if (await TutorApplication.exists({ email, status: "pending" })) {
    return { ok: false, error: "You already have an application under review. We'll be in touch soon!" };
  }

  const app = await TutorApplication.create({ ...data, email });
  await logActivity({ action: "application.created", entityType: "application", entityId: app._id, summary: `${data.name} applied to tutor` });

  await Promise.all([
    sendEmail({
      to: await adminEmails(),
      kind: "application_new",
      subject: `New tutor application: ${data.name}`,
      heading: "New tutor application",
      details: [
        ["Name", `${data.name} (${email})`],
        ["School", `${data.school}, class of ${data.gradYear}`],
        ["Subjects", data.subjects.join(", ")],
        ["SAT", data.satScore || "Not provided"],
        ["Hours per week", data.hoursPerWeek],
      ],
      cta: { label: "Review application", url: `${appUrl()}/admin/tutors?tab=applications` },
    }),
    sendEmail({
      to: email,
      kind: "application_confirmation",
      subject: "We received your BCLearns tutor application",
      heading: `Thanks for applying, ${data.name.split(" ")[0]}!`,
      paragraphs: [
        "An admin will review your application soon. If approved, you'll get an email invite to set up your tutor account.",
      ],
    }),
  ]);
  revalidatePath("/admin/tutors");
  return { ok: true };
}
