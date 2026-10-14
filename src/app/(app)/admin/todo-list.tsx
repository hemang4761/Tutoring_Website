"use client";

import { useState, useTransition } from "react";
import { addDays, format, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";
import { AlarmClock, Ban, CalendarPlus, Check, CircleDollarSign, Clock, Hand, Inbox, LifeBuoy, MessageCircleQuestion, MoonStar, X } from "lucide-react";
import { decideClaim } from "@/actions/claims";
import { dismissQuiet, logContact, setFeeStatus, setFollowUp, updateLeadStatus } from "@/actions/leads";
import { replyToRequest, updateRequestStatus } from "@/actions/requests";
import { updateSessionStatus } from "@/actions/sessions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ContactButtons } from "@/components/admin/contact-buttons";
import { ApproveClaim, NewSessionDialog } from "@/components/admin/dialogs";
import { usePanel } from "@/components/admin/admin-context";
import type { ClientRef, TodoItem } from "@/lib/queries/dashboard";
import { REQUEST_TYPE_LABELS, type RequestType } from "@/lib/constants";
import { fmtDateTime, money, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const META: Record<TodoItem["kind"], { icon: typeof Inbox; tone: string; label: string }> = {
  new: { icon: Inbox, tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", label: "New request" },
  claim: { icon: Hand, tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", label: "Wants a student" },
  follow_up: { icon: AlarmClock, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", label: "Follow up" },
  first_session: { icon: CalendarPlus, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300", label: "Needs a first session" },
  request: { icon: LifeBuoy, tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", label: "Tutor request" },
  unlogged: { icon: Clock, tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", label: "Not logged" },
  fee: { icon: CircleDollarSign, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", label: "Fee due" },
  quiet: { icon: MoonStar, tone: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300", label: "Gone quiet" },
};

function ClientName({ client, student }: { client: ClientRef; student?: boolean }) {
  const panel = usePanel();
  const label = student && client.student ? client.student : client.name;
  return (
    <button type="button" onClick={() => panel.open("client", client.id)} className="font-semibold hover:underline">
      {label}
    </button>
  );
}

const studentLine = (c: ClientRef) =>
  [c.student && c.student !== c.name ? c.student : "", c.grade ? `grade ${c.grade}` : "", c.subjects.slice(0, 2).join(", ")].filter(Boolean).join(" · ");

export function TodoList({ items, empty }: { items: TodoItem[]; empty?: string }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [schedule, setSchedule] = useState<Extract<TodoItem, { kind: "first_session" }> | null>(null);
  const visible = items.filter((i) => !hidden.has(i.key));

  const run = (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, done?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong");
      setHidden((h) => new Set(h).add(key));
      if (done) toast.success(done);
    });

  const checkInTomorrow = (leadId: string, name: string) =>
    toast.success(`First session logged for ${name}`, {
      duration: 10000,
      action: {
        label: "Check in tomorrow",
        onClick: () => void setFollowUp(leadId, setMinutes(setHours(addDays(new Date(), 1), 16), 0).toISOString(), "How did the first session go?"),
      },
    });

  if (!visible.length) {
    return (
      <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground">
        <Check className="size-4 text-emerald-600" /> {empty ?? "All caught up."}
      </div>
    );
  }

  return (
    <>
      <ul className={cn("divide-y", pending && "opacity-90")}>
        {visible.map((item) => {
          const meta = META[item.kind];
          const Icon = meta.icon;
          return (
            <li key={item.key} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <Body item={item} />
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {item.kind === "new" ? (
                  <>
                    <ContactButtons client={item.client} />
                    <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => run(item.key, () => logContact(item.client.id, "note", "Marked contacted"))}>
                      <Check /> Contacted
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => run(item.key, () => updateLeadStatus(item.client.id, "lost"), "Marked not a fit")}>
                      <Ban /> Not a fit
                    </Button>
                  </>
                ) : null}
                {item.kind === "claim" ? (
                  <>
                    <ApproveClaim claimId={item.claimId} tutor={item.tutor.name} rate={item.rate} />
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => run(item.key, () => decideClaim(item.claimId, "rejected"), "Declined")}>
                      <X /> Decline
                    </Button>
                  </>
                ) : null}
                {item.kind === "first_session" ? (
                  <>
                    <Button size="sm" className="h-8" onClick={() => setSchedule(item)}>
                      <CalendarPlus /> Schedule
                    </Button>
                    <ContactButtons client={item.client} tutor={item.tutor} />
                  </>
                ) : null}
                {item.kind === "unlogged" ? (
                  <>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        start(async () => {
                          const res = await updateSessionStatus(item.sessionId, "completed");
                          if (!res.ok) return void toast.error(res.error);
                          setHidden((h) => new Set(h).add(item.key));
                          if (res.data?.firstSession) checkInTomorrow(item.client.id, item.client.name);
                        })
                      }
                    >
                      <Check /> Held
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => run(item.key, () => updateSessionStatus(item.sessionId, "no_show"))}>
                      No-show
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => run(item.key, () => updateSessionStatus(item.sessionId, "canceled"))}>
                      Cancelled
                    </Button>
                  </>
                ) : null}
                {item.kind === "follow_up" ? (
                  <>
                    <ContactButtons client={item.client} />
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => run(item.key, () => setFollowUp(item.client.id, null), "Done")}>
                      <Check /> Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground"
                      onClick={() => run(item.key, () => setFollowUp(item.client.id, addDays(new Date(), 1).toISOString(), item.note), "Snoozed a day")}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground"
                      onClick={() => run(item.key, () => setFollowUp(item.client.id, addDays(new Date(), 7).toISOString(), item.note), "Snoozed a week")}
                    >
                      Next week
                    </Button>
                  </>
                ) : null}
                {item.kind === "request" ? (
                  <>
                    <ReplyButton requestId={item.requestId} onDone={() => setHidden((h) => new Set(h).add(item.key))} />
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => run(item.key, () => updateRequestStatus(item.requestId, "resolved"), "Resolved")}>
                      <Check /> Resolve
                    </Button>
                  </>
                ) : null}
                {item.kind === "fee" ? (
                  <>
                    <Button size="sm" className="h-8" onClick={() => run(item.key, () => setFeeStatus(item.assignmentId, "paid"))}>
                      <Check /> Paid
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => run(item.key, () => setFeeStatus(item.assignmentId, "waived"), "Fee waived")}>
                      Waive
                    </Button>
                  </>
                ) : null}
                {item.kind === "quiet" ? (
                  <>
                    <ContactButtons client={item.client} />
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => run(item.key, () => updateLeadStatus(item.client.id, "paused"), "Paused")}>
                      Pause
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => run(item.key, () => dismissQuiet(item.client.id))}>
                      Dismiss
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {schedule ? (
        <NewSessionDialog
          open
          onOpenChange={(v) => !v && setSchedule(null)}
          assignmentId={schedule.assignmentId}
          assignments={[
            { id: schedule.assignmentId, student: schedule.client.student || schedule.client.name, tutor: schedule.tutor, tutorId: "", subject: schedule.client.subjects[0] ?? "", leadId: schedule.client.id },
          ]}
        />
      ) : null}
    </>
  );
}

function Body({ item }: { item: TodoItem }) {
  const meta = META[item.kind];
  const when = (
    <span className="text-muted-foreground" suppressHydrationWarning>
      {" "}
      · {timeAgo(item.at)}
    </span>
  );
  switch (item.kind) {
    case "new":
      return (
        <>
          <p>
            <ClientName client={item.client} />
            {when}
          </p>
          <p className="truncate text-muted-foreground">{[studentLine(item.client), item.need].filter(Boolean).join(" · ") || meta.label}</p>
        </>
      );
    case "claim":
      return (
        <>
          <p>
            <span className="font-semibold">{item.tutor.name}</span> wants to tutor <ClientName client={item.client} student />
            {when}
          </p>
          <p className="truncate text-muted-foreground">{item.message || studentLine(item.client)}</p>
        </>
      );
    case "first_session":
      return (
        <>
          <p>
            <ClientName client={item.client} /> <span className="text-muted-foreground">with</span> {item.tutor}
          </p>
          <p className="text-muted-foreground">{meta.label}</p>
        </>
      );
    case "unlogged":
      return (
        <>
          <p>
            <ClientName client={item.client} /> <span className="text-muted-foreground">with</span> {item.tutor}
          </p>
          <p className="text-muted-foreground">{fmtDateTime(item.start)} · not logged yet</p>
        </>
      );
    case "follow_up":
      return (
        <>
          <p>
            Follow up with <ClientName client={item.client} />
          </p>
          <p className="truncate text-muted-foreground">{item.note || format(new Date(item.at), "EEE, MMM d")}</p>
        </>
      );
    case "request":
      return (
        <>
          <p>
            <span className="font-semibold">{item.from}</span>: {item.title}
            {when}
          </p>
          <p className="truncate text-muted-foreground">{REQUEST_TYPE_LABELS[item.type as RequestType] ?? ""}{item.body ? ` · ${item.body}` : ""}</p>
        </>
      );
    case "fee":
      return (
        <>
          <p>
            <span className="font-semibold">{money(item.amount)}</span> from {item.tutor}
          </p>
          <p className="text-muted-foreground">
            First-session fee for <ClientName client={item.client} />
          </p>
        </>
      );
    case "quiet":
      return (
        <>
          <p>
            <ClientName client={item.client} />
          </p>
          <p className="text-muted-foreground">{item.lastSession ? `No session since ${format(new Date(item.lastSession), "MMM d")}` : "No sessions yet"}, nothing booked</p>
        </>
      );
  }
}

function ReplyButton({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <MessageCircleQuestion /> Reply
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2">
        <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply" autoFocus />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!body.trim() || pending}
            onClick={() =>
              start(async () => {
                const res = await replyToRequest(requestId, body);
                if (!res.ok) return void toast.error(res.error);
                setOpen(false);
                setBody("");
                toast.success("Reply sent");
              })
            }
          >
            Send
          </Button>
          <Button
            size="sm"
            disabled={!body.trim() || pending}
            onClick={() =>
              start(async () => {
                const res = await replyToRequest(requestId, body);
                if (!res.ok) return void toast.error(res.error);
                await updateRequestStatus(requestId, "resolved");
                setOpen(false);
                onDone();
                toast.success("Replied and resolved");
              })
            }
          >
            Send and resolve
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
