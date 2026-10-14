import "server-only";
import { Types } from "mongoose";
import { addWeeks, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { connectDB } from "@/lib/db";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { Assignment, ClaimRequest, Lead, Session, User } from "@/models";

const TZ = "America/New_York";
const HOURS = { $divide: [{ $subtract: ["$end", "$start"] }, 3_600_000] };

export async function getKpis() {
  await connectDB();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);
  const monthStart = startOfMonth(now);

  const [newThisWeek, newLastWeek, openLeads, pendingClaims, activeStudents, activeTutors, monthAgg, upcoming] = await Promise.all([
    Lead.countDocuments({ createdAt: { $gte: weekStart } }),
    Lead.countDocuments({ createdAt: { $gte: lastWeekStart, $lt: weekStart } }),
    Lead.countDocuments({ status: { $in: CLAIMABLE_STATUSES } }),
    ClaimRequest.countDocuments({ status: "pending" }),
    Assignment.countDocuments({ status: "active" }),
    User.countDocuments({ role: "tutor", status: "active", "onboarding.status": "complete" }),
    Session.aggregate<{ hours: number; revenue: number }>([
      { $match: { status: "completed", start: { $gte: monthStart } } },
      { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
      { $addFields: { h: HOURS, rate: { $ifNull: [{ $first: "$a.rate" }, 0] } } },
      { $group: { _id: null, hours: { $sum: "$h" }, revenue: { $sum: { $multiply: ["$h", "$rate"] } } } },
    ]),
    Session.countDocuments({ status: "scheduled", start: { $gte: now, $lt: addWeeks(now, 1) } }),
  ]);

  return {
    newThisWeek,
    newLastWeek,
    openLeads,
    pendingClaims,
    activeStudents,
    activeTutors,
    hoursThisMonth: monthAgg[0]?.hours ?? 0,
    revenueThisMonth: monthAgg[0]?.revenue ?? 0,
    upcoming,
  };
}

export async function leadsByWeek(weeks = 12) {
  await connectDB();
  const start = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 });
  const rows = await Lead.aggregate<{ _id: { week: Date; source: string }; count: number }>([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          week: { $dateTrunc: { date: "$createdAt", unit: "week", startOfWeek: "monday", timezone: TZ } },
          source: { $ifNull: [{ $cond: [{ $eq: ["$source", ""] }, null, "$source"] }, "Unknown"] },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const sources = [...new Set(rows.map((r) => r._id.source))].sort();
  const data = Array.from({ length: weeks }, (_, i) => {
    const wk = addWeeks(start, i);
    const label = format(wk, "MMM d");
    const entry: Record<string, string | number> = { week: label, total: 0 };
    for (const s of sources) entry[s] = 0;
    for (const r of rows) {
      if (format(new Date(r._id.week), "MMM d") === label) {
        entry[r._id.source] = (entry[r._id.source] as number) + r.count;
        entry.total = (entry.total as number) + r.count;
      }
    }
    return entry;
  });
  return { data, sources };
}

export async function leadFunnel() {
  await connectDB();
  const [total, contacted, matched, active] = await Promise.all([
    Lead.countDocuments({}),
    Lead.countDocuments({ $or: [{ status: { $nin: ["new"] } }, { contactedAt: { $ne: null } }] }),
    Lead.countDocuments({ $or: [{ assignedAt: { $ne: null } }, { status: { $in: ["matched", "active", "paused", "ended"] } }] }),
    Lead.countDocuments({ $or: [{ activeAt: { $ne: null } }, { status: { $in: ["active", "paused"] } }] }),
  ]);
  return [
    { stage: "Submitted", count: total },
    { stage: "Contacted", count: contacted },
    { stage: "Matched", count: matched },
    { stage: "Active", count: active },
  ];
}

export async function statusCounts() {
  await connectDB();
  const rows = await Lead.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count])) as Record<string, number>;
}

export async function medianDaysToAssign() {
  await connectDB();
  const leads = await Lead.find({ assignedAt: { $ne: null } }).select("createdAt assignedAt").lean();
  const days = leads
    .map((l) => (new Date(l.assignedAt!).getTime() - new Date(l.createdAt).getTime()) / 864e5)
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  if (!days.length) return null;
  const mid = Math.floor(days.length / 2);
  return days.length % 2 ? days[mid] : (days[mid - 1] + days[mid]) / 2;
}

export async function subjectDemand(limit = 10) {
  await connectDB();
  return Lead.aggregate<{ subject: string; count: number }>([
    { $unwind: "$subjects" },
    { $group: { _id: "$subjects", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, subject: "$_id", count: 1 } },
  ]);
}

