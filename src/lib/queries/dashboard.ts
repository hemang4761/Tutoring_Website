import "server-only";
import { addDays, addWeeks, format, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { OPEN_STATUSES } from "@/lib/constants";
import { AdminRequest, Assignment, ClaimRequest, Lead, Session, TutorProfile, User } from "@/models";

const TZ = "America/New_York";
const HOURS = { $divide: [{ $subtract: ["$end", "$start"] }, 3_600_000] };
const id = (v: unknown) => String(v);

export type ClientRef = { id: string; name: string; phone: string; email: string; student: string; grade: string; subjects: string[] };

export type TodoItem =
  | { kind: "new"; key: string; at: string; client: ClientRef; need: string; source: string }
  | { kind: "claim"; key: string; at: string; client: ClientRef; claimId: string; tutor: { id: string; name: string }; message: string; rate: number }
  | { kind: "first_session"; key: string; at: string; client: ClientRef; tutor: string; assignmentId: string }
  | { kind: "unlogged"; key: string; at: string; client: ClientRef; sessionId: string; tutor: string; start: string; end: string }
  | { kind: "follow_up"; key: string; at: string; client: ClientRef; note: string }
  | { kind: "request"; key: string; at: string; requestId: string; title: string; body: string; from: string; type: string }
  | { kind: "fee"; key: string; at: string; client: ClientRef; assignmentId: string; tutor: string; amount: number }
  | { kind: "quiet"; key: string; at: string; client: ClientRef; lastSession: string | null };

type LeanLead = {
  _id: unknown;
  parent: { name: string; phone?: string | null; email?: string | null };
  students: Array<{ name: string; grade?: string | null; subjects?: string[] }>;
  subjects: string[];
};

export function clientRef(l: LeanLead): ClientRef {
  const s = l.students[0];
  return {
    id: id(l._id),
    name: l.parent.name,
    phone: l.parent.phone ?? "",
    email: l.parent.email ?? "",
    student: s?.name ?? "",
    grade: s?.grade ?? "",
    subjects: l.subjects?.length ? l.subjects : (s?.subjects ?? []),
  };
}

export async function getTodo(): Promise<TodoItem[]> {
  await connectDB();
  const now = new Date();
  const settings = await getSettings();
  const quietCutoff = subDays(now, settings.quietDays ?? 14);
  const leadFields = "parent students subjects source message services intake followUp createdAt status";

  const [fresh, claims, matched, unlogged, followUps, requests, fees, active] = await Promise.all([
    Lead.find({ status: "new" }).select(leadFields).sort({ createdAt: 1 }).lean(),
    ClaimRequest.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .populate<{ tutor: { _id: unknown; name: string } }>("tutor", "name")
      .populate<{ lead: LeanLead & { rateTier?: string } }>("lead", "parent students subjects rateTier")
      .lean(),
    Lead.find({ status: "matched" }).select(leadFields).lean(),
    Session.find({ status: "scheduled", end: { $lt: subDays(now, 2) } })
      .sort({ start: 1 })
      .limit(30)
      .populate<{ tutor: { name: string } }>("tutor", "name")
      .populate<{ lead: LeanLead }>("lead", "parent students subjects")
      .lean(),
    Lead.find({ "followUp.at": { $lte: now } }).select(leadFields).lean(),
    AdminRequest.find({ status: { $in: ["open", "in_progress"] } })
      .sort({ createdAt: 1 })
      .populate<{ requester: { name: string } }>("requester", "name")
      .lean(),
    Assignment.find({ "fee.status": "due" })
      .populate<{ tutor: { name: string } }>("tutor", "name")
      .populate<{ lead: LeanLead }>("lead", "parent students subjects")
      .lean(),
    Lead.find({ status: "active" }).select(`${leadFields} quietDismissedAt`).lean(),
  ]);

  const items: TodoItem[] = [];
  const tiers = new Map(settings.rateTiers.map((r) => [r.key, r.rate]));

  for (const l of fresh) {
    items.push({
      kind: "new",
      key: `new-${id(l._id)}`,
      at: l.createdAt.toISOString(),
      client: clientRef(l),
      need: l.intake?.tutoringRequest || l.services?.join(", ") || l.message || "",
      source: l.source ?? "",
    });
  }

  for (const c of claims) {
    if (!c.lead || !c.tutor) continue;
    items.push({
      kind: "claim",
      key: `claim-${id(c._id)}`,
      at: c.createdAt.toISOString(),
      client: clientRef(c.lead),
      claimId: id(c._id),
      tutor: { id: id(c.tutor._id), name: c.tutor.name },
      message: c.message ?? "",
      rate: tiers.get(c.lead.rateTier ?? "") ?? tiers.get("hs") ?? 30,
    });
  }

  if (matched.length) {
    const ids = matched.map((l) => l._id);
    const [scheduled, assignments] = await Promise.all([
      Session.distinct("lead", { lead: { $in: ids }, status: { $in: ["scheduled", "completed"] } }),
      Assignment.find({ lead: { $in: ids }, status: "active" }).populate<{ tutor: { name: string } }>("tutor", "name").lean(),
    ]);
    const booked = new Set(scheduled.map(id));
    for (const l of matched) {
      if (booked.has(id(l._id))) continue;
      const a = assignments.find((x) => id(x.lead) === id(l._id));
      if (!a) continue;
      items.push({
        kind: "first_session",
        key: `first-${id(l._id)}`,
        at: (a.createdAt ?? l.createdAt).toISOString(),
        client: clientRef(l),
        tutor: a.tutor?.name ?? "",
        assignmentId: id(a._id),
      });
    }
  }

  for (const s of unlogged) {
    if (!s.lead) continue;
    items.push({
      kind: "unlogged",
      key: `unlogged-${id(s._id)}`,
      at: s.end.toISOString(),
      client: clientRef(s.lead),
      sessionId: id(s._id),
      tutor: s.tutor?.name ?? "",
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    });
  }

  for (const l of followUps) {
    items.push({ kind: "follow_up", key: `follow-${id(l._id)}`, at: l.followUp!.at!.toISOString(), client: clientRef(l), note: l.followUp?.note ?? "" });
  }

  for (const r of requests) {
    items.push({
      kind: "request",
      key: `request-${id(r._id)}`,
      at: r.createdAt.toISOString(),
      requestId: id(r._id),
      title: r.title,
      body: r.body ?? "",
      from: r.requester?.name ?? "",
      type: r.type,
    });
  }

  for (const a of fees) {
    if (!a.lead) continue;
    items.push({
      kind: "fee",
      key: `fee-${id(a._id)}`,
      at: (a.fee?.dueAt ?? a.updatedAt).toISOString(),
      client: clientRef(a.lead),
      assignmentId: id(a._id),
      tutor: a.tutor?.name ?? "",
      amount: a.fee?.amount ?? 0,
    });
  }

  if (active.length) {
    const ids = active.map((l) => l._id);
    const [recent, upcoming] = await Promise.all([
      Session.aggregate<{ _id: unknown; last: Date }>([
        { $match: { lead: { $in: ids }, status: "completed" } },
        { $group: { _id: "$lead", last: { $max: "$start" } } },
      ]),
      Session.distinct("lead", { lead: { $in: ids }, status: "scheduled", start: { $gte: now } }),
    ]);
    const last = new Map(recent.map((r) => [id(r._id), r.last]));
    const hasUpcoming = new Set(upcoming.map(id));
    for (const l of active) {
      const lastAt = last.get(id(l._id));
      if (hasUpcoming.has(id(l._id))) continue;
      if (lastAt && lastAt > quietCutoff) continue;
      if (l.quietDismissedAt && l.quietDismissedAt > quietCutoff) continue;
      items.push({
        kind: "quiet",
        key: `quiet-${id(l._id)}`,
        at: (lastAt ?? l.createdAt).toISOString(),
        client: clientRef(l),
        lastSession: lastAt ? lastAt.toISOString() : null,
      });
    }
  }

  // most urgent kinds first, oldest first inside each kind
  const order: TodoItem["kind"][] = ["new", "claim", "follow_up", "first_session", "request", "unlogged", "fee", "quiet"];
  return items.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.at.localeCompare(b.at));
}

