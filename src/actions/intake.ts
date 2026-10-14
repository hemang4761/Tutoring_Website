"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { activeTutorEmails, adminEmails, sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { createLeadChannel, postSystemMessage } from "@/lib/channels";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl, getSettings } from "@/lib/settings";
import { applicationSchema, leadSchema, type ApplicationInput, type LeadData } from "@/lib/validation";
import { Lead, TutorApplication, User } from "@/models";

type Result = { ok: true } | { ok: false; error: string };

export async function submitLead(input: LeadData): Promise<Result> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const data = parsed.data;
  if (data.website) return { ok: true };
  if (!(await rateLimit("lead", 5, 60 * 60_000))) {
    return { ok: false, error: "We've received several submissions from you. Please email us at hello@bclearns.com." };
  }

  const wantsTutoring = data.service === "tutoring";
  const wantsCollege = data.service === "college" || data.alsoConsulting === "yes";
  const courseList = data.courses
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const subjects = [
    ...new Set([
      ...(wantsTutoring && data.tutoringRequest ? [data.tutoringRequest] : []),
      ...courseList,
      ...(wantsCollege ? ["College Consulting"] : []),
    ]),
  ];
  const services = [
    ...(wantsTutoring ? [data.tutoringRequest || "Academic Tutoring"] : []),
    ...(wantsCollege ? ["College Consulting"] : []),
  ];
  const respondent = data.respondent === "parent" ? "parent" : "student";
  const service = data.service === "college" ? "college" : "tutoring";
  const who = respondent === "parent" ? "Parent/guardian" : "Student";

  await connectDB();
  const lead = await Lead.create({
    parent: { name: data.name, email: data.email, phone: data.phone, preferredContact: "email" },
    students: [{ name: data.name, grade: data.grade, school: "", subjects }],
    subjects,
    services,
    goals: data.consultingGoals,
    sessionsPerWeek: data.hoursPerWeek,
    message: data.comments,
    source: "Website",
    status: "new",
    intake: {
      respondent,
      service,
      tutoringRequest: data.tutoringRequest,
      courses: data.courses,
      hoursPerWeek: data.hoursPerWeek,
      comments: data.comments,
      alsoConsulting: data.alsoConsulting === "yes",
      careerInterests: data.careerInterests,
      academics: data.academics,
      extracurriculars: data.extracurriculars,
      collegeList: data.collegeList,
      consultingGoals: data.consultingGoals,
    },
  });
  const channel = await createLeadChannel(lead);
  lead.channel = channel._id;
  await lead.save();

  const studentLine = `${data.name} (grade ${data.grade})`;
  await postSystemMessage(channel._id, `New request: ${who} ${studentLine} · ${services.join(", ")}`);
  await logActivity({ action: "lead.created", entityType: "lead", entityId: lead._id, summary: "New request from the website" });

  const details: Array<[string, string]> = [
    ["Contact", `${data.name} (${data.email}, ${data.phone})`],
    ["Submitted as", who],
    ["Grade", data.grade],
    ["Looking for", services.join(", ") || "Not specified"],
  ];
  if (wantsTutoring) {
    details.push(["Tutoring request", data.tutoringRequest || "—"]);
    details.push(["Courses", data.courses || "—"]);
    details.push(["Hours per week", data.hoursPerWeek || "—"]);
  }
  if (wantsCollege) {
    if (data.careerInterests) details.push(["Career interests", data.careerInterests]);
    if (data.academics) details.push(["Academics", data.academics]);
    if (data.extracurriculars) details.push(["Activities", data.extracurriculars]);
    if (data.collegeList) details.push(["College list", data.collegeList]);
    if (data.consultingGoals) details.push(["Consulting goals", data.consultingGoals]);
  }
  if (data.comments) details.push(["Comments", data.comments]);

  const settings = await getSettings();
  const [admins, tutors] = await Promise.all([
    adminEmails(),
    wantsTutoring && settings.notifyTutorsOnNewLead ? activeTutorEmails() : Promise.resolve([] as string[]),
  ]);

  await Promise.all([
    sendEmail({
      to: admins,
      kind: "lead_new_admin",
      subject: `New lead: ${data.name} · ${services.slice(0, 2).join(", ")}`,
      heading: "A new request just came in",
      preview: `${who}, grade ${data.grade} · ${services.join(", ")}`,
      details,
      cta: { label: "Open in BCLearns", url: `${appUrl()}/admin?client=${lead._id}` },
    }),
    sendEmail({
      to: tutors.filter((t) => !admins.includes(t)),
      kind: "lead_new_tutor",
      subject: `New student available: ${subjects.slice(0, 2).join(", ")} (grade ${data.grade})`,
      heading: "A new student is up for grabs",
      preview: `Grade ${data.grade} · ${subjects.join(", ")}`,
      paragraphs: ["A new family is looking for a tutor. If it's a good fit for you, claim it and the admin will review."],
      details: [
        ["Grade", data.grade],
        ["Request", data.tutoringRequest || "Academic tutoring"],
        ["Courses", data.courses || "Not specified"],
        ["Hours per week", data.hoursPerWeek || "Not specified"],
      ],
      cta: { label: "See it on BCLearns", url: `${appUrl()}/tutor` },
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
