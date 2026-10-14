import { addDays, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { firstName, money } from "@/lib/format";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { Assignment, ClaimRequest, Lead, Session } from "@/models";
import { OpenStudents, TutorAgenda, Unlogged, type OpenStudent, type TutorSession } from "./tutor-home";

export const metadata = { title: "Home" };

export default async function TutorHome() {
  const user = await requireUser(["tutor"]);
  await connectDB();
  const now = new Date();
  const [open, myClaims, upcoming, unlogged, assignments, month] = await Promise.all([
    Lead.find({ status: { $in: CLAIMABLE_STATUSES }, assignedTutors: { $size: 0 } })
      .sort({ createdAt: -1 })
      .select("students subjects services intake message createdAt")
      .lean(),
    ClaimRequest.find({ tutor: user._id, status: "pending" }).select("lead").lean(),
    Session.find({ tutor: user._id, status: "scheduled", start: { $gte: now, $lt: addDays(now, 7) } }).sort({ start: 1 }).lean(),
    Session.find({ tutor: user._id, status: "scheduled", end: { $lt: now } }).sort({ start: -1 }).limit(20).lean(),
    Assignment.find({ tutor: user._id }).select("rate fee").lean(),
    Session.find({ tutor: user._id, status: "completed", start: { $gte: startOfMonth(now) } }).select("start end assignment").lean(),
  ]);

  const claimed = new Map(myClaims.map((c) => [String(c.lead), String(c._id)]));
  const rate = new Map(assignments.map((a) => [String(a._id), a.rate]));
  const hours = month.reduce((n, s) => n + (s.end.getTime() - s.start.getTime()) / 3_600_000, 0);
  const earned = month.reduce((n, s) => n + ((s.end.getTime() - s.start.getTime()) / 3_600_000) * (rate.get(String(s.assignment)) ?? 0), 0);
  const feesDue = assignments.filter((a) => a.fee?.status === "due").reduce((n, a) => n + (a.fee?.amount ?? 0), 0);

  const students: OpenStudent[] = open.map((l) => ({
    id: String(l._id),
    student: firstName(l.students[0]?.name ?? "Student"),
    grade: l.students[0]?.grade ?? "",
    subjects: l.subjects ?? [],
    need: [l.intake?.tutoringRequest, l.intake?.courses].filter(Boolean).join(" · ") || l.subjects?.join(", ") || l.services?.join(", ") || "",
    hours: l.intake?.hoursPerWeek ?? "",
    comments: l.intake?.comments || l.message || "",
    createdAt: l.createdAt.toISOString(),
    claimId: claimed.get(String(l._id)) ?? null,
  }));
  const toSession = (s: (typeof upcoming)[number]): TutorSession => ({
    id: String(s._id),
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    student: s.studentName,
    location: s.location || s.meetingLink || "",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Hi, {firstName(user.name)}</h1>
        <p className="text-sm text-muted-foreground">
          {Math.round(hours * 10) / 10} h this month · {money(earned)} earned
          {feesDue ? ` · ${money(feesDue)} first-session fee due to BCLearns` : ""}
        </p>
      </div>
      {unlogged.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Log these sessions</h2>
          <Unlogged sessions={unlogged.map(toSession)} />
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">
          Students looking for a tutor {students.length ? <span className="ml-1 text-sm font-normal text-muted-foreground">{students.length}</span> : null}
        </h2>
        <OpenStudents students={students} />
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold">This week</h2>
        <TutorAgenda sessions={upcoming.map(toSession)} />
      </section>
    </div>
  );
}
