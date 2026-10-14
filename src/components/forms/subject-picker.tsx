"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATALOG } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function SubjectPicker({
  value,
  onChange,
  placeholder = "Search subjects or courses",
  invalid,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const tokens = q.split(/\s+/).filter(Boolean);
    return CATALOG.map((g) => ({
      ...g,
      courses: g.courses.filter((c) => tokens.every((t) => c.search.includes(t))),
    })).filter((g) => g.courses.length);
  }, [q]);

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name]);

  const exactMatch = groups.some((g) => g.courses.some((c) => c.name.toLowerCase() === q));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-invalid={invalid || undefined}
            className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
          >
            <Search className="size-4" />
            <span className="flex-1">{value.length ? `${value.length} selected · add more` : placeholder}</span>
            <Plus className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0">
          <div className="border-b p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search (e.g. calc, SAT, chem)"
              className="h-9 w-full rounded-md bg-muted/60 px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {groups.map((g) => (
              <div key={g.key} className="py-1">
                <p className="px-2 py-1 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">{g.label}</p>
                {g.courses.map((c) => {
                  const selected = value.includes(c.name);
                  return (
                    <button
                      type="button"
                      key={c.name}
                      onClick={() => toggle(c.name)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                        selected && "font-medium",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                        )}
                      >
                        {selected ? <Check className="size-3" /> : null}
                      </span>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            ))}
            {q && !exactMatch ? (
              <button
                type="button"
                onClick={() => {
                  const custom = query.trim();
                  if (custom && !value.includes(custom)) onChange([...value, custom]);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-primary hover:bg-accent"
              >
                <Plus className="size-4" /> Add &ldquo;{query.trim()}&rdquo;
              </button>
            ) : null}
            {!groups.length && !q ? <p className="p-3 text-sm text-muted-foreground">No subjects</p> : null}
          </div>
        </PopoverContent>
      </Popover>
      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border bg-secondary py-0.5 pr-1 pl-2.5 text-xs font-medium text-secondary-foreground"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => toggle(v)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
