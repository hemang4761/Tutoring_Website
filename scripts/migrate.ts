/* usage: npm run migrate
   moves old lead statuses onto the simplified set and backfills match fees. safe to run more than once. */
import mongoose from "mongoose";
import { Assignment, Lead, Session } from "../src/models";
import { LEGACY_STATUS_MAP } from "../src/lib/constants";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);

  for (const [from, to] of Object.entries(LEGACY_STATUS_MAP)) {
    const res = await Lead.collection.updateMany({ status: from }, { $set: { status: to } });
    if (res.modifiedCount) console.log(`[migrate] ${from} -> ${to}: ${res.modifiedCount}`);
  }

  // a match with a held session but no fee record owes the first session's amount
  const assignments = await Assignment.find({ $or: [{ fee: null }, { "fee.status": { $exists: false } }, { "fee.status": "pending" }] });
  let fees = 0;
  for (const a of assignments) {
    const first = await Session.findOne({ assignment: a._id, status: "completed" }).sort({ start: 1 });
    if (!first) {
      if (!a.fee?.status) {
        a.set("fee", { status: "pending" });
        await a.save();
      }
      continue;
    }
    const hrs = (first.end.getTime() - first.start.getTime()) / 3_600_000;
    a.set("fee", { amount: Math.round(hrs * (a.rate ?? 0) * 100) / 100, status: "due", session: first._id, dueAt: first.end });
    await a.save();
    fees++;
  }
  console.log(`[migrate] fees backfilled: ${fees}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[migrate] failed", err);
  await mongoose.disconnect();
  process.exit(1);
});
