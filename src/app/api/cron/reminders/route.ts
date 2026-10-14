import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { fmtDateTime } from "@/lib/format";
import { Lead, Session, User } from "@/models";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const settings = await getSettings();
  if (!settings.remindersEnabled) return NextResponse.json({ sent: 0, skipped: true });

  const now = new Date();
  const windowEnd = addHours(now, 24);
  const sessions = await Session.find({
    status: "scheduled",
    reminderSentAt: null,
    start: { $gte: now, $lte: windowEnd },
  }).lean();

  let sent = 0;
  for (const s of sessions) {
    const [tutor, lead] = await Promise.all([User.findById(s.tutor).lean(), Lead.findById(s.lead).lean()]);
    const to = [tutor?.email, lead?.parent.email, lead?.familyUser ? (await User.findById(lead.familyUser).select("email").lean())?.email : null].filter(Boolean) as string[];
    await sendEmail({
      to,
      kind: "session_reminder",
      subject: `Reminder: ${s.studentName} tomorrow`,
      heading: "Session reminder",
      details: [
        ["Student", s.studentName],
        ["When", fmtDateTime(s.start)],
        ["Subject", s.subject || ""],
        ["Where", s.location || s.meetingLink || "TBD"],
      ],
    });
    await Session.updateOne({ _id: s._id }, { reminderSentAt: new Date() });
    sent++;
  }
  return NextResponse.json({ sent });
}
