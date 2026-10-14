"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { markChannelRead, sendMessage, startDirectMessage } from "@/actions/chat";
import { toastResult } from "@/lib/toast";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ChatChannel = {
  _id: string;
  name: string;
  kind: string;
  topic?: string;
  lastMessageAt: string;
  unread?: boolean;
};
export type ChatMessage = {
  _id: string;
  body: string;
  kind?: string;
  createdAt: string;
  author?: { _id?: string; name?: string } | null;
};
export type ChatPerson = { _id: string; name: string };

export function ChatApp({
  channels,
  initialChannelId,
  initialMessages,
  people,
  meId,
}: {
  channels: ChatChannel[];
  initialChannelId?: string;
  initialMessages: ChatMessage[];
  people: ChatPerson[];
  meId: string;
}) {
  const [active, setActive] = useState(initialChannelId ?? channels[0]?._id);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const current = channels.find((c) => c._id === active);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, active]);

  useEffect(() => {
    if (!active) return;
    markChannelRead(active);
    const es = new EventSource(`/api/chat/stream?channel=${active}`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as ChatMessage;
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [active]);

  const grouped = useMemo(() => {
    const general = channels.filter((c) => c.kind === "general");
    const leads = channels.filter((c) => c.kind === "lead");
    const dms = channels.filter((c) => c.kind === "dm");
    return { general, leads, dms };
  }, [channels]);

  return (
    <div className="grid h-[calc(100svh-8rem)] overflow-hidden rounded-xl border bg-card lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col border-b lg:border-r lg:border-b-0">
        <div className="border-b p-3">
          <p className="text-sm font-semibold">Team chat</p>
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const id = String(new FormData(e.currentTarget).get("person") || "");
              if (id) start(async () => {
                const res = await startDirectMessage(id);
                if (res.ok && res.data) setActive(res.data);
                toastResult(res, "Opened DM");
              });
            }}
          >
            <select name="person" className="h-8 w-full rounded-md border bg-background px-2 text-xs">
              <option value="">New DM...</option>
              {people.filter((p) => p._id !== meId).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </form>
        </div>
        <ScrollArea className="flex-1">
          {[
            ["Channels", grouped.general],
            ["Leads", grouped.leads],
            ["Direct", grouped.dms],
          ].map(([label, list]) => (
            <div key={label as string} className="p-2">
              <p className="px-2 py-1 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">{label as string}</p>
              {(list as ChatChannel[]).map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={async () => {
                    setActive(c._id);
                    const res = await fetch(`/api/chat/messages?channel=${c._id}`);
                    const data = await res.json();
                    setMessages(data.messages ?? []);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    active === c._id && "bg-muted font-medium",
                  )}
                >
                  <span className="truncate">{c.kind === "lead" ? `# ${c.name}` : c.kind === "general" ? "# general" : c.name}</span>
                  {c.unread ? <span className="size-2 rounded-full bg-gold" /> : null}
                </button>
              ))}
            </div>
          ))}
        </ScrollArea>
      </aside>
      <section className="flex min-h-0 flex-col">
        <header className="border-b px-4 py-3">
          <p className="font-semibold">{current?.kind === "general" ? "# general" : current?.name}</p>
          {current?.topic ? <p className="text-xs text-muted-foreground">{current.topic}</p> : null}
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m._id} className={cn("max-w-[80%]", m.kind === "system" && "mx-auto max-w-md text-center")}>
              {m.kind === "system" ? (
                <p className="text-xs text-muted-foreground">{m.body}</p>
              ) : (
                <div className={cn("rounded-xl px-3 py-2 text-sm", m.author?._id === meId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                  <p className="text-[0.7rem] opacity-70">{m.author?.name}</p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[0.65rem] opacity-60">{timeAgo(m.createdAt)}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form
          className="flex gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!active || !text.trim()) return;
            const payload = text;
            setText("");
            start(async () => {
              const res = await sendMessage(active, payload);
              if (!res.ok) {
                setText(payload);
                toastResult(res);
              }
            });
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message… use @FirstName to mention" />
          <Button type="submit" disabled={pending || !text.trim()}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </section>
    </div>
  );
}
