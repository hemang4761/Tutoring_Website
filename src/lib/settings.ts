import "server-only";
import { RATE_TIERS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models";

export async function getSettings() {
  await connectDB();
  let settings = await Settings.findOne({ key: "global" });
  if (!settings) {
    settings = await Settings.create({ key: "global", rateTiers: RATE_TIERS.map((r) => ({ ...r })) });
  }
  if (!settings.rateTiers?.length) {
    settings.set("rateTiers", RATE_TIERS.map((r) => ({ ...r })));
    await settings.save();
  }
  return settings;
}

export async function rateFor(tier: string) {
  const settings = await getSettings();
  return (
    settings.rateTiers.find((r) => r.key === tier)?.rate ?? RATE_TIERS.find((r) => r.key === tier)?.rate ?? 30
  );
}

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
