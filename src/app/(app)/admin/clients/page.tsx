import { startOfMonth } from "date-fns";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Lead, Session } from "@/models";
import { ClientsTable, type ClientRow } from "./clients-table";

export const metadata = { title: "Clients" };

const HOURS = { $divide: [{ $subtract: ["$end", "$start"] }, 3_600_000] };

export default async function ClientsPage() {
  await requireAdmin();
  await connectDB();
  const [leads, monthHours] = await Promise.all([
    Lead.find({})
      .sort({ createdAt: -1 })
      .limit(2000)
      .populate<{ assignedTutors: Array<{ _id: unknown; name: string }> }>("assignedTutors", "name")
      .lean(),
    Session.aggregate<{ _id: unknown; h: number }>([
      { $match: { status: "completed", start: { $gte: startOfMonth(new Date()) } } },
      { $group: { _id: "$lead", h: { $sum: HOURS } } },
    ]),
  ]);
  const hours = new Map(monthHours.map((r) => [String(r._id), Math.round(r.h * 10) / 10]));
  const rows: ClientRow[] = leads.map((l) => ({
    id: String(l._id),
    name: l.parent.name,
    phone: l.parent.phone ?? "",
    email: l.parent.email ?? "",
    students: l.students.map((s) => s.name).filter((n) => n !== l.parent.name),
    grade: l.students[0]?.grade ?? "",
    subjects: l.subjects ?? [],
    tutors: l.assignedTutors.map((t) => ({ id: String(t._id), name: t.name })),
    status: l.status,
    source: l.source ?? "",
    createdAt: l.createdAt.toISOString(),
    lastContactAt: l.lastContactAt ? l.lastContactAt.toISOString() : null,
    followUp: l.followUp?.at ? l.followUp.at.toISOString() : null,
    hoursThisMonth: hours.get(String(l._id)) ?? 0,
  }));
  return <ClientsTable rows={rows} />;
}
