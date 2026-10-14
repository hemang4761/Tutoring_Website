"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarPlus, Check, Loader2, Mail, MessageSquare, Phone, Pin, Plus, Trash2, UserPlus, X } from "lucide-react";
import { loadClient, loadTutor, type ClientPanelData, type TutorPanelData } from "@/actions/panels";
import {
  addNote,
  deleteLead,
  deleteNote,
  removeContact,
  setFeeStatus,
  setFollowUp,
  updateAssignment,
  updateLeadDetails,
  updateLeadStatus,
  upsertStudent,
} from "@/actions/leads";
import { decideClaim } from "@/actions/claims";
import { updateSessionStatus } from "@/actions/sessions";
import { resendInvite, setTutorStatus, updateTutorProfile } from "@/actions/tutors";
import { deleteAssignment, deleteTutor, removeStudent } from "@/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LeadStatusBadge, SessionStatusBadge } from "@/components/status-badge";
import { CONTACT_CHANNEL_LABELS, LEAD_STATUSES, LEAD_STATUS_LABELS, type ContactChannel } from "@/lib/constants";
import { fmtDateTime, money, timeAgo } from "@/lib/format";
import { toastResult } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { usePanel } from "./admin-context";
import { ContactButtons } from "./contact-buttons";
import { AssignDialog, NewSessionDialog } from "./dialogs";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const select = "h-8 rounded-md border bg-background px-2 text-sm";

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PanelHost() {
  const { clientId, tutorId, close } = usePanel();
  const open = Boolean(clientId || tutorId);
  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:w-full! data-[side=right]:sm:max-w-xl!">
        {clientId ? <ClientPanel key={clientId} id={clientId} /> : null}
        {tutorId ? <TutorPanel key={tutorId} id={tutorId} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function useLoader<T>(fn: (id: string) => Promise<T>, id: string) {
  const [data, setData] = useState<T | null | undefined>(undefined);
  const reload = useCallback(() => {
    void fn(id).then(setData);
  }, [fn, id]);
  useEffect(reload, [reload]);
  return { data, reload };
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center text-muted-foreground">
      <Loader2 className="animate-spin" />
      <SheetTitle className="sr-only">Loading</SheetTitle>
    </div>
  );
}

/* ---------------- client ---------------- */

function ClientPanel({ id }: { id: string }) {
  const { data, reload } = useLoader(loadClient, id);
  if (data === undefined) return <Loading />;
  if (data === null)
    return (
      <div className="p-6">
        <SheetTitle>Client not found</SheetTitle>
      </div>
    );
  return <ClientBody c={data} reload={reload} />;
}

function ClientBody({ c, reload }: { c: ClientPanelData; reload: () => void }) {
  const [pending, start] = useTransition();
  const [scheduling, setScheduling] = useState(false);
  const panel = usePanel();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, msg?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong");
      if (msg) toast.success(msg);
      reload();
    });
  const ref = { id: c.id, name: c.name, phone: c.phone, email: c.email, student: c.students[0]?.name ?? "", grade: c.students[0]?.grade ?? "", subjects: c.subjects };
  const activeAssignments = c.assignments.filter((a) => a.status !== "ended");

  return (
    <div className={cn("flex min-h-full flex-col", pending && "opacity-80")}>
      <header className="space-y-3 border-b p-5 pr-12">
        <div className="space-y-1">
          <SheetTitle className="font-heading text-xl">{c.name}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {[c.students.map((s) => (s.name !== c.name ? s.name : "")).filter(Boolean).join(", "), c.students[0]?.grade && `grade ${c.students[0].grade}`, c.subjects.slice(0, 3).join(", ")]
              .filter(Boolean)
              .join(" · ") || "No student details yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {c.stats.sessions} sessions · {c.stats.hours} h total · {c.stats.hoursThisMonth} h this month · since {format(new Date(c.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={select} value={c.status} onChange={(e) => run(() => updateLeadStatus(c.id, e.target.value), "Status updated")}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <ContactButtons client={ref} tutor={activeAssignments[0]?.tutor.name} />
        </div>
      </header>

      <Tabs defaultValue={c.assignments.length || c.status === "active" ? "tutoring" : "overview"} className="flex-1 gap-0">
        <TabsList className="mx-5 mt-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tutoring">Tutoring</TabsTrigger>
          <TabsTrigger value="log">Notes &amp; log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 p-5">
          <ContactForm c={c} onSaved={reload} />
          <Section title="Students">
            <div className="space-y-2">
              {c.students.map((s) => (
                <StudentRow key={s.id} leadId={c.id} student={s} onSaved={reload} canRemove={c.students.length > 1} />
              ))}
              <StudentRow leadId={c.id} onSaved={reload} />
            </div>
          </Section>
          {c.intake.length || c.message ? (
            <Section title={c.respondent ? `Their request (filled out by the ${c.respondent})` : "Their request"}>
              <dl className="space-y-2 text-sm">
                {c.intake.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="whitespace-pre-line">{value}</dd>
                  </div>
                ))}
                {c.message && !c.intake.length ? <dd className="whitespace-pre-line">{c.message}</dd> : null}
              </dl>
            </Section>
          ) : null}
        </TabsContent>

        <TabsContent value="tutoring" className="space-y-6 p-5">
          {c.claims.length ? (
            <Section title="Tutors who want this student">
              <ul className="space-y-2">
                {c.claims.map((cl) => (
                  <li key={cl.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{cl.tutor}</span>
                      {cl.message ? <span className="block text-muted-foreground">{cl.message}</span> : null}
                    </span>
                    <span className="flex gap-1">
                      <Button size="sm" className="h-7" onClick={() => run(() => decideClaim(cl.id, "approved"), "Matched")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => run(() => decideClaim(cl.id, "rejected"))}>
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section
            title="Tutors"
            action={
              <AssignDialog
                client={{ id: c.id, name: c.name, subjects: c.subjects, grade: c.students[0]?.grade ?? "", rateTier: c.rateTier }}
                trigger={
                  <Button size="sm" variant="outline" className="h-7">
                    <UserPlus /> Add tutor
                  </Button>
                }
              />
            }
          >
            {c.assignments.length ? (
              <ul className="space-y-2">
                {c.assignments.map((a) => (
                  <li key={a.id} className={cn("space-y-2 rounded-lg border p-3 text-sm", a.status === "ended" && "opacity-60")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p>
                        <button type="button" className="font-semibold hover:underline" onClick={() => panel.open("tutor", a.tutor.id)}>
                          {a.tutor.name}
                        </button>
                        <span className="text-muted-foreground"> · {a.student}</span>
                      </p>
                      <select className={select} value={a.status} onChange={(e) => run(() => updateAssignment(a.id, { status: e.target.value }), "Updated")}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          defaultValue={a.rate}
                          className="h-7 w-20"
                          onBlur={(e) => {
                            const rate = Number(e.target.value);
                            if (rate !== a.rate) run(() => updateAssignment(a.id, { rate }), "Rate updated");
                          }}
                        />
                        <span className="text-muted-foreground">/ hr</span>
                      </label>
                      <FeeChip fee={a.fee} onPaid={() => run(() => setFeeStatus(a.id, "paid"))} onWaive={() => run(() => setFeeStatus(a.id, "waived"))} />
                      <button
                        type="button"
                        className="ml-auto text-xs text-muted-foreground hover:text-rose-600"
                        onClick={() => confirm(`Remove ${a.tutor.name} from ${a.student}? This also deletes their sessions together. Use Ended to keep the history.`) && run(() => deleteAssignment(a.id), "Match removed")}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tutor yet.</p>
            )}
          </Section>

          <Section
            title="Upcoming"
            action={
              activeAssignments.length ? (
                <Button size="sm" variant="outline" className="h-7" onClick={() => setScheduling(true)}>
                  <CalendarPlus /> Schedule
                </Button>
              ) : null
            }
          >
            {c.upcoming.length ? (
              <ul className="divide-y rounded-lg border text-sm">
                {c.upcoming.map((s) => (
                  <li key={s.id} className="flex justify-between px-3 py-2">
                    <span>{fmtDateTime(s.start)}</span>
                    <span className="text-muted-foreground">{s.tutor}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing booked.</p>
            )}
          </Section>

          {c.past.length ? (
            <Section title="Past sessions">
              <ul className="divide-y rounded-lg border text-sm">
                {c.past.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {format(new Date(s.start), "EEE, MMM d · h:mm a")}
                      <span className="text-muted-foreground"> · {s.tutor.split(" ")[0]}</span>
                    </span>
                    {s.status === "scheduled" ? (
                      <span className="flex gap-1">
                        <Button size="sm" className="h-7" onClick={() => run(() => updateSessionStatus(s.id, "completed"), "Logged")}>
                          Held
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => run(() => updateSessionStatus(s.id, "no_show"))}>
                          No-show
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => run(() => updateSessionStatus(s.id, "canceled"))}>
                          Cancelled
                        </Button>
                      </span>
                    ) : (
                      <SessionStatusBadge status={s.status} />
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </TabsContent>

        <TabsContent value="log" className="space-y-6 p-5">
          <FollowUpForm c={c} onSaved={reload} />
          <Section title="Contact log">
            {c.contactLog.length ? (
              <ul className="space-y-1 text-sm">
                {c.contactLog.map((e) => (
                  <li key={e.id} className="group flex items-start justify-between gap-2">
                    <span>
                      <span className="font-medium">{CONTACT_CHANNEL_LABELS[e.channel as ContactChannel] ?? e.channel}</span>
                      {e.note ? <span> · {e.note}</span> : null}
                      <span className="text-muted-foreground"> · {timeAgo(e.at)}</span>
                    </span>
                    <button type="button" aria-label="Remove" className="opacity-0 group-hover:opacity-60 hover:opacity-100" onClick={() => run(() => removeContact(c.id, e.id))}>
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No contact logged yet.</p>
            )}
          </Section>
          <NotesSection entity="lead" entityId={c.id} notes={c.notes} onChange={reload} />
          <div className="flex items-center justify-between border-t pt-4 text-sm">
            {c.channel ? (
              <Link href={`/admin/chat?c=${c.channel}`} className="text-muted-foreground hover:underline">
                Open team thread
              </Link>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600"
              onClick={() => {
                if (!confirm(`Delete ${c.name} and all of their matches, sessions and notes? This can't be undone.`)) return;
                start(async () => {
                  const res = await deleteLead(c.id);
                  toastResult(res);
                  if (res.ok) panel.close();
                });
              }}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {scheduling ? (
        <NewSessionDialog
          open
          onOpenChange={(v) => {
            if (!v) {
              setScheduling(false);
              reload();
            }
          }}
          assignmentId={activeAssignments.length === 1 ? activeAssignments[0].id : undefined}
          assignments={activeAssignments.map((a) => ({ id: a.id, student: a.student, tutor: a.tutor.name, tutorId: a.tutor.id, subject: a.subjects[0] ?? "", leadId: c.id }))}
        />
      ) : null}
    </div>
  );
}

function FeeChip({ fee, onPaid, onWaive }: { fee: { amount: number; status: string }; onPaid: () => void; onWaive: () => void }) {
  if (fee.status === "pending") return <span className="text-xs text-muted-foreground">Fee due after first session</span>;
  if (fee.status === "paid") return <span className="text-xs text-emerald-700 dark:text-emerald-400">Fee {money(fee.amount)} paid</span>;
  if (fee.status === "waived") return <span className="text-xs text-muted-foreground">Fee waived</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="font-medium text-amber-700 dark:text-amber-400">Fee {money(fee.amount)} due</span>
      <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onPaid}>
        <Check /> Paid
      </Button>
      <button type="button" className="text-muted-foreground hover:underline" onClick={onWaive}>
        Waive
      </button>
    </span>
  );
}

function ContactForm({ c, onSaved }: { c: ClientPanelData; onSaved: () => void }) {
  const [pending, start] = useTransition();
  return (
    <Section title="Contact">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await updateLeadDetails(c.id, {
              parentName: String(fd.get("name")),
              parentEmail: String(fd.get("email") || ""),
              parentPhone: String(fd.get("phone") || ""),
              source: String(fd.get("source") || ""),
            });
            toastResult(res);
            if (res.ok) onSaved();
          });
        }}
      >
        <Input name="name" defaultValue={c.name} placeholder="Name" className="sm:col-span-2" />
        <Input name="phone" defaultValue={c.phone} placeholder="Phone" />
        <Input name="email" defaultValue={c.email} placeholder="Email" />
        <Input name="source" defaultValue={c.source} placeholder="How they found us" />
        <Button type="submit" variant="outline" disabled={pending}>
          Save contact
        </Button>
      </form>
    </Section>
  );
}

function StudentRow({
  leadId,
  student,
  onSaved,
  canRemove,
}: {
  leadId: string;
  student?: { id: string; name: string; grade: string; school: string; subjects: string[] };
  onSaved: () => void;
  canRemove?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (!editing) {
    return student ? (
      <button type="button" onClick={() => setEditing(true)} className="block w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50">
        <span className="font-medium">{student.name}</span>
        <span className="text-muted-foreground">
          {[student.grade && ` · grade ${student.grade}`, student.school && ` · ${student.school}`].filter(Boolean).join("")}
        </span>
        <span className="block text-muted-foreground">{student.subjects.join(", ") || "No subjects yet"}</span>
      </button>
    ) : (
      <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" onClick={() => setEditing(true)}>
        <Plus /> Add student
      </Button>
    );
  }
  return (
    <form
      className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_80px]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await upsertStudent(leadId, student?.id ?? null, {
            name: String(fd.get("name")),
            grade: String(fd.get("grade") || "?"),
            school: String(fd.get("school") || ""),
            subjects: String(fd.get("subjects") || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          });
          toastResult(res);
          if (res.ok) {
            setEditing(false);
            onSaved();
          }
        });
      }}
    >
      <Input name="name" defaultValue={student?.name} placeholder="Student name" required autoFocus />
      <Input name="grade" defaultValue={student?.grade} placeholder="Grade" />
      <Input name="school" defaultValue={student?.school} placeholder="School" className="sm:col-span-2" />
      <Input name="subjects" defaultValue={student?.subjects.join(", ")} placeholder="Subjects, comma separated" className="sm:col-span-2" />
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        {student && canRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-rose-600"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await removeStudent(leadId, student.id);
                toastResult(res);
                if (res.ok) onSaved();
              })
            }
          >
            Remove student
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FollowUpForm({ c, onSaved }: { c: ClientPanelData; onSaved: () => void }) {
  const [pending, start] = useTransition();
  const quick = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(16, 0, 0, 0);
    return d;
  };
  const save = (at: Date | null, note: string) =>
    start(async () => {
      const res = await setFollowUp(c.id, at ? at.toISOString() : null, note);
      toastResult(res);
      if (res.ok) onSaved();
    });
  return (
    <Section title="Next follow-up">
      {c.followUp ? (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span>
            {format(new Date(c.followUp.at), "EEE, MMM d")}
            {c.followUp.note ? <span className="text-muted-foreground"> · {c.followUp.note}</span> : null}
          </span>
          <Button size="sm" variant="ghost" className="h-7" disabled={pending} onClick={() => save(null, "")}>
            Clear
          </Button>
        </div>
      ) : null}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const day = String(fd.get("day") || "");
          if (!day) return;
          save(new Date(`${day}T16:00`), String(fd.get("note") || ""));
        }}
      >
        <Input name="note" placeholder="What about? (optional)" className="h-8 min-w-40 flex-1" />
        <Input name="day" type="date" className="h-8 w-40" />
        <Button size="sm" type="submit" variant="outline" className="h-8" disabled={pending}>
          Set
        </Button>
      </form>
      <div className="flex gap-1.5">
        {[
          [1, "Tomorrow"],
          [7, "In a week"],
          [30, "In a month"],
        ].map(([d, label]) => (
          <Button key={label} size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled={pending} onClick={() => save(quick(Number(d)), "")}>
            {label}
          </Button>
        ))}
      </div>
    </Section>
  );
}

function NotesSection({
  entity,
  entityId,
  notes,
  onChange,
}: {
  entity: "lead" | "tutor";
  entityId: string;
  notes: Array<{ id: string; body: string; author: string; at: string; pinned?: boolean }>;
  onChange: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <Section title="Notes">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await addNote(entity, entityId, body);
            if (!res.ok) return void toast.error(res.error);
            setBody("");
            onChange();
          });
        }}
      >
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note" />
        {body.trim() ? (
          <Button size="sm" type="submit" disabled={pending}>
            Add note
          </Button>
        ) : null}
      </form>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="group rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <p className="whitespace-pre-line">
              {n.pinned ? <Pin className="mr-1 inline size-3" /> : null}
              {n.body}
            </p>
            <p className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>
                {n.author} · {timeAgo(n.at)}
              </span>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100"
                onClick={() =>
                  start(async () => {
                    await deleteNote(n.id);
                    onChange();
                  })
                }
              >
                Delete
              </button>
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------- tutor ---------------- */

function TutorPanel({ id }: { id: string }) {
  const { data, reload } = useLoader(loadTutor, id);
  if (data === undefined) return <Loading />;
  if (data === null)
    return (
      <div className="p-6">
        <SheetTitle>Tutor not found</SheetTitle>
      </div>
    );
  return <TutorBody t={data} reload={reload} />;
}

function TutorBody({ t, reload }: { t: TutorPanelData; reload: () => void }) {
  const [pending, start] = useTransition();
  const panel = usePanel();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong");
      if (msg) toast.success(msg);
      reload();
    });
  const inactive = t.status === "inactive" || t.accountStatus === "disabled";
  const phone = t.phone.replace(/[^\d+]/g, "");

  return (
    <div className={cn("flex min-h-full flex-col", pending && "opacity-80")}>
      <header className="space-y-3 border-b p-5 pr-12">
        <div className="space-y-1">
          <SheetTitle className="font-heading text-xl">{t.name}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t.subjects.join(", ") || "No subjects listed"}</p>
          <p className="text-xs text-muted-foreground">
            {t.stats.hoursThisMonth} h this month · {money(t.stats.earnedThisMonth)} earned · {t.stats.hoursTotal} h all time
            {t.stats.feesDue ? ` · ${money(t.stats.feesDue)} in fees due` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {inactive ? <LeadStatusBadge status="paused" className="mr-1" /> : null}
          {t.phone ? (
            <>
              <Button size="sm" variant="outline" className="h-8" asChild>
                <a href={`sms:${phone}`}>
                  <MessageSquare /> Text
                </a>
              </Button>
              <Button size="sm" variant="ghost" className="h-8" asChild>
                <a href={`tel:${phone}`}>
                  <Phone /> Call
                </a>
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" className="h-8" asChild>
            <a href={`mailto:${t.email}`}>
              <Mail /> Email
            </a>
          </Button>
          <Button size="sm" variant="ghost" className="h-8" asChild>
            <Link href={`/admin/schedule?tutors=${t.id}`}>
              <CalendarPlus /> Schedule
            </Link>
          </Button>
        </div>
      </header>

      <div className="space-y-6 p-5">
        {t.unlogged ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
            {t.unlogged} past session{t.unlogged === 1 ? " hasn't" : "s haven't"} been logged yet.
          </p>
        ) : null}

        <Section title="Students">
          {t.students.length ? (
            <ul className="divide-y rounded-lg border text-sm">
              {t.students.map((s) => (
                <li key={s.id} className={cn("flex items-center justify-between gap-2 px-3 py-2", s.status === "ended" && "opacity-50")}>
                  <button type="button" className="text-left hover:underline" onClick={() => panel.open("client", s.leadId)}>
                    <span className="font-medium">{s.student}</span>
                    <span className="text-muted-foreground"> · ${s.rate}/hr{s.status !== "active" ? ` · ${s.status}` : ""}</span>
                  </button>
                  {s.fee.status === "due" ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => run(() => setFeeStatus(s.id, "paid"), "Fee marked paid")}>
                      Fee {money(s.fee.amount)} paid
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          )}
        </Section>

        <Section title="Coming up">
          {t.upcoming.length ? (
            <ul className="divide-y rounded-lg border text-sm">
              {t.upcoming.map((s) => (
                <li key={s.id} className="flex justify-between px-3 py-2">
                  <span>{fmtDateTime(s.start)}</span>
                  <span className="text-muted-foreground">{s.student}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing booked.</p>
          )}
        </Section>

        <Section title="Availability">
          {t.availability.length ? (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {t.availability.map((a, i) => (
                <span key={i} className="rounded-full bg-muted px-2.5 py-1">
                  {DAYS[a.day]} {a.start}–{a.end}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not set.</p>
          )}
        </Section>

        <TutorProfileForm t={t} onSaved={reload} />

        <NotesSection entity="tutor" entityId={t.id} notes={t.notes} onChange={reload} />

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {t.accountStatus === "invited" ? (
            <Button size="sm" variant="outline" onClick={() => run(() => resendInvite(t.id), "Invite resent")}>
              Resend invite
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => run(() => setTutorStatus(t.id, inactive ? "active" : "inactive"))}>
            {inactive ? "Reactivate" : "Deactivate"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-rose-600"
            onClick={() => {
              if (!confirm(`Delete ${t.name}'s account? Their upcoming sessions are removed and their matches end. Past sessions stay in the history.`)) return;
              start(async () => {
                const res = await deleteTutor(t.id);
                toastResult(res);
                if (res.ok) panel.close();
              });
            }}
          >
            <Trash2 /> Delete tutor
          </Button>
        </div>
      </div>
    </div>
  );
}

function TutorProfileForm({ t, onSaved }: { t: TutorPanelData; onSaved: () => void }) {
  const [pending, start] = useTransition();
  const [showOnSite, setShowOnSite] = useState(t.showOnSite);
  const split = (v: FormDataEntryValue | null) =>
    String(v || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return (
    <Section title="Profile">
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await updateTutorProfile(t.id, {
              name: String(fd.get("name") || t.name),
              email: String(fd.get("email") || t.email),
              phone: String(fd.get("phone") || ""),
              headline: String(fd.get("headline") || ""),
              subjects: split(fd.get("subjects")),
              gradeLevels: split(fd.get("grades")),
              maxStudents: Number(fd.get("max")) || 4,
              showOnSite,
            });
            toastResult(res);
            if (res.ok) onSaved();
          });
        }}
      >
        <Input name="name" defaultValue={t.name} placeholder="Name" />
        <Input name="email" type="email" defaultValue={t.email} placeholder="Email (also their login)" />
        <Input name="phone" defaultValue={t.phone} placeholder="Phone" />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Max students</span>
          <Input name="max" type="number" min={1} max={20} defaultValue={t.maxStudents} className="w-20" />
        </label>
        <Input name="subjects" defaultValue={t.subjects.join(", ")} placeholder="Subjects, comma separated" className="sm:col-span-2" />
        <Input name="grades" defaultValue={t.gradeLevels.join(", ")} placeholder="Grades, e.g. 6, 7, 8" className="sm:col-span-2" />
        <Input name="headline" defaultValue={t.headline} placeholder="One-line headline for the website" className="sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={showOnSite} onCheckedChange={setShowOnSite} /> Show on the website
        </label>
        <Button type="submit" variant="outline" disabled={pending}>
          Save profile
        </Button>
      </form>
    </Section>
  );
}
