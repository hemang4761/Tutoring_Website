"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { submitLead } from "@/actions/intake";
import { TUTORING_REQUESTS } from "@/lib/constants";
import { firstName } from "@/lib/format";
import { leadSchema, type LeadData, type LeadInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type StepId =
  | "name"
  | "who"
  | "grade"
  | "service"
  | "request"
  | "courses"
  | "hours"
  | "comments"
  | "also"
  | "career"
  | "academics"
  | "activities"
  | "colleges"
  | "goals"
  | "contact";

type Field = FieldPath<LeadInput>;

const FIELDS: Record<StepId, Field[]> = {
  name: ["name"],
  who: ["respondent"],
  grade: ["grade"],
  service: ["service"],
  request: ["tutoringRequest"],
  courses: ["courses"],
  hours: ["hoursPerWeek"],
  comments: ["comments"],
  also: ["alsoConsulting"],
  career: ["careerInterests"],
  academics: ["academics"],
  activities: ["extracurriculars"],
  colleges: ["collegeList"],
  goals: ["consultingGoals"],
  contact: ["email", "phone"],
};

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const HOURS = ["1", "2", "3", "4+"];

function stepsFor(service: string, also: string): StepId[] {
  const head: StepId[] = ["name", "who", "grade", "service"];
  const tutoring: StepId[] = ["request", "courses", "hours", "comments", "also"];
  const college: StepId[] = ["career", "academics", "activities", "colleges", "goals"];
  if (service === "college") return [...head, ...college, "contact"];
  if (service === "tutoring") return [...head, ...tutoring, ...(also === "yes" ? college : []), "contact"];
  return [...head, "contact"];
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const inputClass =
  "w-full border-0 border-b-2 border-navy/20 bg-transparent px-0 py-3 text-2xl text-navy placeholder:text-navy/30 focus:border-gold focus:outline-none focus:ring-0 sm:text-3xl";

function Choice({ label, hint, selected, onClick }: { label: string; hint?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl border-2 bg-white px-5 py-4 text-left transition-colors",
        selected ? "border-navy bg-navy text-white" : "border-navy/10 text-navy hover:border-navy/40",
      )}
    >
      <span>
        <span className="block text-lg font-semibold">{label}</span>
        {hint ? <span className={cn("block text-sm", selected ? "text-white/70" : "text-navy/60")}>{hint}</span> : null}
      </span>
      {selected ? <Check className="size-5 shrink-0 text-gold" /> : null}
    </button>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState<StepId>("name");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const advancing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<LeadInput, unknown, LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      grade: "",
      phone: "",
      respondent: "",
      service: "",
      tutoringRequest: "",
      courses: "",
      hoursPerWeek: "",
      comments: "",
      alsoConsulting: "",
      careerInterests: "",
      academics: "",
      extracurriculars: "",
      collegeList: "",
      consultingGoals: "",
      website: "",
    },
  });
  const { register, formState, getValues, setValue, setError, clearErrors, handleSubmit, watch } = form;
  const errors = formState.errors;

  const list = () => stepsFor(getValues("service"), getValues("alsoConsulting") ?? "");
  const steps = stepsFor(watch("service"), watch("alsoConsulting") ?? "");
  const index = Math.max(0, steps.indexOf(step));
  const last = index === steps.length - 1;
  const parent = watch("respondent") === "parent";

  const validate = (id: StepId) => {
    const parsed = leadSchema.safeParse(getValues());
    let ok = true;
    for (const field of FIELDS[id]) {
      const issue = parsed.success ? undefined : parsed.error.issues.find((item) => item.path[0] === field);
      if (issue) {
        setError(field, { message: issue.message });
        ok = false;
      } else clearErrors(field);
    }
    return ok;
  };

  const submit = handleSubmit(
    (data) =>
      startTransition(async () => {
        const res = await submitLead(data);
        if (res.ok) setDone(true);
        else toast.error(res.error);
      }),
    () => {
      const bad = list().find((id) => FIELDS[id].some((f) => errors[f as keyof typeof errors]));
      if (bad) setStep(bad);
    },
  );

  const next = () => {
    if (advancing.current) clearTimeout(advancing.current);
    if (!validate(step)) return;
    const ids = list();
    const at = ids.indexOf(step);
    if (at === ids.length - 1) submit();
    else setStep(ids[at + 1]);
  };

  const back = () => {
    const ids = list();
    const at = ids.indexOf(step);
    if (at > 0) setStep(ids[at - 1]);
  };

  // option taps move on by themselves after a beat
  const choose = (field: Field, value: string) => {
    setValue(field, value as never, { shouldDirty: true });
    clearErrors(field);
    if (advancing.current) clearTimeout(advancing.current);
    advancing.current = setTimeout(next, 220);
  };

  const onAreaKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      next();
    }
  };

  const shell = "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#f9f9f9] text-navy";

  if (done) {
    const name = firstName(getValues("name"));
    const college = getValues("service") === "college" || getValues("alsoConsulting") === "yes";
    return (
      <div className={shell}>
        <div className="m-auto max-w-xl px-6 py-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold text-navy">
            <Check className="size-7" />
          </span>
          <h1 className="mt-8 font-heading text-4xl font-bold">Thanks{name ? `, ${name}` : ""}.</h1>
          <p className="mt-4 text-lg text-navy/70">
            We&apos;ll be in touch within a couple of days
            {college ? ", starting with a free 30 minute consultation" : ""}.
          </p>
          <Link href="/" className="mt-10 inline-block rounded-lg bg-navy px-6 py-3 font-semibold text-white hover:bg-navy-light">
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  const error = (id: Field) => {
    const message = errors[id as keyof typeof errors]?.message;
    return message ? <p className="mt-3 text-sm font-medium text-red-600">{String(message)}</p> : null;
  };

  const title: Record<StepId, string> = {
    name: "What's your name?",
    who: "Are you the student or a parent?",
    grade: parent ? "What grade is your student in?" : "What grade are you in?",
    service: "What can we help with?",
    request: "What kind of tutoring?",
    courses: "Which courses?",
    hours: "About how many hours a week?",
    comments: "Anything else we should know?",
    also: "Interested in college consulting too?",
    career: "What do you want to study or do?",
    academics: "Grades, test scores, notable courses?",
    activities: "What do you do outside of class?",
    colleges: "Any schools in mind?",
    goals: "What do you want out of consulting?",
    contact: "How can we reach you?",
  };
  const optional: StepId[] = ["comments", "academics", "colleges"];

  let body: React.ReactNode = null;
  switch (step) {
    case "name":
      body = <input className={inputClass} placeholder="First and last name" autoComplete="name" autoFocus {...register("name")} />;
      break;
    case "who":
      body = (
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice label="Student" selected={watch("respondent") === "student"} onClick={() => choose("respondent", "student")} />
          <Choice label="Parent or guardian" selected={watch("respondent") === "parent"} onClick={() => choose("respondent", "parent")} />
        </div>
      );
      break;
    case "grade":
      body = (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => choose("grade", g)}
              className={cn(
                "rounded-xl border-2 py-4 text-lg font-semibold transition-colors",
                watch("grade") === g ? "border-navy bg-navy text-white" : "border-navy/10 bg-white hover:border-navy/40",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      );
      break;
    case "service":
      body = (
        <div className="grid gap-3">
          <Choice
            label="Academic tutoring"
            hint="Elementary through high school, and test prep"
            selected={watch("service") === "tutoring"}
            onClick={() => choose("service", "tutoring")}
          />
          <Choice
            label="College consulting"
            hint="Essays, college lists, applications"
            selected={watch("service") === "college"}
            onClick={() => choose("service", "college")}
          />
        </div>
      );
      break;
    case "request":
      body = (
        <div className="grid gap-3 sm:grid-cols-2">
          {TUTORING_REQUESTS.map((option) => (
            <Choice key={option} label={option} selected={watch("tutoringRequest") === option} onClick={() => choose("tutoringRequest", option)} />
          ))}
        </div>
      );
      break;
    case "courses":
      body = <input className={inputClass} placeholder="AP Calculus AB, Honors Chemistry" autoFocus {...register("courses")} />;
      break;
    case "hours":
      body = (
        <div className="grid grid-cols-4 gap-3">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => choose("hoursPerWeek", h)}
              className={cn(
                "rounded-xl border-2 py-5 text-xl font-semibold transition-colors",
                watch("hoursPerWeek") === h ? "border-navy bg-navy text-white" : "border-navy/10 bg-white hover:border-navy/40",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      );
      break;
    case "also":
      body = (
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice label="Yes" selected={watch("alsoConsulting") === "yes"} onClick={() => choose("alsoConsulting", "yes")} />
          <Choice label="No, just tutoring" selected={watch("alsoConsulting") === "no"} onClick={() => choose("alsoConsulting", "no")} />
        </div>
      );
      break;
    case "contact":
      body = (
        <div className="space-y-6">
          <input className={inputClass} type="email" placeholder="Email" autoComplete="email" autoFocus {...register("email")} />
          {error("email")}
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            placeholder="Phone  XXX-XXX-XXXX"
            autoComplete="tel"
            maxLength={12}
            value={watch("phone")}
            onChange={(e) => setValue("phone", formatPhone(e.target.value))}
          />
        </div>
      );
      break;
    default: {
      const field: Record<string, Field> = {
        comments: "comments",
        career: "careerInterests",
        academics: "academics",
        activities: "extracurriculars",
        colleges: "collegeList",
        goals: "consultingGoals",
      };
      body = (
        <>
          <textarea
            rows={4}
            autoFocus
            onKeyDown={onAreaKey}
            className={cn(inputClass, "resize-none text-xl sm:text-2xl")}
            placeholder="Type your answer"
            {...register(field[step])}
          />
          <p className="mt-2 hidden text-xs text-navy/50 sm:block">Ctrl + Enter to continue</p>
        </>
      );
    }
  }

  return (
    <div className={shell}>
      <div className="h-1 shrink-0 bg-navy/10">
        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${Math.max(4, (index / (steps.length - 1)) * 100)}%` }} />
      </div>
      <header className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="font-heading text-xl font-bold">
          BCLearns
        </Link>
        <Link href="/" aria-label="Close" className="rounded-full p-2 text-navy/50 hover:bg-navy/5 hover:text-navy">
          <X className="size-5" />
        </Link>
      </header>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 pb-24"
      >
        <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          {optional.includes(step) ? <p className="mb-3 text-sm font-semibold text-navy/40">Optional</p> : null}
          <h1 className="mb-8 font-heading text-3xl leading-tight font-bold sm:text-4xl">{title[step]}</h1>
          {body}
          {step !== "contact" ? error(FIELDS[step][0]) : error("phone")}
        </div>
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />

        <div className="mt-10 flex items-center gap-3">
          {index > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-navy/60 hover:bg-navy/5 hover:text-navy"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-7 py-3 font-semibold text-white transition-colors hover:bg-navy-light disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {last ? "Send" : optional.includes(step) ? "Continue" : "OK"}
            {!last && !pending ? <ArrowRight className="size-4" /> : null}
          </button>
          <span className="ml-1 hidden text-xs text-navy/40 sm:inline">or press Enter</span>
        </div>
      </form>
    </div>
  );
}
