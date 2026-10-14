import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { ClaimRequest, Lead } from "@/models";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "tutor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const leads = await Lead.find({ status: { $in: CLAIMABLE_STATUSES } }).sort({ createdAt: -1 }).lean();
  const mine = await ClaimRequest.find({ tutor: session.user.id, status: "pending" }).lean();
  const byLead = new Map(mine.map((c) => [c.lead.toString(), c._id.toString()]));
  return NextResponse.json({
    leads: leads.map((l) => ({
      _id: l._id.toString(),
      parent: { name: l.parent.name },
      students: l.students.map((s) => ({ name: s.name, grade: s.grade })),
      subjects: l.subjects,
      format: l.format,
      location: l.location,
      goals: l.goals,
      availability: l.availability,
      status: l.status,
      myClaimId: byLead.get(l._id.toString()),
    })),
  });
}
