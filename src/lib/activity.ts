import "server-only";
import type { Types } from "mongoose";
import { ActivityLog } from "@/models";

type Id = Types.ObjectId | string;

export async function logActivity(input: {
  actor?: Id | null;
  action: string;
  entityType: "lead" | "tutor" | "assignment" | "session" | "request" | "application" | "user";
  entityId: Id;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await ActivityLog.create({ ...input, actor: input.actor ?? undefined });
  } catch (err) {
    console.error("[activity] failed to log", err);
  }
}
