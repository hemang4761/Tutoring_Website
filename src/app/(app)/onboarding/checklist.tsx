"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { completeOnboarding, saveOnboardingStep } from "@/actions/onboarding";
import { toastResult } from "@/lib/toast";
import { AvailabilityGrid } from "@/components/forms/availability-grid";
import { AvailabilityEditor } from "@/components/schedule/availability-editor";
import { ChoiceCards } from "@/components/forms/choice-cards";
import { SubjectPicker } from "@/components/forms/subject-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Step = {
  key: string;
  type: string;
  title: string;
  description?: string;
  body?: string;
  options?: string[];
  required: boolean;
  done: boolean;
  value?: unknown;
};

export function OnboardingChecklist({
  intro,
  steps,
  name,
  phone,
  role,
}: {
  intro: string;
  steps: Step[];
  name: string;
  phone: string;
  role: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(steps.find((s) => !s.done)?.key ?? steps[0]?.key);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Onboarding</p>
        <h1 className="mt-1 text-3xl font-bold">Finish your setup</h1>
        <p className="mt-2 text-muted-foreground">{intro}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-gold" style={{ width: `${(doneCount / Math.max(1, steps.length)) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {doneCount} of {steps.length} complete
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <section key={step.key} className="overflow-hidden rounded-xl border bg-card">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() => setOpen(open === step.key ? "" : step.key)}
            >
              <span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold", step.done ? "bg-emerald-500 text-white" : "bg-muted")}>
                {step.done ? <CheckCircle2 className="size-4" /> : steps.indexOf(step) + 1}
              </span>
              <span className="flex-1 font-semibold">{step.title}</span>
              {step.required ? <span className="text-[0.7rem] text-muted-foreground">Required</span> : null}
            </button>
            {open === step.key ? (
              <div className="space-y-3 border-t px-4 py-4">
                {step.description ? <p className="text-sm text-muted-foreground">{step.description}</p> : null}
                <StepBody
                  step={step}
                  name={name}
                  phone={phone}
                  role={role}
                  onSave={(value) =>
                    start(async () => {
                      toastResult(await saveOnboardingStep(step.key, value));
                      router.refresh();
                    })
                  }
                />
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full bg-gold text-navy hover:bg-gold-dark"
        disabled={pending || doneCount < steps.filter((s) => s.required).length}
        onClick={() =>
          start(async () => {
            const res = await completeOnboarding();
            toastResult(res, "You're in");
            if (res.ok) router.push(role === "tutor" ? "/tutor" : "/portal");
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : null}
        Finish onboarding
      </Button>
    </div>
  );
}

function StepBody({
  step,
  name,
  phone,
  role,
  onSave,
}: {
  step: Step;
  name: string;
  phone: string;
  role: string;
  onSave: (value: unknown) => void;
}) {
  if (step.type === "acknowledge") {
    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap text-sm">{step.body}</p>
        <Button onClick={() => onSave({ acknowledged: true })}>I agree</Button>
      </div>
    );
  }
  if (step.type === "choice") {
    return (
      <ChoiceCards
        columns={2}
        options={(step.options ?? []).map((o) => ({ value: o, label: o }))}
        value={typeof step.value === "string" ? step.value : ""}
        onChange={(v) => onSave(v)}
      />
    );
  }
  if (step.type === "text") {
    return (
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(String(new FormData(e.currentTarget).get("text") || ""));
        }}
      >
        <Textarea name="text" rows={4} defaultValue={typeof step.value === "string" ? step.value : ""} />
        <Button type="submit">Save</Button>
      </form>
    );
  }
  if (step.type === "availability") {
    if (role === "tutor") {
      const slots = Array.isArray(step.value) ? (step.value as Array<{ day: number; start: string; end: string }>) : [];
      return <AvailabilityEditor slots={slots} />;
    }
    return (
      <AvailabilityGrid
        value={Array.isArray(step.value) ? (step.value as Array<{ day: number; block: string }>) : []}
        onChange={(v) => onSave(v)}
      />
    );
  }
  if (step.type === "profile") {
    return (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSave({
            name: String(fd.get("name") || name),
            phone: String(fd.get("phone") || phone),
            headline: String(fd.get("headline") || ""),
            bio: String(fd.get("bio") || ""),
          });
        }}
      >
        <Input name="name" defaultValue={name} placeholder="Full name" />
        <Input name="phone" defaultValue={phone} placeholder="Phone" />
        {role === "tutor" ? (
          <>
            <Input name="headline" placeholder="Headline" />
            <Textarea name="bio" rows={3} placeholder="Short bio" />
          </>
        ) : null}
        <Button type="submit">Save</Button>
      </form>
    );
  }
  return null;
}
