import { startOfMonth } from "date-fns";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Assignment, Session, TutorApplication, TutorProfile, User } from "@/models";
import { TutorsView, type ApplicantRow, type TutorRow } from "./tutors-view";

export const metadata = { title: "Tutors" };

const HOURS = { $divide: [{ $subtract: ["$end", "$start"] }, 3_600_000] };

export default async function TutorsPage() {
  await requireAdmin();
  await connectDB();
  const [tutors, profiles, assignments, month, applications] = await Promise.all([
    User.find({ role: "tutor" }).sort({ name: 1 }).lean(),
    TutorProfile.find().lean(),
    Assignment.find({ status: { $ne: "ended" } }).select("tutor status fee rate").lean(),
    Session.aggregate<{ _id: unknown; hours: number; earned: number }>([
      { $match: { status: "completed", start: { $gte: startOfMonth(new Date()) } } },
      { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
      { $addFields: { h: HOURS, rate: { $ifNull: [{ $first: "$a.rate" }, 0] } } },
      { $group: { _id: "$tutor", hours: { $sum: "$h" }, earned: { $sum: { $multiply: ["$h", "$rate"] } } } },
    ]),
    TutorApplication.find({ status: "pending" }).sort({ createdAt: -1 }).lean(),
  ]);
  const profile = new Map(profiles.map((p) => [String(p.user), p]));
  const monthBy = new Map(month.map((m) => [String(m._id), m]));

  const rows: TutorRow[] = tutors.map((t) => {
    const p = profile.get(String(t._id));
    const mine = assignments.filter((a) => String(a.tutor) === String(t._id));
    const m = monthBy.get(String(t._id));
    return {
      id: String(t._id),
      name: t.name,
      email: t.email,
      phone: t.phone ?? "",
      subjects: p?.subjects ?? [],
      gradeLevels: p?.gradeLevels ?? [],
      students: mine.filter((a) => a.status === "active").length,
      max: p?.maxStudents ?? 4,
      hoursThisMonth: Math.round((m?.hours ?? 0) * 10) / 10,
      earnedThisMonth: Math.round(m?.earned ?? 0),
      feesDue: mine.filter((a) => a.fee?.status === "due").reduce((n, a) => n + (a.fee?.amount ?? 0), 0),
      availability: (p?.availability ?? []).map((a) => a.day),
      status: t.status === "disabled" || p?.status === "inactive" ? "inactive" : t.status === "invited" ? "invited" : "active",
    };
  });

  const applicants: ApplicantRow[] = applications.map((a) => ({
    id: String(a._id),
    name: a.name,
    email: a.email,
    school: [a.school, a.gradYear].filter(Boolean).join(" "),
    subjects: a.subjects ?? [],
    experience: a.experience ?? "",
    createdAt: a.createdAt.toISOString(),
  }));

  return <TutorsView rows={rows} applicants={applicants} />;
}
