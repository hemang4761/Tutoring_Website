"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { ActionError, action, requireStaff } from "@/lib/session";
import { Channel, Message, User } from "@/models";

function mentionIds(body: string, users: Array<{ _id: { toString(): string }; name: string }>) {
  const lower = body.toLowerCase();
  return users
    .filter((u) => lower.includes(`@${u.name.split(" ")[0].toLowerCase()}`))
    .map((u) => u._id);
}

async function canAccess(userId: string, channelId: string) {
  const channel = await Channel.findById(channelId);
  if (!channel || channel.archived) return null;
  if (channel.kind === "dm" && !channel.members.some((m) => m.toString() === userId)) return null;
  return channel;
}

export async function sendMessage(channelId: string, body: string) {
  return action(async () => {
    const user = await requireStaff();
    const text = body.trim();
    if (!text) throw new ActionError("Message can't be empty.");
    if (text.length > 5000) throw new ActionError("Message is too long.");
    await connectDB();
    const channel = await canAccess(user._id.toString(), channelId);
    if (!channel) throw new ActionError("Channel not found.");
    const staff = await User.find({ role: { $in: ["admin", "tutor"] }, status: { $ne: "disabled" } })
      .select("name")
      .lean();
    const mentions = mentionIds(text, staff);
    const msg = await Message.create({
      channel: channel._id,
      author: user._id,
      body: text,
      mentions: mentions.map((id) => String(id)),
    });
    channel.lastMessageAt = new Date();
    const read = channel.reads.find((r) => r.user?.toString() === user._id.toString());
    if (read) read.at = new Date();
    else channel.reads.push({ user: user._id, at: new Date() });
    await channel.save();
    revalidatePath("/admin/chat");
    revalidatePath("/tutor/chat");
    return msg._id.toString();
  });
}

export async function markChannelRead(channelId: string) {
  return action(async () => {
    const user = await requireStaff();
    await connectDB();
    const channel = await canAccess(user._id.toString(), channelId);
    if (!channel) return;
    const existing = channel.reads.find((r) => r.user?.toString() === user._id.toString());
    if (existing) existing.at = new Date();
    else channel.reads.push({ user: user._id, at: new Date() });
    await channel.save();
    revalidatePath("/admin", "layout");
    revalidatePath("/tutor", "layout");
  });
}

export async function startDirectMessage(otherUserId: string) {
  return action(async () => {
    const user = await requireStaff();
    if (otherUserId === user._id.toString()) throw new ActionError("That's you.");
    await connectDB();
    const other = await User.findOne({ _id: otherUserId, role: { $in: ["admin", "tutor"] } });
    if (!other) throw new ActionError("Person not found.");
    const members = [user._id, other._id].sort((a, b) => a.toString().localeCompare(b.toString()));
    let channel = await Channel.findOne({ kind: "dm", members: { $all: members, $size: 2 } });
    if (!channel) {
      channel = await Channel.create({
        kind: "dm",
        name: [user.name, other.name].sort().join(" & "),
        members,
        createdBy: user._id,
      });
    }
    revalidatePath("/admin/chat");
    revalidatePath("/tutor/chat");
    return channel._id.toString();
  });
}
