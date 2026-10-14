import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { Channel, Message } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "family") {
    return new Response("Unauthorized", { status: 401 });
  }
  const channelId = new URL(req.url).searchParams.get("channel");
  if (!channelId) return new Response("Missing channel", { status: 400 });
  await connectDB();
  const channel = await Channel.findById(channelId);
  if (!channel) return new Response("Not found", { status: 404 });
  if (channel.kind === "dm" && !channel.members.some((m) => m.toString() === session.user.id)) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      const change = Message.watch([{ $match: { "fullDocument.channel": new mongoose.Types.ObjectId(channelId), operationType: "insert" } }], {
        fullDocument: "updateLookup",
      });
      change.on("change", async (ev) => {
        const doc = ev.fullDocument;
        if (!doc) return;
        send({
          _id: String(doc._id),
          body: doc.body,
          kind: doc.kind,
          createdAt: doc.createdAt,
          author: doc.author ? { _id: String(doc.author) } : null,
        });
      });
      change.on("error", () => controller.close());
      const ping = setInterval(() => controller.enqueue(encoder.encode(": ping\n\n")), 25000);
      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        change.close();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
