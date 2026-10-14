"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createManualLead } from "@/actions/leads";
import { toastResult } from "@/lib/toast";
import { GRADES, LEAD_SOURCES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/forms/field";
import { SubjectPicker } from "@/components/forms/subject-picker";

export function NewLeadDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [source, setSource] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a lead</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createManualLead({
                parentName: String(fd.get("parentName") || ""),
                parentEmail: String(fd.get("parentEmail") || ""),
                parentPhone: String(fd.get("parentPhone") || ""),
                studentName: String(fd.get("studentName") || ""),
                grade,
                subjects,
                source,
                notes: String(fd.get("notes") || ""),
              });
              toastResult(res, "Lead created");
              if (res.ok && res.data) {
                setOpen(false);
                router.push(`/admin/leads/${res.data}`);
              }
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent name" htmlFor="parentName" className="sm:col-span-2">
              <Input id="parentName" name="parentName" required />
            </Field>
            <Field label="Email" htmlFor="parentEmail">
              <Input id="parentEmail" name="parentEmail" type="email" required />
            </Field>
            <Field label="Phone" htmlFor="parentPhone">
              <Input id="parentPhone" name="parentPhone" />
            </Field>
            <Field label="Student name" htmlFor="studentName">
              <Input id="studentName" name="studentName" required />
            </Field>
            <Field label="Grade">
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Subjects">
            <SubjectPicker value={subjects} onChange={setSubjects} />
          </Field>
          <Field label="Source" optional>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="How they found us" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes" htmlFor="notes" optional>
            <Textarea id="notes" name="notes" rows={3} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Create lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