export type OpenClient = ClientRef & {
  status: string;
  createdAt: string;
  lastContactAt: string | null;
  tutors: string[];
  claims: Array<{ claimId: string; tutor: string }>;
  rateTier: string;
};

export async function getOpenClients(): Promise<OpenClient[]> {
  await connectDB();
  const leads = await Lead.find({ status: { $in: OPEN_STATUSES } })
    .sort({ createdAt: 1 })
    .populate<{ assignedTutors: Array<{ name: string }> }>("assignedTutors", "name")
    .lean();
  const claims = await ClaimRequest.find({ lead: { $in: leads.map((l) => l._id) }, status: "pending" })
    .populate<{ tutor: { name: string } }>("tutor", "name")
    .lean();
  return leads.map((l) => ({
    ...clientRef(l),
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    lastContactAt: l.lastContactAt ? l.lastContactAt.toISOString() : null,
    tutors: l.assignedTutors.map((t) => t.name),
    claims: claims.filter((c) => id(c.lead) === id(l._id)).map((c) => ({ claimId: id(c._id), tutor: c.tutor?.name ?? "" })),
    rateTier: l.rateTier ?? "",
  }));
}

export type AgendaSession = {
  id: string;
  start: string;
  end: string;
  student: string;
  subject: string;
  tutor: string;
  tutorId: string;
  leadId: string;
  status: string;
};

export async function getWeekAgenda(): Promise<AgendaSession[]> {
  await connectDB();
  const now = new Date();
  const sessions = await Session.find({ start: { $gte: subDays(now, 0.1), $lt: addDays(now, 7) }, status: { $ne: "canceled" } })
    .sort({ start: 1 })
    .populate<{ tutor: { _id: unknown; name: string } }>("tutor", "name")
    .lean();
  return sessions.map((s) => ({
    id: id(s._id),
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    student: s.studentName,
    subject: s.subject ?? "",
    tutor: s.tutor?.name ?? "",
    tutorId: s.tutor ? id(s.tutor._id) : "",
    leadId: id(s.lead),
    status: s.status,
  }));
}

