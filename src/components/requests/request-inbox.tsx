"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createRequest, replyToRequest, updateRequestStatus } from "@/actions/requests";
import { toastResult } from "@/lib/toast";
import { REQUEST_STATUSES, REQUEST_TYPES, REQUEST_TYPE_LABELS, type RequestStatus } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { RequestTypeBadge, StatusPill } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type RequestRow = {
  _id: string;
  title: string;
  body?: string;
  type: string;
  status: string;
  priority?: string;
  createdAt: string;
  requester?: { name?: string; role?: string };
  replies?: Array<{ _id?: string; body: string; createdAt?: string; author?: { name?: string } }>;
};

export function RequestInbox({
  role,
  requests,
  initialId,
}: {
  role: "admin" | "tutor" | "family";
  requests: RequestRow[];
  initialId?: string;
}) {
  const [selected, setSelected] = useState(initialId ?? requests[0]?._id);
  const current = requests.find((r) => r._id === selected) ?? requests[0];
  return (
    <div className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[320px_1fr]">
      <ul className="max-h-[70vh] divide-y overflow-y-auto">
        {requests.map((r) => (
          <li key={r._id}>
            <button
              type="button"
              onClick={() => setSelected(r._id)}
              className={cn("w-full px-4 py-3 text-left hover:bg-muted/50", current?._id === r._id && "bg-muted")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{r.title}</p>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {r.requester?.name ?? "You"} · {timeAgo(r.createdAt)}
              </p>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t p-5 lg:border-t-0 lg:border-l">
        {current ? <RequestDetail request={current} role={role} /> : <p className="text-sm text-muted-foreground">Select a request.</p>}
      </div>
    </div>
  );
}

function RequestDetail({ request, role }: { request: RequestRow; role: "admin" | "tutor" | "family" }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{request.title}</h2>
          <p className="text-sm text-muted-foreground">
            {request.requester?.name} · {timeAgo(request.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RequestTypeBadge type={request.type} />
          {role === "admin" ? (
            <Select
              value={request.status}
              onValueChange={(v) => start(async () => toastResult(await updateRequestStatus(request._id, v as RequestStatus)))}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusPill status={request.status} />
          )}
        </div>
      </div>
      {request.body ? <p className="whitespace-pre-wrap text-sm">{request.body}</p> : null}
      <div className="space-y-3">
        {(request.replies ?? []).map((r, i) => (
          <div key={r._id ?? i} className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {typeof r.author === "object" ? r.author?.name : "Reply"} · {r.createdAt ? timeAgo(r.createdAt) : ""}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await replyToRequest(request._id, body);
          toastResult(res, "Reply sent");
          if (res.ok) setBody("");
          });
        }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Reply..." />
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Reply
        </Button>
      </form>
    </div>
  );
}

export function NewRequestForm({
  types = REQUEST_TYPES,
}: {
  types?: readonly string[];
}) {
  const [pending, start] = useTransition();
  const options = useMemo(() => types.filter((t) => REQUEST_TYPES.includes(t as (typeof REQUEST_TYPES)[number])), [types]);
  const [type, setType] = useState(options[0] ?? "other");
  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await createRequest({
            type: type as (typeof REQUEST_TYPES)[number],
            title: String(fd.get("title") || ""),
            body: String(fd.get("body") || ""),
          });
          toastResult(res, "Request sent");
          if (res.ok) (e.target as HTMLFormElement).reset();
        });
      }}
    >
      <p className="font-semibold">New request</p>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((t) => (
            <SelectItem key={t} value={t}>
              {REQUEST_TYPE_LABELS[t as keyof typeof REQUEST_TYPE_LABELS] ?? t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="title" required placeholder="Short title" />
      <Textarea name="body" rows={3} placeholder="Details..." />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Send to admins
      </Button>
    </form>
  );
}
