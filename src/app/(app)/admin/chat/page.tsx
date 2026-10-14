import { ChatApp } from "@/components/chat/chat-app";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { listChannels, listMessages, staffDirectory } from "@/lib/queries/chat";

export const metadata = { title: "Team chat" };

export default async function AdminChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await requireAdmin();
  const { c } = await searchParams;
  await connectDB();
  const channels = await listChannels(user._id);
  const active = c && channels.some((ch) => ch._id === c) ? c : channels[0]?._id;
  const messages = active ? await listMessages(active) : [];
  const people = await staffDirectory();
  return <ChatApp channels={channels} initialChannelId={active} initialMessages={messages} people={people} meId={user._id.toString()} />;
}
