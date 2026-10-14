"use client";

import { createContext, useCallback, useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { TutorOption } from "@/lib/queries/dashboard";

export type Template = { id: string; label: string; body: string };
export type RateTier = { key: string; label: string; rate: number };

type AdminData = {
  adminName: string;
  templates: Template[];
  tutors: TutorOption[];
  rateTiers: RateTier[];
};

const Ctx = createContext<AdminData | null>(null);

export function AdminProvider({ value, children }: { value: AdminData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside the admin layout");
  return v;
}

// client and tutor details open as a side panel on whatever page you're on, keyed by the url
export function usePanel() {
  const pathname = usePathname();
  const params = useSearchParams();
  const open = useCallback(
    (kind: "client" | "tutor", id: string) => {
      const next = new URLSearchParams(params.toString());
      next.delete("client");
      next.delete("tutor");
      next.set(kind, id);
      // shallow url update: no server round trip, the panel loads its own data
      window.history.pushState(null, "", `${pathname}?${next.toString()}`);
    },
    [params, pathname],
  );
  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("client");
    next.delete("tutor");
    const qs = next.toString();
    window.history.pushState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname]);
  return { open, close, clientId: params.get("client"), tutorId: params.get("tutor") };
}

export function fillTemplate(body: string, vars: { parent?: string; student?: string; tutor?: string; admin?: string }) {
  const first = (s = "") => s.trim().split(/[\s,]+/).filter(Boolean)[s.includes(",") ? 1 : 0] ?? s;
  return body
    .replace(/\{parent_first\}/g, first(vars.parent))
    .replace(/\{parent\}/g, vars.parent ?? "")
    .replace(/\{student_first\}/g, first(vars.student))
    .replace(/\{student\}/g, vars.student ?? "")
    .replace(/\{tutor_first\}/g, first(vars.tutor))
    .replace(/\{tutor\}/g, vars.tutor ?? "")
    .replace(/\{admin_first\}/g, first(vars.admin));
}

// best fits first: teaches the subject, covers the grade, has room
export function rankTutors(tutors: TutorOption[], subjects: string[], grade: string) {
  const want = subjects.map((s) => s.toLowerCase());
  const score = (t: TutorOption) => {
    const teaches = t.subjects.some((s) => want.some((w) => s.toLowerCase().includes(w) || w.includes(s.toLowerCase())));
    const grades = !grade || !t.gradeLevels.length || t.gradeLevels.includes(grade);
    const room = t.students < t.max;
    return (teaches ? 4 : 0) + (grades ? 2 : 0) + (room ? 1 : -3);
  };
  return [...tutors].map((t) => ({ ...t, score: score(t) })).sort((a, b) => b.score - a.score || a.students - b.students);
}
