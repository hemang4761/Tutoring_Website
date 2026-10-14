export const ROLES = ["admin", "tutor", "family"] as const;
export type Role = (typeof ROLES)[number];

export const LEAD_STATUSES = ["new", "contacted", "matched", "active", "paused", "ended", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  matched: "Matched",
  active: "Active",
  paused: "Paused",
  ended: "Ended",
  lost: "Not a fit",
};

// tailwind classes per status, used by status badges
export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  contacted: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  matched: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  paused: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  ended: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  lost: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

// statuses a tutor can still claim from
export const CLAIMABLE_STATUSES: LeadStatus[] = ["new", "contacted"];
// statuses that still need the admin to get a tutor in place
export const OPEN_STATUSES: LeadStatus[] = ["new", "contacted", "matched"];

// old statuses from before the simplification, mapped forward
export const LEGACY_STATUS_MAP: Record<string, LeadStatus> = {
  open: "contacted",
  claimed: "contacted",
  assigned: "matched",
  onboarding: "matched",
};

export const CONTACT_CHANNELS = ["text", "call", "email", "in_person", "note"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];
export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  text: "Texted",
  call: "Called",
  email: "Emailed",
  in_person: "Met",
  note: "Heard back",
};

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

export const TUTORING_REQUESTS = [
  "Elementary/Middle School Academic Tutoring",
  "SAT Prep",
  "ACT Prep",
  "High School Tutoring (reg/honors)",
  "AP Class Tutoring",
  "IB Class Tutoring",
  "Competitive Math",
  "Engineering Education",
  "BCA Prep",
  "SSAT Prep",
] as const;

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

// starting drafts for the Text button; editable in settings
export const DEFAULT_TEMPLATES = [
  {
    label: "Intro",
    body: "Hi {parent_first}, this is {admin_first} from BCLearns! Thanks for reaching out about tutoring. Do you have a few minutes to chat about what {student_first} needs?",
  },
  {
    label: "Matched with a tutor",
    body: "Hi {parent_first}! {tutor_first} is going to work with {student_first}. They'll text you soon to set up a first session.",
  },
  {
    label: "First session check-in",
    body: "Hi {parent_first}, just checking in. How did the first session with {tutor_first} go?",
  },
  {
    label: "Haven't heard in a while",
    body: "Hi {parent_first}, hope all is well! Want to get {student_first} back on the schedule?",
  },
];
