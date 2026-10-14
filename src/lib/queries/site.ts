import "server-only";
import { connectDB } from "@/lib/db";
import { defaultSiteContent, withTextFallbacks, type PriceHeader, type SiteContent, type SlideTheme } from "@/lib/site";
import { SiteContent as SiteContentModel } from "@/models";

const HEADERS = new Set<PriceHeader>(["foundation", "standard", "testprep", "premium"]);
const THEMES = new Set<SlideTheme>(["exam", "math", "engineering"]);

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

function header(value: unknown): PriceHeader {
  return HEADERS.has(value as PriceHeader) ? (value as PriceHeader) : "standard";
}

function theme(value: unknown): SlideTheme {
  return THEMES.has(value as SlideTheme) ? (value as SlideTheme) : "exam";
}

function mapDoc(doc: Record<string, unknown>): SiteContent {
  const stats = Array.isArray(doc.stats) ? doc.stats : [];
  const tutors = Array.isArray(doc.tutors) ? doc.tutors : [];
  const catalog = Array.isArray(doc.catalog) ? doc.catalog : [];
  const pricing = Array.isArray(doc.pricing) ? doc.pricing : [];
  const mentorship = Array.isArray(doc.mentorship) ? doc.mentorship : [];
  return {
    customTutors: doc.customTutors === true,
    stats: stats
      .map((row) => {
        const item = row as { value?: unknown; label?: unknown };
        return { value: String(item.value ?? "").trim(), label: String(item.label ?? "").trim() };
      })
      .filter((row) => row.value || row.label),
    tutors: tutors
      .map((row) => {
        const item = row as { name?: unknown; role?: unknown; bio?: unknown; photo?: unknown };
        return {
          name: String(item.name ?? "").trim(),
          role: String(item.role ?? "").trim(),
          bio: String(item.bio ?? "").trim(),
          photo: String(item.photo ?? "").trim(),
        };
      })
      .filter((row) => row.name),
    ticker: strings(doc.ticker),
    catalog: catalog
      .map((row) => {
        const item = row as { label?: unknown; courses?: unknown };
        return { label: String(item.label ?? "").trim(), courses: strings(item.courses) };
      })
      .filter((row) => row.label),
    collegeNote: String(doc.collegeNote ?? ""),
    pricing: pricing
      .map((row) => {
        const item = row as {
          title?: unknown;
          subtitle?: unknown;
          price?: unknown;
          header?: unknown;
          featured?: unknown;
          features?: unknown;
        };
        return {
          title: String(item.title ?? "").trim(),
          subtitle: String(item.subtitle ?? "").trim(),
          price: Number(item.price) || 0,
          header: header(item.header),
          featured: item.featured === true,
          features: strings(item.features),
        };
      })
      .filter((row) => row.title),
    mentorship: mentorship
      .map((row) => {
        const item = row as { title?: unknown; body?: unknown; theme?: unknown };
        return {
          title: String(item.title ?? "").trim(),
          body: String(item.body ?? "").trim(),
          theme: theme(item.theme),
        };
      })
      .filter((row) => row.title),
    heroBrand: String(doc.heroBrand ?? ""),
    heroTitle: String(doc.heroTitle ?? ""),
    heroSubtitle: String(doc.heroSubtitle ?? ""),
    tutoringBlurb: String(doc.tutoringBlurb ?? ""),
    testPrepBlurb: String(doc.testPrepBlurb ?? ""),
    aboutBlurb: String(doc.aboutBlurb ?? ""),
    catalogSubtitle: String(doc.catalogSubtitle ?? ""),
  };
}

export async function getSavedSiteContent(): Promise<SiteContent | null> {
  await connectDB();
  const doc = await SiteContentModel.findOne({ key: "global" }).lean();
  return doc ? mapDoc(doc as unknown as Record<string, unknown>) : null;
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!process.env.MONGODB_URI) return defaultSiteContent();
  try {
    const saved = await getSavedSiteContent();
    return saved ? withTextFallbacks(saved) : defaultSiteContent();
  } catch (err) {
    console.error("[site] falling back to defaults", err);
    return defaultSiteContent();
  }
}
