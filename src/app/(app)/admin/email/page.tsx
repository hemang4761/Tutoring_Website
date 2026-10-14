"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { broadcastEmail } from "@/actions/settings";
import { toastResult } from "@/lib/toast";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusPill } from "@/components/status-badge";
import { fmtDateTime } from "@/lib/format";

type Log = { _id: string; to: string[]; subject: string; kind: string; status: string; createdAt: string };

export default function EmailPage() {
  const [pending, start] = useTransition();
  const [audience, setAudience] = useState("active_tutors");
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/email/logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, [pending]);

  return (
    <>
      <PageHeader title="Email" description="Broadcast to tutors or admins. Every send is logged." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form
          className="space-y-4 rounded-xl border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              toastResult(
                await broadcastEmail({
                  audience: audience as "all_tutors" | "active_tutors" | "admins" | "all_staff",
                  subject: String(fd.get("subject") || ""),
                  heading: String(fd.get("heading") || ""),
                  body: String(fd.get("body") || ""),
                }),
              );
            });
          }}
        >
          <Field label="Audience">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active_tutors">Active tutors</SelectItem>
                <SelectItem value="all_tutors">All tutors</SelectItem>
                <SelectItem value="admins">Admins</SelectItem>
                <SelectItem value="all_staff">All staff</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subject">
            <Input name="subject" required />
          </Field>
          <Field label="Heading">
            <Input name="heading" required />
          </Field>
          <Field label="Body">
            <Textarea name="body" rows={8} required placeholder="Use a blank line between paragraphs." />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Send
          </Button>
        </form>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 font-semibold">Recent sends</p>
          <ul className="space-y-3">
            {logs.map((l) => (
              <li key={l._id} className="border-b pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{l.subject}</p>
                  <StatusPill status={l.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {l.kind} · {l.to.length} recipients · {fmtDateTime(l.createdAt)}
                </p>
              </li>
            ))}
            {!logs.length ? <p className="text-sm text-muted-foreground">No emails yet.</p> : null}
          </ul>
        </div>
      </div>
    </>
  );
}
