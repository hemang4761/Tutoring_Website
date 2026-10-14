"use server";

import { startOfMonth } from "date-fns";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Assignment, ClaimRequest, Lead, Note, Session, TutorProfile, User } from "@/models";

const id = (v: unknown) => String(v);
const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);
const hrs = (s: { start: Date; end: Date }) => (new Date(s.end).getTime() - new Date(s.start).getTime()) / 3_600_000;

const INTAKE_LABELS: Array<[string, string]> = [
  ["tutoringRequest", "Looking for"],
  ["courses", "Courses"],
  ["hoursPerWeek", "Hours a week"],
  ["comments", "Comments"],
  ["careerInterests", "Career interests"],
  ["academics", "Grades and scores"],
  ["extracurriculars", "Activities"],
  ["collegeList", "College list"],
  ["consultingGoals", "Wants from consulting"],
];

export type ClientPanelData = NonNullable<Awaited<ReturnType<typeof loadClient>>>;

export async function loadClient(leadId: string) {
  await requireAdmin();
  if (!Types.ObjectId.isValid(leadId)) return null;
  await connectDB();
  const lead = await Lead.findById(leadId).lean();
  if (!lead) return null;
  const now = new Date();
  const [assignments, sessions, notes, claims, logAuthors] = await Promise.all([
    Assignment.find({ lead: lead._id }).sort({ createdAt: -1 }).populate<{ tutor: { _id: unknown; name: string; phone?: string } }>("tutor", "name phone").lean(),
    Session.find({ lead: lead._id }).sort({ start: -1 }).populate<{ tutor: { name: string } }>("tutor", "name").lean(),
    Note.find({ entityType: "lead", entityId: lead._id }).sort({ pinned: -1, createdAt: -1 }).populate<{ author: { name: string } }>("author", "name").lean(),
    ClaimRequest.find({ lead: lead._id, status: "pending" }).populate<{ tutor: { name: string } }>("tutor", "name").lean(),
    User.find({ _id: { $in: (lead.contactLog ?? []).flatMap((c) => (c.by ? [c.by] : [])) } }).select("name").lean<Array<{ _id: unknown; name: string }>>(),
  ]);
  const authors = new Map(logAuthors.map((u) => [id(u._id), u.name]));
  const held = sessions.filter((s) => s.status === "completed");
  const monthStart = startOfMonth(now);
  const intake = lead.intake
    ? INTAKE_LABELS.map(([k, label]) => [label, String((lead.intake as Record<string, unknown>)[k] ?? "")] as [string, string]).filter(([, v]) => v)
    : [];

  return {
    id: id(lead._id),
    name: lead.parent.name,
    phone: lead.parent.phone ?? "",
    email: lead.parent.email ?? "",
    status: lead.status,
    source: lead.source ?? "",
    message: lead.message ?? "",
    createdAt: iso(lead.createdAt)!,
    rateTier: lead.rateTier ?? "",
    channel: lead.channel ? id(lead.channel) : null,
    respondent: lead.intake?.respondent ?? "",
    intake,
    students: lead.students.map((s) => ({ id: id(s._id), name: s.name, grade: s.grade ?? "", school: s.school ?? "", subjects: s.subjects ?? [] })),
    subjects: lead.subjects ?? [],
    followUp: lead.followUp?.at ? { at: iso(lead.followUp.at)!, note: lead.followUp.note ?? "" } : null,
    contactLog: [...(lead.contactLog ?? [])]
      .reverse()
      .map((c) => ({ id: id(c._id), channel: c.channel, note: c.note ?? "", at: iso(c.at)!, by: authors.get(id(c.by)) ?? "" })),
    assignments: assignments.map((a) => ({
      id: id(a._id),
      student: a.studentName,
      tutor: { id: id(a.tutor?._id), name: a.tutor?.name ?? "", phone: a.tutor?.phone ?? "" },
      rate: a.rate,
      status: a.status,
      subjects: a.subjects ?? [],
      fee: { amount: a.fee?.amount ?? 0, status: a.fee?.status ?? "pending" },
    })),
    upcoming: sessions
      .filter((s) => s.status === "scheduled" && s.start >= now)
      .reverse()
      .slice(0, 6)
      .map((s) => ({ id: id(s._id), start: iso(s.start)!, end: iso(s.end)!, status: s.status, tutor: s.tutor?.name ?? "", student: s.studentName })),
    past: sessions
      .filter((s) => s.start < now)
      .slice(0, 12)
      .map((s) => ({ id: id(s._id), start: iso(s.start)!, end: iso(s.end)!, status: s.status, tutor: s.tutor?.name ?? "", student: s.studentName })),
    stats: {
      sessions: held.length,
      hours: Math.round(held.reduce((n, s) => n + hrs(s), 0) * 10) / 10,
      hoursThisMonth: Math.round(held.filter((s) => s.start >= monthStart).reduce((n, s) => n + hrs(s), 0) * 10) / 10,
    },
    notes: notes.map((n) => ({ id: id(n._id), body: n.body, author: n.author?.name ?? "", at: iso(n.createdAt)!, pinned: n.pinned })),
    claims: claims.map((c) => ({ id: id(c._id), tutor: c.tutor?.name ?? "", message: c.message ?? "" })),
  };
}

