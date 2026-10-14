"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitApplication } from "@/actions/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/field";
import { SubjectPicker } from "@/components/forms/subject-picker";
import { MultiChoiceCards, PillChoice } from "@/components/forms/choice-cards";
import { applicationSchema, type ApplicationInput } from "@/lib/validation";

type Output = z.output<typeof applicationSchema>;

const GRADE_BANDS = [
  { value: "K-5", label: "Elementary", description: "Grades K–5" },
  { value: "6-8", label: "Middle school", description: "Grades 6–8" },
  { value: "9-10", label: "Underclassmen", description: "Grades 9–10" },
  { value: "11-12", label: "Upperclassmen", description: "Grades 11–12, AP/IB" },
];

const year = new Date().getFullYear();
const GRAD_YEARS = [0, 1, 2, 3, 4].map((n) => String(year + n));

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border-b px-6 py-7 last:border-0 sm:px-8">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ApplicationForm() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState } = useForm<ApplicationInput, unknown, Output>({
    resolver: zodResolver(applicationSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      school: "Bergen County Academies",
      gradYear: "",
      subjects: [],
      gradeLevels: [],
      satScore: "",
      apScores: "",
      experience: "",
      hoursPerWeek: "",
      availability: "",
      whyJoin: "",
      website: "",
    },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit((data) =>
    startTransition(async () => {
      const res = await submitApplication(data);
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else toast.error(res.error);
    }),
  );

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-xl">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold">Application received!</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Thanks for applying. An admin will review your application, and if approved you&apos;ll get an email invite to
          set up your tutor account.
        </p>
        <Button asChild variant="outline" className="mt-8">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the public site is a separate root layout */}
          <a href="/">Back to the website</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="overflow-hidden rounded-2xl border bg-card shadow-xl">
      <Section title="About you">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={e.name?.message} className="sm:col-span-2">
            <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!e.name} />
          </Field>
          <Field label="Email" htmlFor="email" error={e.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!e.email} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={e.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!e.phone} />
          </Field>
          <Field label="School" htmlFor="school" error={e.school?.message}>
            <Input id="school" {...register("school")} aria-invalid={!!e.school} />
          </Field>
          <Field label="Graduation year" error={e.gradYear?.message}>
            <Controller
              control={control}
              name="gradYear"
              render={({ field }) => <PillChoice options={GRAD_YEARS} value={field.value} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </Section>

      <Section title="What you can teach" description="Pick every course you'd be comfortable tutoring.">
        <Field label="Subjects and courses" error={e.subjects?.message}>
          <Controller
            control={control}
            name="subjects"
            render={({ field }) => <SubjectPicker value={field.value} onChange={field.onChange} invalid={!!e.subjects} />}
          />
        </Field>
        <Field label="Grade levels" error={e.gradeLevels?.message}>
          <Controller
            control={control}
            name="gradeLevels"
            render={({ field }) => <MultiChoiceCards options={GRADE_BANDS} value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <Field label="SAT score" htmlFor="sat" optional>
            <Input id="sat" inputMode="numeric" placeholder="e.g. 1540" {...register("satScore")} />
          </Field>
          <Field label="AP / IB scores" htmlFor="ap" optional>
            <Input id="ap" placeholder="e.g. Calc BC 5, Chem 5, Physics C 5" {...register("apScores")} />
          </Field>
        </div>
      </Section>

      <Section title="Experience and availability">
        <Field label="Tutoring or teaching experience" htmlFor="exp" error={e.experience?.message}>
          <Textarea id="exp" rows={4} {...register("experience")} aria-invalid={!!e.experience} placeholder="NHS tutoring, peer tutoring, camps, clubs you've led..." />
        </Field>
        <Field label="Hours per week you can tutor" error={e.hoursPerWeek?.message}>
          <Controller
            control={control}
            name="hoursPerWeek"
            render={({ field }) => <PillChoice options={["1–2", "3–4", "5–7", "8+"]} value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field label="General availability" htmlFor="avail" optional>
          <Textarea id="avail" rows={2} {...register("availability")} placeholder="e.g. Weekdays after 4pm, Sunday afternoons" />
        </Field>
        <Field label="Why do you want to tutor with BCLearns?" htmlFor="why" optional>
          <Textarea id="why" rows={3} {...register("whyJoin")} />
        </Field>
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />
      </Section>

      <div className="flex items-center justify-between gap-4 bg-muted/30 px-6 py-4 sm:px-8">
        <p className="text-xs text-muted-foreground">We&apos;ll email you once an admin reviews your application.</p>
        <Button type="submit" size="lg" disabled={pending} className="bg-gold px-5 text-navy hover:bg-gold-dark">
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          Submit application
        </Button>
      </div>
    </form>
  );
}
