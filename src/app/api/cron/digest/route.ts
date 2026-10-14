import { NextResponse } from "next/server";
import { startOfWeek, subWeeks } from "date-fns";
import { connectDB } from "@/lib/db";
import { adminEmails, sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { money } from "@/lib/format";
import { AdminRequest, ClaimRequest, Lead, Session } from "@/models";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const settings = await getSettings();
  if (!settings.digestEnabled) return NextResponse.json({ skipped: true });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const lastWeek = subWeeks(weekStart, 1);
  const [newLeads, open, claims, requests, billed] = await Promise.all([
    Lead.countDocuments({ createdAt: { $gte: lastWeek, $lt: weekStart } }),
    Lead.countDocuments({ status: { $in: CLAIMABLE_STATUSES } }),
    ClaimRequest.countDocuments({ status: "pending" }),
    AdminRequest.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    Session.aggregate<{ revenue: number }>([
      { $match: { status: "completed", start: { $gte: lastWeek, $lt: weekStart } } },
      { $lookup: { from: "assignments", localField: "assignment", foreignField: "_id", as: "a" } },
      { $group: { _id: null, revenue: { $sum: { $multiply: [{ $divide: [{ $subtract: ["$end", "$start"] }, 3600000] }, { $ifNull: [{ $first: "$a.rate" }, 0] }] } } } },
    ]),
  ]);

  await sendEmail({
    to: await adminEmails(),
    kind: "weekly_digest",
    subject: "BCLearns weekly digest",
    heading: "Last week at BCLearns",
    details: [
      ["New leads", String(newLeads)],
      ["Still open", String(open)],
      ["Pending claims", String(claims)],
      ["Open requests", String(requests)],
      ["Estimated billed", money(billed[0]?.revenue ?? 0)],
    ],
    cta: { label: "Open dashboard", url: `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/admin` },
  });
  return NextResponse.json({ ok: true });
}
