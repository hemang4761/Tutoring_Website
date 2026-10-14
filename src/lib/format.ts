import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns";

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export const firstName = (name = "") => name.split(/\s+/)[0] ?? name;

type DateLike = Date | string | number | null | undefined;
const toDate = (d: DateLike) => (d == null ? null : d instanceof Date ? d : new Date(d));

export function fmtDate(d: DateLike, pattern = "MMM d, yyyy") {
  const date = toDate(d);
  return date ? format(date, pattern) : "—";
}

export function fmtDateTime(d: DateLike) {
  const date = toDate(d);
  if (!date) return "—";
  const day = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : isYesterday(date) ? "Yesterday" : format(date, "EEE, MMM d");
  return `${day} · ${format(date, "h:mm a")}`;
}

export function fmtTimeRange(start: DateLike, end: DateLike) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "—";
  return `${format(s, "h:mm")}–${format(e, "h:mm a")}`;
}

export function timeAgo(d: DateLike) {
  const date = toDate(d);
  return date ? `${formatDistanceToNowStrict(date)} ago` : "—";
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

export const hours = (minutes: number) => `${(Math.round((minutes / 60) * 10) / 10).toLocaleString()} h`;

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
