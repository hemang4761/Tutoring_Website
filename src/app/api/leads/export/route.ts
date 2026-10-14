import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") return new NextResponse("Unauthorized", { status: 401 });
  await connectDB();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ "parent.name": rx }, { "parent.email": rx }, { subjects: rx }];
  }
  const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
  const header = ["Parent", "Email", "Phone", "Students", "Subjects", "Status", "Source", "Created", "Submitted as", "Request", "Courses", "Hours per week", "College consulting"];
  const rows = leads.map((l) =>
    [
      l.parent.name,
      l.parent.email,
      l.parent.phone ?? "",
      l.students.map((s) => `${s.name} (${s.grade})`).join("; "),
      l.subjects.join("; "),
      l.status,
      l.source ?? "",
      new Date(l.createdAt).toISOString(),
      l.intake?.respondent === "parent" ? "Parent/Guardian" : l.intake?.respondent === "student" ? "Student" : "",
      l.intake?.tutoringRequest ?? "",
      l.intake?.courses ?? "",
      l.intake?.hoursPerWeek ?? "",
      l.intake ? (l.intake.service === "college" || l.intake.alsoConsulting ? "Yes" : "No") : "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=bclearns-leads.csv",
    },
  });
}
