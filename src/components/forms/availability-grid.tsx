"use client";

import { Check } from "lucide-react";
import { DAYS, TIME_BLOCKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type BlockSlot = { day: number; block: string };

// day x time-block toggle grid used for family availability
export function AvailabilityGrid({ value, onChange }: { value: BlockSlot[]; onChange: (v: BlockSlot[]) => void }) {
  const has = (day: number, block: string) => value.some((v) => v.day === day && v.block === block);
  const toggle = (day: number, block: string) =>
    onChange(has(day, block) ? value.filter((v) => !(v.day === day && v.block === block)) : [...value, { day, block }]);

  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[520px] grid-cols-[110px_repeat(7,1fr)] gap-1.5">
        <div />
        {order.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-semibold text-muted-foreground">
            {DAYS[d]}
          </div>
        ))}
        {TIME_BLOCKS.map((b) => (
          <div key={b.key} className="contents">
            <div className="flex flex-col justify-center pr-2">
              <span className="text-sm font-medium">{b.label}</span>
              <span className="text-[0.7rem] text-muted-foreground">{b.hint}</span>
            </div>
            {order.map((d) => {
              const on = has(d, b.key);
              return (
                <button
                  type="button"
                  key={d}
                  aria-pressed={on}
                  aria-label={`${DAYS[d]} ${b.label}`}
                  onClick={() => toggle(d, b.key)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-sm transition-all",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-dashed border-input hover:border-primary/50 hover:bg-secondary",
                  )}
                >
                  {on ? <Check className="size-4" /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
