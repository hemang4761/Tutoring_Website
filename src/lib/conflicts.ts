import "server-only";
import type { Types } from "mongoose";
import { Session } from "@/models";

export async function findConflicts(
  tutorId: Types.ObjectId | string,
  start: Date,
  end: Date,
  excludeId?: Types.ObjectId | string,
) {
  return Session.find({
    tutor: tutorId,
    status: "scheduled",
    start: { $lt: end },
    end: { $gt: start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("studentName start end subject")
    .lean();
}
