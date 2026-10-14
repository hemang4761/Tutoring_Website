"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveAvailability } from "@/actions/sessions";
import { toastResult } from "@/lib/toast";
import { DAYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Slot = { day: number; start: string; end: string };

export function AvailabilityEditor({ slots }: { slots: Slot[] }) {
  const [value, setValue] = useState<Slot[]>(slots.length ? slots : [{ day: 1, start: "15:30", end: "19:00" }]);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => toastResult(await saveAvailability(value)));
      }}
    >
      {value.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={s.day}
            onChange={(e) => setValue((v) => v.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))}
          >
            {DAYS.map((d, idx) => (
              <option key={d} value={idx}>
                {d}
              </option>
            ))}
          </select>
          <Input type="time" className="w-32" value={s.start} onChange={(e) => setValue((v) => v.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
          <Input type="time" className="w-32" value={s.end} onChange={(e) => setValue((v) => v.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
          <Button type="button" size="icon" variant="ghost" onClick={() => setValue((v) => v.filter((_, j) => j !== i))}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setValue((v) => [...v, { day: 1, start: "16:00", end: "18:00" }])}>
          <Plus /> Add window
        </Button>
        <Button type="submit" disabled={pending}>
          Save availability
        </Button>
      </div>
    </form>
  );
}