export async function sourceBreakdown() {
  await connectDB();
  return Lead.aggregate<{ source: string; count: number }>([
    { $group: { _id: { $ifNull: [{ $cond: [{ $eq: ["$source", ""] }, null, "$source"] }, "Unknown"] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, source: "$_id", count: 1 } },
  ]);
}

export async function hoursByTutorWeek(weeks = 8, tutorId?: Types.ObjectId) {
  await connectDB();
  const start = startOfWeek(subWeeks(new Date(), weeks - 1), { weekStartsOn: 1 });
  const rows = await Session.aggregate<{ _id: { week: Date; tutor: Types.ObjectId }; hours: number }>([
    { $match: { status: "completed", start: { $gte: start }, ...(tutorId ? { tutor: tutorId } : {}) } },
    {
      $group: {
        _id: { week: { $dateTrunc: { date: "$start", unit: "week", startOfWeek: "monday", timezone: TZ } }, tutor: "$tutor" },
        hours: { $sum: HOURS },
      },
    },
  ]);
  const tutors = await User.find({ _id: { $in: [...new Set(rows.map((r) => r._id.tutor.toString()))] } }).select("name").lean();
  const names = new Map(tutors.map((t) => [t._id.toString(), t.name.split(" ")[0]]));
  const series = [...new Set(rows.map((r) => names.get(r._id.tutor.toString()) ?? "Unknown"))].sort();
  const data = Array.from({ length: weeks }, (_, i) => {
    const wk = addWeeks(start, i);
    const label = format(wk, "MMM d");
    const entry: Record<string, string | number> = { week: label };
    for (const s of series) entry[s] = 0;
    for (const r of rows) {
      if (format(new Date(r._id.week), "MMM d") === label) {
        const n = names.get(r._id.tutor.toString()) ?? "Unknown";
        entry[n] = Math.round(((entry[n] as number) + r.hours) * 10) / 10;
      }
    }
    return entry;
  });
  return { data, series };
}

export async function revenueByMonth(months = 6, tutorId?: Types.ObjectId) {
  await connectDB();
  const start = startOfMonth(subMonths(new Date(), months - 1));
  const rows = await Session.aggregate<{ _id: Date; hours: number; revenue: number }>([
    { $match: { status: "completed", start: { $gte: start }, ...(tutorId ? { tutor: tutorId } : {}) } },
    { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
    { $addFields: { h: HOURS, rate: { $ifNull: [{ $first: "$a.rate" }, 0] } } },
    {
      $group: {
        _id: { $dateTrunc: { date: "$start", unit: "month", timezone: TZ } },
        hours: { $sum: "$h" },
        revenue: { $sum: { $multiply: ["$h", "$rate"] } },
      },
    },
  ]);
  return Array.from({ length: months }, (_, i) => {
    const m = startOfMonth(subMonths(new Date(), months - 1 - i));
    const label = format(m, "MMM");
    const row = rows.find((r) => format(new Date(r._id), "MMM yyyy") === format(m, "MMM yyyy"));
    return { month: label, hours: Math.round((row?.hours ?? 0) * 10) / 10, revenue: Math.round(row?.revenue ?? 0) };
  });
}

export async function attendance(days = 90, match: Record<string, unknown> = {}) {
  await connectDB();
  const rows = await Session.aggregate<{ _id: string; count: number }>([
    { $match: { end: { $lt: new Date(), $gte: new Date(Date.now() - days * 864e5) }, ...match } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const get = (s: string) => rows.find((r) => r._id === s)?.count ?? 0;
  const completed = get("completed");
  const noShow = get("no_show");
  const canceled = get("canceled");
  const unlogged = get("scheduled");
  const held = completed + noShow;
  return {
    completed,
    noShow,
    canceled,
    unlogged,
    rate: held ? completed / held : null,
  };
}

export async function leadStats(leadId: Types.ObjectId | string) {
  await connectDB();
  const id = new Types.ObjectId(String(leadId));
  const [agg, next, last] = await Promise.all([
    Session.aggregate<{ _id: string; count: number; hours: number; revenue: number }>([
      { $match: { lead: id } },
      { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
      { $addFields: { h: HOURS, rate: { $ifNull: [{ $first: "$a.rate" }, 0] } } },
      { $group: { _id: "$status", count: { $sum: 1 }, hours: { $sum: "$h" }, revenue: { $sum: { $multiply: ["$h", "$rate"] } } } },
    ]),
    Session.findOne({ lead: id, status: "scheduled", start: { $gte: new Date() } }).sort({ start: 1 }).lean(),
    Session.findOne({ lead: id, status: "completed" }).sort({ start: -1 }).lean(),
  ]);
  const get = (s: string) => agg.find((r) => r._id === s);
  const completed = get("completed");
  const noShow = get("no_show")?.count ?? 0;
  return {
    sessions: completed?.count ?? 0,
    hours: completed?.hours ?? 0,
    billed: completed?.revenue ?? 0,
    noShow,
    canceled: get("canceled")?.count ?? 0,
    upcoming: get("scheduled")?.count ?? 0,
    attendance: completed?.count || noShow ? (completed?.count ?? 0) / ((completed?.count ?? 0) + noShow) : null,
    nextSession: next?.start ?? null,
    lastSession: last?.start ?? null,
  };
}
