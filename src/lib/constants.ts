export const ROLES = ["admin", "tutor", "family"] as const;
export type Role = (typeof ROLES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "open",
  "claimed",
  "assigned",
  "onboarding",
  "active",
  "paused",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  open: "Open",
  claimed: "Claimed",
  assigned: "Assigned",
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  lost: "Lost",
};

// tailwind classes per status, used by status badges and kanban headers
export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  contacted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  open: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  claimed: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  assigned: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  onboarding: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  paused: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  lost: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

// statuses a tutor can still claim from
export const CLAIMABLE_STATUSES: LeadStatus[] = ["new", "contacted", "open", "claimed"];

export const SESSION_STATUSES = ["scheduled", "completed", "canceled", "no_show"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  canceled: "Canceled",
  no_show: "No-show",
};
export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: "#3b5998",
  completed: "#059669",
  canceled: "#a1a1aa",
  no_show: "#e11d48",
};

export const REQUEST_TYPES = ["reassign", "time_off", "need_help", "schedule_change", "more_students", "other"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  reassign: "Reassign student",
  time_off: "Time off",
  need_help: "Need help",
  schedule_change: "Schedule change",
  more_students: "Want more students",
  other: "Other",
};
export const REQUEST_STATUSES = ["open", "in_progress", "resolved", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const RATE_TIERS = [
  { key: "k8", label: "K–8 Tutoring", rate: 25 },
  { key: "hs", label: "9–12 Courses", rate: 30 },
  { key: "testprep", label: "Test Prep & AP/IB", rate: 35 },
  { key: "specialized", label: "Specialized", rate: 60 },
] as const;
export type RateTierKey = (typeof RATE_TIERS)[number]["key"];

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "College"] as const;

export const LEAD_SOURCES = [
  "Word of mouth",
  "Friend or family referral",
  "School",
  "Social media",
  "Google search",
  "Flyer",
  "Returning client",
  "Other",
] as const;

export const FORMATS = [
  { key: "online", label: "Online" },
  { key: "in_person", label: "In person" },
  { key: "either", label: "Either works" },
] as const;
export type Format = (typeof FORMATS)[number]["key"];

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const TIME_BLOCKS = [
  { key: "morning", label: "Morning", hint: "8am–12pm" },
  { key: "afternoon", label: "Afternoon", hint: "12–5pm" },
  { key: "evening", label: "Evening", hint: "5–9pm" },
] as const;
export type TimeBlock = (typeof TIME_BLOCKS)[number]["key"];

export const TUTOR_STATUSES = ["invited", "onboarding", "active", "inactive"] as const;
