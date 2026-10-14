import "server-only";
import type { Types } from "mongoose";
import { ActivityLog, AdminRequest, Assignment, Channel, ClaimRequest, Lead, Message, Note, Session, Token, TutorProfile, User } from "@/models";

type Id = Types.ObjectId | string;

// removes clients and everything hanging off them: matches, sessions, claims, notes, their team thread
export async function purgeLeads(ids: Id[]) {
  if (!ids.length) return 0;
  const channels = await Channel.find({ lead: { $in: ids } }).select("_id");
  const families = await Lead.find({ _id: { $in: ids }, familyUser: { $ne: null } }).select("familyUser");
  await Promise.all([
    Message.deleteMany({ channel: { $in: channels.map((c) => c._id) } }),
    Channel.deleteMany({ lead: { $in: ids } }),
    ClaimRequest.deleteMany({ lead: { $in: ids } }),
    Assignment.deleteMany({ lead: { $in: ids } }),
    Session.deleteMany({ lead: { $in: ids } }),
    Note.deleteMany({ entityType: "lead", entityId: { $in: ids } }),
    ActivityLog.deleteMany({ entityType: "lead", entityId: { $in: ids } }),
    AdminRequest.deleteMany({ lead: { $in: ids } }),
    User.deleteMany({ _id: { $in: families.flatMap((f) => (f.familyUser ? [f.familyUser] : [])) }, role: "family" }),
  ]);
  const res = await Lead.deleteMany({ _id: { $in: ids } });
  return res.deletedCount;
}

// removes a tutor's account; their matches end, upcoming sessions go, past sessions stay as history
export async function purgeTutor(userId: Id) {
  const now = new Date();
  await Promise.all([
    Session.deleteMany({ tutor: userId, status: "scheduled", start: { $gte: now } }),
    Assignment.updateMany({ tutor: userId, status: { $ne: "ended" } }, { status: "ended", endDate: now }),
    Lead.updateMany({ assignedTutors: userId }, { $pull: { assignedTutors: userId } }),
    ClaimRequest.deleteMany({ tutor: userId }),
    AdminRequest.deleteMany({ requester: userId }),
    TutorProfile.deleteMany({ user: userId }),
    Note.deleteMany({ entityType: "tutor", entityId: userId }),
    Token.deleteMany({ user: userId }),
    Channel.deleteMany({ kind: "dm", members: userId }),
  ]);
  await User.deleteOne({ _id: userId, role: "tutor" });
}
