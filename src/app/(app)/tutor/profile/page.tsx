"use client";

import { useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/forms/field";
import { SubjectPicker } from "@/components/forms/subject-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateTutorProfile } from "@/actions/tutors";
import { toastResult } from "@/lib/toast";

export default function TutorProfilePage() {
  const [data, setData] = useState<{
    userId: string;
    name: string;
    phone: string;
    headline: string;
    bio: string;
    subjects: string[];
  } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <>
      <PageHeader title="Your profile" description="Families see this after they're matched with you." />
      <form
        className="max-w-xl space-y-4 rounded-xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => toastResult(await updateTutorProfile(data.userId, data)));
        }}
      >
        <Field label="Headline">
          <Input value={data.headline} onChange={(e) => setData({ ...data, headline: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
        </Field>
        <Field label="Bio">
          <Textarea rows={5} value={data.bio} onChange={(e) => setData({ ...data, bio: e.target.value })} />
        </Field>
        <Field label="Subjects">
          <SubjectPicker value={data.subjects} onChange={(subjects) => setData({ ...data, subjects })} />
        </Field>
        <Button type="submit" disabled={pending}>
          Save profile
        </Button>
      </form>
    </>
  );
}
