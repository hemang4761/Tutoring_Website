import "server-only";
import type { Types } from "mongoose";
import { Channel, Message, type LeadDoc } from "@/models";

type Id = Types.ObjectId | string;

export function leadChannelName(lead: Pick<LeadDoc, "parent">) {
  const last = lead.parent.name.trim().split(/\s+/).pop() ?? lead.parent.name;
  return `${last} family`;
}

export async function createLeadChannel(lead: Pick<LeadDoc, "_id" | "parent" | "students" | "subjects">, actor?: Id) {
  const student = lead.students[0];
  const channel = await Channel.create({
    kind: "lead",
    name: leadChannelName(lead),
    lead: lead._id,
    topic: [student?.name, lead.subjects.slice(0, 3).join(", ")].filter(Boolean).join(" · "),
    createdBy: actor,
  });
  return channel;
}

export async function postSystemMessage(channelId: Id | null | undefined, body: string) {
  if (!channelId) return;
  await Message.create({ channel: channelId, kind: "system", body });
  await Channel.updateOne({ _id: channelId }, { lastMessageAt: new Date() });
}
