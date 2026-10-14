import "server-only";
import type { Types } from "mongoose";
import { Channel, Message, User } from "@/models";

export async function listChannels(userId: Types.ObjectId) {
  const channels = await Channel.find({
    archived: false,
    $or: [{ kind: { $in: ["general", "lead"] } }, { kind: "dm", members: userId }],
  })
    .sort({ lastMessageAt: -1 })
    .lean();
  return channels.map((c) => {
    const read = c.reads?.find((r) => r.user?.toString() === userId.toString());
    const unread = read ? c.lastMessageAt > read.at : c.lastMessageAt > new Date(Date.now() - 3 * 864e5);
    return {
      _id: c._id.toString(),
      name: c.name,
      kind: c.kind,
      topic: c.topic ?? "",
      lastMessageAt: c.lastMessageAt.toISOString(),
      unread,
    };
  });
}

export async function listMessages(channelId: string, limit = 80) {
  const msgs = await Message.find({ channel: channelId }).sort({ createdAt: 1 }).limit(limit).populate("author", "name").lean();
  return msgs.map((m) => ({
    _id: m._id.toString(),
    body: m.body,
    kind: m.kind,
    createdAt: new Date(m.createdAt).toISOString(),
    author: m.author && typeof m.author === "object" && "name" in m.author
      ? { _id: String((m.author as { _id: Types.ObjectId })._id), name: String((m.author as { name: string }).name) }
      : null,
  }));
}

export async function staffDirectory() {
  const users = await User.find({ role: { $in: ["admin", "tutor"] }, status: { $ne: "disabled" } })
    .select("name")
    .sort({ name: 1 })
    .lean();
  return users.map((u) => ({ _id: u._id.toString(), name: u.name }));
}
