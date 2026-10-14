"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Pin, Trash2 } from "lucide-react";
import { addNote, assignTutor, deleteLead, deleteNote, inviteFamily, toggleNotePin, updateLeadStatus } from "@/actions/leads";
import { decideClaim } from "@/actions/claims";
import { toastResult } from "@/lib/toast";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, RATE_TIERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/confirm-button";

export function StatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(v) => start(async () => toastResult(await updateLeadStatus(leadId, v)))}
    >
      <SelectTrigger className="h-9 w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AssignForm({
  leadId,
  tutors,
  students,
}: {
  leadId: string;
  tutors: Array<{ _id: string; name: string }>;
  students: Array<{ _id: string; name: string }>;
}) {
  const [pending, start] = useTransition();
  const [tutorId, setTutorId] = useState("");
  const [studentId, setStudentId] = useState(students[0]?._id ?? "");
  const [rateTier, setRateTier] = useState("hs");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!tutorId) return;
        start(async () => toastResult(await assignTutor(leadId, { tutorId, studentId, rateTier })));
      }}
    >
      <Select value={tutorId} onValueChange={setTutorId}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="Choose a tutor" />
        </SelectTrigger>
        <SelectContent>
          {tutors.map((t) => (
            <SelectItem key={t._id} value={t._id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {students.length > 1 ? (
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Select value={rateTier} onValueChange={setRateTier}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RATE_TIERS.map((r) => (
            <SelectItem key={r.key} value={r.key}>
              {r.label} · ${r.rate}/hr
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" className="w-full" disabled={pending || !tutorId}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Assign tutor
      </Button>
    </form>
  );
}

export function InviteFamilyButton({ leadId, disabled }: { leadId: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={disabled || pending}
      onClick={() => start(async () => toastResult(await inviteFamily(leadId), "Invite sent"))}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Mail />}
      Invite family to portal
    </Button>
  );
}

export function NoteForm({ entityType, entityId }: { entityType: "lead" | "tutor"; entityId: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addNote(entityType, entityId, body);
          toastResult(res, "Note added");
          if (res.ok) setBody("");
        });
      }}
    >
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Add an internal note..." />
      <Button type="submit" size="sm" disabled={pending || !body.trim()}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Add note
      </Button>
    </form>
  );
}

export function NoteActions({ noteId, pinned }: { noteId: string; pinned: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <Button size="icon-xs" variant="ghost" disabled={pending} onClick={() => start(async () => { await toggleNotePin(noteId); })}>
        <Pin className={pinned ? "fill-current" : ""} />
      </Button>
      <Button size="icon-xs" variant="ghost" disabled={pending} onClick={() => start(async () => { await deleteNote(noteId); })}>
        <Trash2 />
      </Button>
    </div>
  );
}

export function ClaimDecision({ claimId }: { claimId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => start(async () => toastResult(await decideClaim(claimId, "approved")))}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => toastResult(await decideClaim(claimId, "rejected")))}>
        Decline
      </Button>
    </div>
  );
}

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      title="Delete this lead?"
      description="This removes the lead, its notes, and claims. Leads with sessions can't be deleted."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={async () => {
        const res = await deleteLead(leadId);
        toastResult(res, "Deleted");
        if (res.ok) router.push("/admin/leads");
      }}
    >
      Delete lead
    </ConfirmButton>
  );
}
