"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "@/actions/settings";
import { inviteAdmin } from "@/actions/tutors";
import { saveOnboardingTemplate } from "@/actions/onboarding";
import { toastResult } from "@/lib/toast";
import { Panel } from "@/components/panel";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/status-badge";

type Settings = {
  orgName: string;
  replyTo: string;
  notifyTutorsOnNewLead: boolean;
  extraNotifyEmails: string;
  remindersEnabled: boolean;
  digestEnabled: boolean;
  rateTiers: Array<{ key: string; label: string; rate: number }>;
};

export function SettingsForms({
  settings,
  tutorSteps,
  familySteps,
  tutorIntro,
  familyIntro,
  admins,
}: {
  settings: Settings;
  tutorSteps: Array<{ key: string; type: string; title: string; description?: string; body?: string; options?: string[]; required: boolean }>;
  familySteps: Array<{ key: string; type: string; title: string; description?: string; body?: string; options?: string[]; required: boolean }>;
  tutorIntro: string;
  familyIntro: string;
  admins: Array<{ name: string; email: string; status: string }>;
}) {
  const [pending, start] = useTransition();
  const [s, setS] = useState(settings);
  const [tIntro, setTIntro] = useState(tutorIntro);
  const [fIntro, setFIntro] = useState(familyIntro);

  return (
    <div className="space-y-6">
      <Panel title="Organization">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => toastResult(await saveSettings(s)));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={s.orgName} onChange={(e) => setS({ ...s, orgName: e.target.value })} />
            </Field>
            <Field label="Reply-to">
              <Input value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} />
            </Field>
          </div>
          <Field label="Extra notify emails" hint="Comma-separated. Added to every new-lead blast.">
            <Input value={s.extraNotifyEmails} onChange={(e) => setS({ ...s, extraNotifyEmails: e.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={s.notifyTutorsOnNewLead} onCheckedChange={(v) => setS({ ...s, notifyTutorsOnNewLead: v })} />
              Email tutors on new leads
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={s.remindersEnabled} onCheckedChange={(v) => setS({ ...s, remindersEnabled: v })} />
              Session reminders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={s.digestEnabled} onCheckedChange={(v) => setS({ ...s, digestEnabled: v })} />
              Weekly digest
            </label>
          </div>
          <div className="space-y-2">
            <Label>Rate tiers</Label>
            {s.rateTiers.map((r, i) => (
              <div key={r.key} className="grid grid-cols-[1fr_100px] gap-2">
                <Input value={r.label} onChange={(e) => setS({ ...s, rateTiers: s.rateTiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <Input type="number" value={r.rate} onChange={(e) => setS({ ...s, rateTiers: s.rateTiers.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)) })} />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={pending}>
            Save settings
          </Button>
        </form>
      </Panel>

      <Panel title="Tutor onboarding">
        <Textarea className="mb-3" value={tIntro} onChange={(e) => setTIntro(e.target.value)} rows={3} />
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => toastResult(await saveOnboardingTemplate("tutor", tIntro, tutorSteps)))}
        >
          Save tutor template
        </Button>
      </Panel>
      <Panel title="Family onboarding">
        <Textarea className="mb-3" value={fIntro} onChange={(e) => setFIntro(e.target.value)} rows={3} />
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => toastResult(await saveOnboardingTemplate("family", fIntro, familySteps)))}
        >
          Save family template
        </Button>
      </Panel>

      <Panel title="Admins">
        <ul className="mb-4 space-y-2 text-sm">
          {admins.map((a) => (
            <li key={a.email} className="flex items-center justify-between">
              <span>
                {a.name} <span className="text-muted-foreground">{a.email}</span>
              </span>
              <StatusPill status={a.status} />
            </li>
          ))}
        </ul>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => toastResult(await inviteAdmin({ name: String(fd.get("name")), email: String(fd.get("email")) })));
          }}
        >
          <Input name="name" required placeholder="Name" />
          <Input name="email" type="email" required placeholder="Email" />
          <Button type="submit" disabled={pending}>
            Invite
          </Button>
        </form>
      </Panel>
    </div>
  );
}
