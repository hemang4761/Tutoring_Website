"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; description?: string; icon?: React.ReactNode };

function Card({ option, selected, onClick, multi }: { option: Option; selected: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary dark:bg-primary/10"
          : "hover:border-primary/40 hover:bg-secondary/60",
      )}
    >
      {option.icon ? (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
          )}
        >
          {option.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{option.label}</span>
        {option.description ? <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span> : null}
      </span>
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {selected ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  );
}

export function ChoiceCards({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  return (
    <div role="radiogroup" className={cn("grid gap-3", gridCols(columns))}>
      {options.map((o) => (
        <Card key={o.value} option={o} selected={value === o.value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  );
}

export function MultiChoiceCards({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  return (
    <div className={cn("grid gap-3", gridCols(columns))}>
      {options.map((o) => (
        <Card
          key={o.value}
          multi
          option={o}
          selected={value.includes(o.value)}
          onClick={() => onChange(value.includes(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value])}
        />
      ))}
    </div>
  );
}

function gridCols(n: number) {
  return n === 1 ? "grid-cols-1" : n === 2 ? "sm:grid-cols-2" : n === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
}

// small pill toggles for short option lists
export function PillChoice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(value === o ? "" : o)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === o ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40 hover:bg-secondary",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
