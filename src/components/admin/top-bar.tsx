"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GraduationCap, Loader2, Megaphone, Plus, Search, UserRound, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { announce, loadAssignmentOptions } from "@/actions/announce";
import { searchEverything, type SearchHit } from "@/actions/panels";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAdmin, usePanel } from "./admin-context";
import { NewSessionDialog, QuickAddDialog, type AssignmentOption } from "./dialogs";

export function AdminTopBar() {
  const [search, setSearch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [sessionOptions, setSessionOptions] = useState<AssignmentOption[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-6 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSearch(true)}
        className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground hover:border-foreground/20 sm:max-w-md"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search clients, tutors, phone numbers</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[0.65rem] sm:inline">Ctrl K</kbd>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-9">
            <Plus /> New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setAdding(true)}>
            <UserRound /> Client
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void loadAssignmentOptions().then(setSessionOptions)}>
            <CalendarPlus /> Session
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAnnouncing(true)}>
            <Megaphone /> Message the team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SearchDialog open={search} onOpenChange={setSearch} />
      <QuickAddDialog open={adding} onOpenChange={setAdding} />
      <AnnounceDialog open={announcing} onOpenChange={setAnnouncing} />
      {sessionOptions ? <NewSessionDialog open onOpenChange={(v) => !v && setSessionOptions(null)} assignments={sessionOptions} /> : null}
    </div>
  );
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const panel = usePanel();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  useEffect(() => {
    const n = ++seq.current;
    const t = setTimeout(() => {
      start(async () => {
        const res = await searchEverything(q);
        if (n === seq.current) {
          setHits(res);
          setActive(0);
        }
      });
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (h: SearchHit) => {
    onOpenChange(false);
    setQ("");
    panel.open(h.kind, h.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
              if (e.key === "Enter" && hits[active]) pick(hits[active]);
            }}
            placeholder="Name, student, subject, or phone"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-1">
          {hits.map((h, i) => (
            <li key={`${h.kind}-${h.id}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(h)}
                className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm", i === active && "bg-muted")}
              >
                {h.kind === "tutor" ? <GraduationCap className="size-4 text-muted-foreground" /> : <UserRound className="size-4 text-muted-foreground" />}
                <span className="min-w-0">
                  <span className="block font-medium">{h.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{h.detail}</span>
                </span>
              </button>
            </li>
          ))}
          {q.trim().length >= 2 && !hits.length && !pending ? <li className="px-3 py-4 text-sm text-muted-foreground">No matches.</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function AnnounceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message the team</DialogTitle>
        </DialogHeader>
        <AnnounceForm onSent={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function AnnounceForm({ onSent, compact }: { onSent?: () => void; compact?: boolean }) {
  const { tutors } = useAdmin();
  const [audience, setAudience] = useState<"tutors" | "everyone" | "some">("everyone");
  const [picked, setPicked] = useState<string[]>([]);
  const [email, setEmail] = useState(true);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const res = await announce({ audience, tutorIds: picked, email, subject: String(fd.get("subject") || ""), body: String(fd.get("body") || "") });
          if (!res.ok) return void toast.error(res.error);
          toast.success(`Sent to ${res.data} ${res.data === 1 ? "person" : "people"}`);
          form.reset();
          setPicked([]);
          onSent?.();
        });
      }}
    >
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["everyone", "Everyone"],
            ["tutors", "All tutors"],
            ["some", "Pick tutors"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setAudience(v)}
            className={cn("rounded-full border px-3 py-1 text-xs", audience === v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {label}
          </button>
        ))}
      </div>
      {audience === "some" ? (
        <div className="flex flex-wrap gap-1.5">
          {tutors.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPicked((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))}
              className={cn("rounded-full border px-2.5 py-1 text-xs", picked.includes(t.id) ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted")}
            >
              {t.name}
            </button>
          ))}
        </div>
      ) : null}
      {!compact ? <Input name="subject" placeholder="Subject (for the email)" /> : null}
      <Textarea name="body" rows={compact ? 3 : 6} placeholder="Write your message" required />
      <div className="flex items-center justify-between gap-2">
        {audience !== "some" ? (
          <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            <Switch checked={email} onCheckedChange={setEmail} /> Also email
          </Label>
        ) : (
          <span className="text-xs text-muted-foreground">Sent by email</span>
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Megaphone />} Send
        </Button>
      </div>
    </form>
  );
}
