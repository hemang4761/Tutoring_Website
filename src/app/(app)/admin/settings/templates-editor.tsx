"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveTemplates } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/panel";
import { toastResult } from "@/lib/toast";

const TOKENS = ["{parent_first}", "{student_first}", "{tutor_first}", "{admin_first}"];

export function TemplatesEditor({ initial }: { initial: Array<{ label: string; body: string }> }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<{ label: string; body: string }>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  return (
    <Panel
      title="Text templates"
      description={`Drafts for the Text button. You always edit before sending. Fill-ins: ${TOKENS.join(" ")}`}
    >
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
            <Input value={row.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Name" />
            <Textarea rows={2} value={row.body} onChange={(e) => set(i, { body: e.target.value })} placeholder="Message" />
            <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { label: "", body: "" }])}>
            <Plus /> Add template
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => start(async () => toastResult(await saveTemplates(rows.filter((r) => r.label.trim() && r.body.trim()))))}
          >
            Save templates
          </Button>
        </div>
      </div>
    </Panel>
  );
}
