"use client";

import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Loader2,
  MapPin,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { submitLead } from "@/actions/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { SubjectPicker } from "@/components/forms/subject-picker";
import { AvailabilityGrid } from "@/components/forms/availability-grid";
import { ChoiceCards, MultiChoiceCards, PillChoice } from "@/components/forms/choice-cards";
import { GRADES, LEAD_SOURCES } from "@/lib/constants";
import { leadSchema, type LeadInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type LeadOutput = z.output<typeof leadSchema>;

const STEPS: Array<{ title: string; blurb: string; fields: FieldPath<LeadInput>[] }> = [
  { title: "About you", blurb: "Who should we contact?", fields: ["parent"] },
  { title: "Your student", blurb: "Who are we tutoring?", fields: ["students"] },
  { title: "Goals", blurb: "What are you looking for?", fields: ["services", "goals", "format", "location"] },
  { title: "Schedule", blurb: "When works best?", fields: ["availability", "sessionsPerWeek", "startTiming"] },
  { title: "Finish", blurb: "Almost done", fields: ["source", "referral", "message"] },
];

const SERVICES = [
  { value: "Academic tutoring", label: "Academic tutoring", description: "Homework help, class support, and exam review", icon: <BookOpen className="size-4" /> },
  { value: "Test prep", label: "Test prep", description: "SAT, ACT, AP, IB, and BCA entrance exams", icon: <Target className="size-4" /> },
  { value: "College consulting", label: "College consulting", description: "Essays, applications, and strategy", icon: <GraduationCap className="size-4" /> },
  { value: "Specialized mentorship", label: "Specialized mentorship", description: "Competition math and engineering", icon: <Sparkles className="size-4" /> },
];

const FORMAT_OPTIONS = [
  { value: "online", label: "Online", description: "Video sessions from home", icon: <Laptop className="size-4" /> },
  { value: "in_person", label: "In person", description: "Library or your home", icon: <MapPin className="size-4" /> },
  { value: "either", label: "Either works", description: "We'll pick what fits best", icon: <Repeat className="size-4" /> },
];

const emptyStudent = { name: "", grade: "", school: "", subjects: [] as string[] };

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LeadInput, unknown, LeadOutput>({
    resolver: zodResolver(leadSchema),
    mode: "onTouched",
    defaultValues: {
      parent: { name: "", email: "", phone: "", preferredContact: "email" },
      students: [emptyStudent],
      services: [],
      goals: "",
      format: "either",
      location: "",
      availability: [],
      availabilityNotes: "",
      sessionsPerWeek: "",
      startTiming: "",
      source: "",
      referral: "",
      message: "",
      website: "",
    },
  });
  const { register, control, formState, trigger, handleSubmit, watch } = form;
  const errors = formState.errors;
  const students = useFieldArray({ control, name: "students" });

  const next = async () => {
    const valid = await trigger(STEPS[step].fields, { shouldFocus: true });
    if (valid) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = handleSubmit((data) =>
    startTransition(async () => {
      const res = await submitLead(data);
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else toast.error(res.error);
    }),
  );

  if (done) {
    const parent = watch("parent.name").split(" ")[0];
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-xl sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold">You&apos;re all set{parent ? `, ${parent}` : ""}!</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          We&apos;ve received your information and sent a confirmation to your email. A member of our team will reach out
          within 24–48 hours to match you with a tutor.
        </p>
        <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
          {["We review your request", "We match a tutor", "You get portal access"].map((t, i) => (
            <div key={t} className="rounded-xl bg-secondary p-3">
              <p className="font-heading text-sm font-bold text-primary">Step {i + 1}</p>
              <p className="text-xs text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-8">
          <a href="/">Back to the website</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="overflow-hidden rounded-2xl border bg-card shadow-xl">
      <ol className="flex border-b bg-muted/40">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex-1">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex w-full flex-col items-center gap-1 px-1 py-3 text-xs font-medium transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:text-sm",
                i === step ? "text-foreground" : i < step ? "text-primary hover:bg-secondary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-gold text-navy"
                      : "border bg-background text-muted-foreground",
                )}
              >
                {i < step ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="h-1 bg-muted">
        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-bold">{STEPS[step].blurb}</h2>
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Parent or guardian name" htmlFor="pname" error={errors.parent?.name?.message} className="sm:col-span-2">
              <Input id="pname" autoComplete="name" {...register("parent.name")} aria-invalid={!!errors.parent?.name} />
            </Field>
            <Field label="Email" htmlFor="pemail" error={errors.parent?.email?.message}>
              <Input id="pemail" type="email" autoComplete="email" {...register("parent.email")} aria-invalid={!!errors.parent?.email} />
            </Field>
            <Field label="Phone" htmlFor="pphone" error={errors.parent?.phone?.message}>
              <Input id="pphone" type="tel" autoComplete="tel" {...register("parent.phone")} aria-invalid={!!errors.parent?.phone} />
            </Field>
            <Field label="Best way to reach you" className="sm:col-span-2">
              <Controller
                control={control}
                name="parent.preferredContact"
                render={({ field }) => (
                  <PillChoice
                    options={["Email", "Phone", "Text"]}
                    value={field.value ? field.value[0].toUpperCase() + field.value.slice(1) : ""}
                    onChange={(v) => field.onChange((v || "Email").toLowerCase())}
                  />
                )}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {students.fields.map((f, i) => (
              <div key={f.id} className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-primary" /> Student {i + 1}
                  </p>
                  {students.fields.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => students.remove(i)}>
                      <Trash2 /> Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <Field label="Student name" htmlFor={`sname${i}`} error={errors.students?.[i]?.name?.message}>
                    <Input id={`sname${i}`} {...register(`students.${i}.name`)} aria-invalid={!!errors.students?.[i]?.name} />
                  </Field>
                  <Field label="Grade" error={errors.students?.[i]?.grade?.message}>
                    <Controller
                      control={control}
                      name={`students.${i}.grade`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.students?.[i]?.grade}>
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g === "K" || g === "College" ? g : `Grade ${g}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
                <Field label="School" htmlFor={`sschool${i}`} optional>
                  <Input id={`sschool${i}`} {...register(`students.${i}.school`)} />
                </Field>
                <Field label="Subjects or courses" error={errors.students?.[i]?.subjects?.message} hint="Pick everything you'd like help with.">
                  <Controller
                    control={control}
                    name={`students.${i}.subjects`}
                    render={({ field }) => (
                      <SubjectPicker value={field.value} onChange={field.onChange} invalid={!!errors.students?.[i]?.subjects} />
                    )}
                  />
                </Field>
              </div>
            ))}
            {students.fields.length < 5 ? (
              <Button type="button" variant="outline" onClick={() => students.append(emptyStudent)}>
                <Plus /> Add another student
              </Button>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Field label="What kind of help are you looking for?" error={errors.services?.message}>
              <Controller
                control={control}
                name="services"
                render={({ field }) => <MultiChoiceCards options={SERVICES} value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Goals" htmlFor="goals" optional hint="E.g. raise a grade, a target SAT score, an upcoming exam date.">
              <Textarea id="goals" rows={3} {...register("goals")} placeholder="What would success look like?" />
            </Field>
            <Field label="Session format">
              <Controller
                control={control}
                name="format"
                render={({ field }) => <ChoiceCards columns={3} options={FORMAT_OPTIONS} value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Town" htmlFor="location" optional hint="Helps us match in-person tutors nearby.">
              <Input id="location" {...register("location")} placeholder="e.g. Hackensack" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Field label="When is your student usually free?" hint="Tap every time that usually works. Rough is fine.">
              <Controller
                control={control}
                name="availability"
                render={({ field }) => <AvailabilityGrid value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Sessions per week">
                <Controller
                  control={control}
                  name="sessionsPerWeek"
                  render={({ field }) => (
                    <PillChoice options={["1", "2", "3+", "Not sure"]} value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              </Field>
              <Field label="When would you like to start?">
                <Controller
                  control={control}
                  name="startTiming"
                  render={({ field }) => (
                    <PillChoice options={["ASAP", "Within 2 weeks", "Next month", "Just exploring"]} value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
              </Field>
            </div>
            <Field label="Scheduling notes" htmlFor="anotes" optional>
              <Textarea id="anotes" rows={2} {...register("availabilityNotes")} placeholder="e.g. Fridays after 6pm only during soccer season" />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="How did you hear about us?" optional>
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Choose one" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Referred by" htmlFor="referral" optional>
                <Input id="referral" {...register("referral")} placeholder="Name of who referred you" />
              </Field>
            </div>
            <Field label="Anything else we should know?" htmlFor="message" optional>
              <Textarea id="message" rows={4} {...register("message")} placeholder="Learning style, accommodations, questions for us..." />
            </Field>
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />
            <Summary values={watch()} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4 sm:px-8">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || pending}>
          <ArrowLeft /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" size="lg" onClick={next} className="px-5">
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={pending} className="bg-gold px-5 text-navy hover:bg-gold-dark">
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Submit
          </Button>
        )}
      </div>
    </form>
  );
}

function Summary({ values }: { values: LeadInput }) {
  const rows: Array<[string, string]> = [
    ["Contact", `${values.parent.name} · ${values.parent.email}`],
    ["Students", values.students.map((s) => `${s.name || "Student"} (${s.grade || "?"})`).join(", ")],
    ["Subjects", [...new Set(values.students.flatMap((s) => s.subjects))].join(", ") || "—"],
    ["Looking for", values.services.join(", ") || "—"],
    ["Availability", values.availability.length ? `${values.availability.length} time windows` : values.availabilityNotes || "Flexible"],
  ];
  return (
    <div className="rounded-xl border bg-secondary/50 p-4">
      <p className="mb-2 text-sm font-semibold">Review</p>
      <dl className="grid gap-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