export type TutorOption = {
  id: string;
  name: string;
  subjects: string[];
  gradeLevels: string[];
  students: number;
  max: number;
};

export async function getTutorOptions(): Promise<TutorOption[]> {
  await connectDB();
  const [tutors, profiles, counts] = await Promise.all([
    User.find({ role: "tutor", status: { $ne: "disabled" } }).select("name").sort({ name: 1 }).lean(),
    TutorProfile.find({}).select("user subjects gradeLevels maxStudents status").lean(),
    Assignment.aggregate<{ _id: unknown; n: number }>([{ $match: { status: "active" } }, { $group: { _id: "$tutor", n: { $sum: 1 } } }]),
  ]);
  const byUser = new Map(profiles.map((p) => [id(p.user), p]));
  const load = new Map(counts.map((c) => [id(c._id), c.n]));
  return tutors
    .filter((t) => byUser.get(id(t._id))?.status !== "inactive")
    .map((t) => {
      const p = byUser.get(id(t._id));
      return {
        id: id(t._id),
        name: t.name,
        subjects: p?.subjects ?? [],
        gradeLevels: p?.gradeLevels ?? [],
        students: load.get(id(t._id)) ?? 0,
        max: p?.maxStudents ?? 4,
      };
    });
}

export type Trends = {
  requests: Array<{ label: string; value: number }>;
  activeClients: Array<{ label: string; value: number }>;
  hours: Array<{ label: string; value: number }>;
  money: Array<{ label: string; tutoring: number; fees: number }>;
};

export async function getTrends(months: number): Promise<Trends> {
  await connectDB();
  const weeks = Math.round((months * 52) / 12);
  const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 });
  const monthStart = startOfMonth(subMonths(new Date(), months - 1));
  const weekTrunc = (field: string) => ({ $dateTrunc: { date: field, unit: "week", startOfWeek: "monday", timezone: TZ } });
  const monthTrunc = (field: string) => ({ $dateTrunc: { date: field, unit: "month", timezone: TZ } });

  const [requests, weekly, money, fees] = await Promise.all([
    Lead.aggregate<{ _id: Date; n: number }>([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: { _id: weekTrunc("$createdAt"), n: { $sum: 1 } } },
    ]),
    Session.aggregate<{ _id: Date; hours: number; clients: unknown[] }>([
      { $match: { status: "completed", start: { $gte: weekStart } } },
      { $group: { _id: weekTrunc("$start"), hours: { $sum: HOURS }, clients: { $addToSet: "$lead" } } },
    ]),
    Session.aggregate<{ _id: Date; amount: number }>([
      { $match: { status: "completed", start: { $gte: monthStart } } },
      { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
      { $addFields: { amount: { $multiply: [HOURS, { $ifNull: [{ $first: "$a.rate" }, 0] }] } } },
      { $group: { _id: monthTrunc("$start"), amount: { $sum: "$amount" } } },
    ]),
    Assignment.aggregate<{ _id: Date; amount: number }>([
      { $match: { "fee.status": { $in: ["due", "paid"] }, "fee.dueAt": { $gte: monthStart } } },
      { $group: { _id: monthTrunc("$fee.dueAt"), amount: { $sum: "$fee.amount" } } },
    ]),
  ]);

  const wk = (d: Date) => format(d, "yyyy-MM-dd");
  const weeksList = Array.from({ length: weeks }, (_, i) => addWeeks(weekStart, i));
  const reqMap = new Map(requests.map((r) => [wk(new Date(r._id)), r.n]));
  const weekMap = new Map(weekly.map((r) => [wk(new Date(r._id)), r]));
  const mk = (d: Date) => format(d, "yyyy-MM");
  const moneyMap = new Map(money.map((r) => [mk(new Date(r._id)), r.amount]));
  const feeMap = new Map(fees.map((r) => [mk(new Date(r._id)), r.amount]));

  return {
    requests: weeksList.map((d) => ({ label: format(d, "MMM d"), value: reqMap.get(wk(d)) ?? 0 })),
    activeClients: weeksList.map((d) => ({ label: format(d, "MMM d"), value: weekMap.get(wk(d))?.clients.length ?? 0 })),
    hours: weeksList.map((d) => ({ label: format(d, "MMM d"), value: Math.round((weekMap.get(wk(d))?.hours ?? 0) * 10) / 10 })),
    money: Array.from({ length: months }, (_, i) => {
      const m = startOfMonth(subMonths(new Date(), months - 1 - i));
      return { label: format(m, "MMM"), tutoring: Math.round(moneyMap.get(mk(m)) ?? 0), fees: Math.round(feeMap.get(mk(m)) ?? 0) };
    }),
  };
}
