"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { saveSiteContent } from "@/actions/site";
import { Field } from "@/components/forms/field";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastResult } from "@/lib/toast";
import { PRICE_HEADERS, SLIDE_THEMES, type SiteContent } from "@/lib/site";
import { cn } from "@/lib/utils";

function move<T>(list: T[], index: number, dir: -1 | 1) {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}

function RowTools({
  index,
  total,
  onUp,
  onDown,
  onRemove,
}: {
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" size="icon" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={onUp}>
        <ChevronUp />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Move down" disabled={index === total - 1} onClick={onDown}>
        <ChevronDown />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

export function WebsiteForm({ initial }: { initial: SiteContent }) {
  const [pending, start] = useTransition();
  const [s, setS] = useState(initial);
  const set = (patch: Partial<SiteContent>) => setS((prev) => ({ ...prev, ...patch }));

  const save = () => {
    const payload: SiteContent = {
      ...s,
      stats: s.stats
        .map((row) => ({ value: row.value.trim(), label: row.label.trim() }))
        .filter((row) => row.value || row.label),
      tutors: s.tutors
        .map((row) => ({ name: row.name.trim(), role: row.role.trim(), bio: row.bio.trim(), photo: row.photo.trim() }))
        .filter((row) => row.name),
      ticker: s.ticker
        .map((row) =>
          row
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .join(", "),
        )
        .filter(Boolean),
      catalog: s.catalog
        .map((group) => ({
          label: group.label.trim(),
          courses: group.courses.map((course) => course.trim()).filter(Boolean),
        }))
        .filter((group) => group.label),
      pricing: s.pricing
        .map((card) => ({
          ...card,
          title: card.title.trim(),
          subtitle: card.subtitle.trim(),
          price: Number(card.price) || 0,
          features: card.features.map((feature) => feature.trim()).filter(Boolean),
        }))
        .filter((card) => card.title),
      mentorship: s.mentorship
        .map((slide) => ({ ...slide, title: slide.title.trim(), body: slide.body.trim() }))
        .filter((slide) => slide.title),
      collegeNote: s.collegeNote.trim(),
      heroBrand: s.heroBrand.trim(),
      heroTitle: s.heroTitle.trim(),
      heroSubtitle: s.heroSubtitle.trim(),
      tutoringBlurb: s.tutoringBlurb.trim(),
      testPrepBlurb: s.testPrepBlurb.trim(),
      aboutBlurb: s.aboutBlurb.trim(),
      catalogSubtitle: s.catalogSubtitle.trim(),
    };
    start(async () => toastResult(await saveSiteContent(payload)));
  };

  return (
    <form
      className="space-y-6 pb-8"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Panel title="Stats" description="The three numbers under the homepage hero. Leave a row blank to remove it.">
        <div className="space-y-3">
          {s.stats.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
              <Input
                value={row.value}
                aria-label="Stat number"
                placeholder="1500+"
                onChange={(e) => set({ stats: s.stats.map((item, j) => (j === i ? { ...item, value: e.target.value } : item)) })}
              />
              <Input
                value={row.label}
                aria-label="Stat label"
                placeholder="What this number means"
                onChange={(e) => set({ stats: s.stats.map((item, j) => (j === i ? { ...item, label: e.target.value } : item)) })}
              />
              <RowTools
                index={i}
                total={s.stats.length}
                onUp={() => set({ stats: move(s.stats, i, -1) })}
                onDown={() => set({ stats: move(s.stats, i, 1) })}
                onRemove={() => set({ stats: s.stats.filter((_, j) => j !== i) })}
              />
            </div>
          ))}
          {s.stats.length < 8 ? (
            <Button type="button" variant="outline" onClick={() => set({ stats: [...s.stats, { value: "", label: "" }] })}>
              <Plus /> Add stat
            </Button>
          ) : null}
        </div>
      </Panel>

      <Panel
        title="Tutor cards"
        description="These are the people on Meet the Team. Turn custom cards off to use tutors marked Show on the public site."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Custom cards</span>
            <Switch checked={s.customTutors} onCheckedChange={(v) => set({ customTutors: v })} />
          </label>
        }
      >
        <fieldset disabled={!s.customTutors} className={cn("space-y-3", !s.customTutors && "opacity-60")}>
          {s.tutors.map((tutor, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {tutor.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tutor.photo} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">Photo</div>
                  )}
                  <p className="text-sm font-semibold">{tutor.name || `Tutor ${i + 1}`}</p>
                </div>
                <RowTools
                  index={i}
                  total={s.tutors.length}
                  onUp={() => set({ tutors: move(s.tutors, i, -1) })}
                  onDown={() => set({ tutors: move(s.tutors, i, 1) })}
                  onRemove={() => set({ tutors: s.tutors.filter((_, j) => j !== i) })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={tutor.name}
                    onChange={(e) => set({ tutors: s.tutors.map((item, j) => (j === i ? { ...item, name: e.target.value } : item)) })}
                  />
                </Field>
                <Field label="Role">
                  <Input
                    value={tutor.role}
                    onChange={(e) => set({ tutors: s.tutors.map((item, j) => (j === i ? { ...item, role: e.target.value } : item)) })}
                  />
                </Field>
                <Field label="Photo URL" className="sm:col-span-2" hint="A full link, or a site path like /media/photo.jpg">
                  <Input
                    value={tutor.photo}
                    onChange={(e) => set({ tutors: s.tutors.map((item, j) => (j === i ? { ...item, photo: e.target.value } : item)) })}
                  />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={tutor.bio}
                    onChange={(e) => set({ tutors: s.tutors.map((item, j) => (j === i ? { ...item, bio: e.target.value } : item)) })}
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => set({ tutors: [...s.tutors, { name: "", role: "", bio: "", photo: "" }] })}
          >
            <Plus /> Add tutor
          </Button>
        </fieldset>
      </Panel>

      <Panel title="Courses" description="The catalog visitors can search, plus the scrolling course names above it.">
        <div className="space-y-4">
          {s.ticker.map((row, i) => (
            <Field key={i} label={`Scrolling row ${i + 1}`} hint="Separate course names with commas.">
              <Textarea
                rows={2}
                value={row}
                onChange={(e) => set({ ticker: s.ticker.map((item, j) => (j === i ? e.target.value : item)) })}
              />
            </Field>
          ))}
          <div className="flex gap-2">
            {s.ticker.length < 5 ? (
              <Button type="button" variant="outline" onClick={() => set({ ticker: [...s.ticker, ""] })}>
                <Plus /> Add row
              </Button>
            ) : null}
            {s.ticker.length > 1 ? (
              <Button type="button" variant="ghost" onClick={() => set({ ticker: s.ticker.slice(0, -1) })}>
                Remove last row
              </Button>
            ) : null}
          </div>
          <div className="space-y-3 border-t pt-4">
            {s.catalog.map((group, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Input
                    value={group.label}
                    aria-label="Subject group"
                    placeholder="Subject"
                    onChange={(e) =>
                      set({ catalog: s.catalog.map((item, j) => (j === i ? { ...item, label: e.target.value } : item)) })
                    }
                  />
                  <RowTools
                    index={i}
                    total={s.catalog.length}
                    onUp={() => set({ catalog: move(s.catalog, i, -1) })}
                    onDown={() => set({ catalog: move(s.catalog, i, 1) })}
                    onRemove={() => set({ catalog: s.catalog.filter((_, j) => j !== i) })}
                  />
                </div>
                <Field label="Courses" hint="One course per line.">
                  <Textarea
                    rows={5}
                    value={group.courses.join("\n")}
                    onChange={(e) =>
                      set({
                        catalog: s.catalog.map((item, j) => (j === i ? { ...item, courses: e.target.value.split("\n") } : item)),
                      })
                    }
                  />
                </Field>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => set({ catalog: [...s.catalog, { label: "", courses: [] }] })}>
              <Plus /> Add subject
            </Button>
          </div>
          <Field label="College consulting note" hint="Shown at the bottom of the catalog.">
            <Textarea rows={3} value={s.collegeNote} onChange={(e) => set({ collegeNote: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Pricing">
        <div className="space-y-3">
          {s.pricing.map((card, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{card.title || `Plan ${i + 1}`}</p>
                <RowTools
                  index={i}
                  total={s.pricing.length}
                  onUp={() => set({ pricing: move(s.pricing, i, -1) })}
                  onDown={() => set({ pricing: move(s.pricing, i, 1) })}
                  onRemove={() => set({ pricing: s.pricing.filter((_, j) => j !== i) })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <Input
                    value={card.title}
                    onChange={(e) => set({ pricing: s.pricing.map((item, j) => (j === i ? { ...item, title: e.target.value } : item)) })}
                  />
                </Field>
                <Field label="Subtitle">
                  <Input
                    value={card.subtitle}
                    onChange={(e) => set({ pricing: s.pricing.map((item, j) => (j === i ? { ...item, subtitle: e.target.value } : item)) })}
                  />
                </Field>
                <Field label="Price per hour">
                  <Input
                    type="number"
                    min={0}
                    value={card.price}
                    onChange={(e) =>
                      set({ pricing: s.pricing.map((item, j) => (j === i ? { ...item, price: Number(e.target.value) } : item)) })
                    }
                  />
                </Field>
                <Field label="Color">
                  <Select
                    value={card.header}
                    onValueChange={(value) =>
                      set({
                        pricing: s.pricing.map((item, j) =>
                          j === i ? { ...item, header: value as SiteContent["pricing"][number]["header"] } : item,
                        ),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_HEADERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Switch
                    checked={card.featured}
                    onCheckedChange={(v) => set({ pricing: s.pricing.map((item, j) => (j === i ? { ...item, featured: v } : item)) })}
                  />
                  Highlight this plan
                </label>
                <Field label="Features" className="sm:col-span-2" hint="One per line.">
                  <Textarea
                    rows={4}
                    value={card.features.join("\n")}
                    onChange={(e) =>
                      set({
                        pricing: s.pricing.map((item, j) => (j === i ? { ...item, features: e.target.value.split("\n") } : item)),
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set({
                pricing: [
                  ...s.pricing,
                  { title: "", subtitle: "", price: 30, header: "standard", featured: false, features: [] },
                ],
              })
            }
          >
            <Plus /> Add plan
          </Button>
        </div>
      </Panel>

      <Panel title="Specialized mentorship" description="The sliding cards under What We Offer.">
        <div className="space-y-3">
          {s.mentorship.map((slide, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">{slide.title || `Slide ${i + 1}`}</p>
                <RowTools
                  index={i}
                  total={s.mentorship.length}
                  onUp={() => set({ mentorship: move(s.mentorship, i, -1) })}
                  onDown={() => set({ mentorship: move(s.mentorship, i, 1) })}
                  onRemove={() => set({ mentorship: s.mentorship.filter((_, j) => j !== i) })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <Field label="Title">
                  <Input
                    value={slide.title}
                    onChange={(e) =>
                      set({ mentorship: s.mentorship.map((item, j) => (j === i ? { ...item, title: e.target.value } : item)) })
                    }
                  />
                </Field>
                <Field label="Background">
                  <Select
                    value={slide.theme}
                    onValueChange={(value) =>
                      set({
                        mentorship: s.mentorship.map((item, j) =>
                          j === i ? { ...item, theme: value as SiteContent["mentorship"][number]["theme"] } : item,
                        ),
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLIDE_THEMES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={slide.body}
                    onChange={(e) =>
                      set({ mentorship: s.mentorship.map((item, j) => (j === i ? { ...item, body: e.target.value } : item)) })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => set({ mentorship: [...s.mentorship, { title: "", body: "", theme: "exam" }] })}
          >
            <Plus /> Add slide
          </Button>
        </div>
      </Panel>

      <Panel
        title="Page text"
        description="Leave a box blank to keep the original wording. Use **bold** and *italic*. Line breaks are kept."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow">
              <Input value={s.heroBrand} onChange={(e) => set({ heroBrand: e.target.value })} />
            </Field>
            <Field label="Headline">
              <Input value={s.heroTitle} onChange={(e) => set({ heroTitle: e.target.value })} />
            </Field>
          </div>
          <Field label="Hero text">
            <Textarea rows={4} value={s.heroSubtitle} onChange={(e) => set({ heroSubtitle: e.target.value })} />
          </Field>
          <Field label="Academic tutoring">
            <Textarea rows={4} value={s.tutoringBlurb} onChange={(e) => set({ tutoringBlurb: e.target.value })} />
          </Field>
          <Field label="Test prep">
            <Textarea rows={4} value={s.testPrepBlurb} onChange={(e) => set({ testPrepBlurb: e.target.value })} />
          </Field>
          <Field label="About the team">
            <Textarea rows={4} value={s.aboutBlurb} onChange={(e) => set({ aboutBlurb: e.target.value })} />
          </Field>
          <Field label="Catalog introduction">
            <Textarea rows={3} value={s.catalogSubtitle} onChange={(e) => set({ catalogSubtitle: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save website
        </Button>
      </div>
    </form>
  );
}
