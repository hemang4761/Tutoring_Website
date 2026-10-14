import "server-only";
import type { Types } from "mongoose";
import { CLAIMABLE_STATUSES } from "@/lib/constants";
import { AdminRequest, Assignment, Channel, ClaimRequest, Lead } from "@/models";
import type { CurrentUser } from "@/lib/session";

export type NavBadges = Partial<Record<string, number>>;

export async function unreadChannelCount(userId: Types.ObjectId) {
  const channels = await Channel.find({
    archived: false,
    $or: [{ kind: { $in: ["general", "lead"] } }, { kind: "dm", members: userId }],
  })
    .select("lastMessageAt reads createdAt")
    .lean();
  return channels.filter((c) => {
    const read = c.reads?.find((r) => r.user?.toString() === userId.toString());
    // channels a user has never opened only count if they have activity in the last 3 days
    if (!read) return c.lastMessageAt > new Date(Date.now() - 3 * 864e5);
    return c.lastMessageAt > read.at;
  }).length;
}

export async function getNavBadges(user: CurrentUser): Promise<NavBadges> {
  if (user.role === "admin") {
    const [claims, requests, newLeads, chat, fees] = await Promise.all([
      ClaimRequest.countDocuments({ status: "pending" }),
      AdminRequest.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Lead.countDocuments({ status: "new" }),
      unreadChannelCount(user._id),
      Assignment.countDocuments({ "fee.status": "due" }),
    ]);
    return { dashboard: claims + requests + newLeads + fees, chat };
  }
  if (user.role === "tutor") {
    const [open, chat, requests] = await Promise.all([
      Lead.countDocuments({ status: { $in: CLAIMABLE_STATUSES } }),
      unreadChannelCount(user._id),
      AdminRequest.countDocuments({ requester: user._id, status: { $in: ["open", "in_progress"] } }),
    ]);
    return { dashboard: open, chat, requests };
  }
  return {};
}
