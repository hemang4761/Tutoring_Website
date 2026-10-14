import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listMessages } from "@/lib/queries/chat";
import { Channel } from "@/models";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "family") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channelId = new URL(req.url).searchParams.get("channel");
  if (!channelId) return NextResponse.json({ messages: [] });
  await connectDB();
  const channel = await Channel.findById(channelId);
  if (!channel) return NextResponse.json({ messages: [] });
  if (channel.kind === "dm" && !channel.members.some((m) => m.toString() === session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ messages: await listMessages(channelId) });
}
