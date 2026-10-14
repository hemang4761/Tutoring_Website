"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { action, requireAdmin } from "@/lib/session";
import { SiteContent } from "@/models";

const siteSchema = z.object({
  customTutors: z.boolean(),
  stats: z.array(z.object({ value: z.string().trim().max(24), label: z.string().trim().max(220) })).max(8),
  tutors: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        role: z.string().trim().max(180),
        bio: z.string().trim().max(1200),
        photo: z.string().trim().max(500),
      }),
    )
    .max(24),
  ticker: z.array(z.string().trim().max(600)).max(6),
  catalog: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        courses: z.array(z.string().trim().min(1).max(140)).max(80),
      }),
    )
    .max(20),
  collegeNote: z.string().trim().max(600),
  pricing: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        subtitle: z.string().trim().max(160),
        price: z.number().min(0).max(999),
        header: z.enum(["foundation", "standard", "testprep", "premium"]),
        featured: z.boolean(),
        features: z.array(z.string().trim().min(1).max(180)).max(12),
      }),
    )
    .max(8),
  mentorship: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        body: z.string().trim().max(600),
        theme: z.enum(["exam", "math", "engineering"]),
      }),
    )
    .max(8),
  heroBrand: z.string().trim().max(80),
  heroTitle: z.string().trim().max(160),
  heroSubtitle: z.string().trim().max(600),
  tutoringBlurb: z.string().trim().max(900),
  testPrepBlurb: z.string().trim().max(900),
  aboutBlurb: z.string().trim().max(900),
  catalogSubtitle: z.string().trim().max(500),
});

export async function saveSiteContent(input: z.input<typeof siteSchema>) {
  return action(async () => {
    await requireAdmin();
    const data = siteSchema.parse(input);
    await connectDB();
    await SiteContent.findOneAndUpdate({ key: "global" }, { $set: { key: "global", ...data } }, { upsert: true });
    revalidatePath("/");
    revalidatePath("/admin/website");
  }, "Website updated");
}