export type TutorPanelData = NonNullable<Awaited<ReturnType<typeof loadTutor>>>;

export async function loadTutor(userId: string) {
  await requireAdmin();
  if (!Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "tutor" }).lean();
  if (!user) return null;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const [profile, assignments, sessions, notes] = await Promise.all([
    TutorProfile.findOne({ user: user._id }).lean(),
    Assignment.find({ tutor: user._id }).sort({ status: 1, createdAt: -1 }).lean(),
    Session.find({ tutor: user._id }).sort({ start: -1 }).limit(200).lean(),
    Note.find({ entityType: "tutor", entityId: user._id }).sort({ createdAt: -1 }).populate<{ author: { name: string } }>("author", "name").lean(),
  ]);
  const rates = new Map(assignments.map((a) => [id(a._id), a.rate]));
  const held = sessions.filter((s) => s.status === "completed");
  const month = held.filter((s) => s.start >= monthStart);
  return {
    id: id(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    accountStatus: user.status,
    status: profile?.status ?? "active",
    headline: profile?.headline ?? "",
    subjects: profile?.subjects ?? [],
    gradeLevels: profile?.gradeLevels ?? [],
    maxStudents: profile?.maxStudents ?? 4,
    showOnSite: profile?.showOnSite ?? false,
    availability: (profile?.availability ?? []).map((a) => ({ day: a.day, start: a.start, end: a.end })),
    students: assignments.map((a) => ({
      id: id(a._id),
      leadId: id(a.lead),
      student: a.studentName,
      rate: a.rate,
      status: a.status,
      subjects: a.subjects ?? [],
      fee: { amount: a.fee?.amount ?? 0, status: a.fee?.status ?? "pending" },
    })),
    upcoming: sessions
      .filter((s) => s.status === "scheduled" && s.start >= now)
      .reverse()
      .slice(0, 8)
      .map((s) => ({ id: id(s._id), start: iso(s.start)!, end: iso(s.end)!, student: s.studentName, leadId: id(s.lead) })),
    unlogged: sessions.filter((s) => s.status === "scheduled" && s.end < now).length,
    stats: {
      hoursThisMonth: Math.round(month.reduce((n, s) => n + hrs(s), 0) * 10) / 10,
      earnedThisMonth: Math.round(month.reduce((n, s) => n + hrs(s) * (rates.get(id(s.assignment)) ?? 0), 0)),
      hoursTotal: Math.round(held.reduce((n, s) => n + hrs(s), 0) * 10) / 10,
      feesDue: assignments.filter((a) => a.fee?.status === "due").reduce((n, a) => n + (a.fee?.amount ?? 0), 0),
    },
    notes: notes.map((n) => ({ id: id(n._id), body: n.body, author: n.author?.name ?? "", at: iso(n.createdAt)! })),
  };
}

export type SearchHit = { kind: "client" | "tutor"; id: string; title: string; detail: string };

export async function searchEverything(q: string): Promise<SearchHit[]> {
  await requireAdmin();
  const query = q.trim();
  if (query.length < 2) return [];
  await connectDB();
  const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const digits = query.replace(/\D/g, "");
  const phoneRx = digits.length >= 3 ? new RegExp(digits.split("").join("\\D*")) : null;
  const [leads, tutors] = await Promise.all([
    Lead.find({
      $or: [
        { "parent.name": rx },
        { "parent.email": rx },
        { "students.name": rx },
        { subjects: rx },
        ...(phoneRx ? [{ "parent.phone": phoneRx }] : []),
      ],
    })
      .select("parent students status")
      .limit(8)
      .lean(),
    User.find({ role: "tutor", $or: [{ name: rx }, { email: rx }, ...(phoneRx ? [{ phone: phoneRx }] : [])] })
      .select("name email")
      .limit(5)
      .lean(),
  ]);
  return [
    ...leads.map((l) => ({
      kind: "client" as const,
      id: id(l._id),
      title: l.parent.name,
      detail: [l.students.map((s) => s.name).filter((n) => n !== l.parent.name).join(", "), l.parent.phone, l.status].filter(Boolean).join(" · "),
    })),
    ...tutors.map((t) => ({ kind: "tutor" as const, id: id(t._id), title: t.name, detail: `Tutor · ${t.email}` })),
  ];
}
