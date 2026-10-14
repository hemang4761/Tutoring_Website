import "server-only";
import crypto from "crypto";
import type { Types } from "mongoose";
import { Token } from "@/models";

const TTL = { invite: 1000 * 60 * 60 * 24 * 7, reset: 1000 * 60 * 60 * 2 };

const hash = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");

export async function createToken(userId: Types.ObjectId | string, type: "invite" | "reset") {
  const raw = crypto.randomBytes(32).toString("base64url");
  // invalidate older unused tokens of the same type
  await Token.updateMany({ user: userId, type, usedAt: null }, { usedAt: new Date() });
  await Token.create({ user: userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + TTL[type]) });
  return raw;
}

export async function findValidToken(raw: string, type?: "invite" | "reset") {
  const token = await Token.findOne({ tokenHash: hash(raw), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!token || (type && token.type !== type)) return null;
  return token;
}
