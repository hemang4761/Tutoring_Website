import { CATALOG } from "@/lib/catalog";

export const PRICE_HEADERS = [
  { value: "foundation", label: "Teal" },
  { value: "standard", label: "Navy" },
  { value: "testprep", label: "Blue" },
  { value: "premium", label: "Dark" },
] as const;

export const SLIDE_THEMES = [
  { value: "exam", label: "Campus" },
  { value: "math", label: "Math" },
  { value: "engineering", label: "Engineering" },
] as const;

export type PriceHeader = (typeof PRICE_HEADERS)[number]["value"];
export type SlideTheme = (typeof SLIDE_THEMES)[number]["value"];

export type SiteTutor = { name: string; role: string; bio: string; photo: string };
export type SiteContent = {
  customTutors: boolean;
  stats: { value: string; label: string }[];
  tutors: SiteTutor[];
  ticker: string[];
  catalog: { label: string; courses: string[] }[];
  collegeNote: string;
  pricing: {
    title: string;
    subtitle: string;
    price: number;
    header: PriceHeader;
    featured: boolean;
    features: string[];
  }[];
  mentorship: { title: string; body: string; theme: SlideTheme }[];
  heroBrand: string;
  heroTitle: string;
  heroSubtitle: string;
  tutoringBlurb: string;
  testPrepBlurb: string;
  aboutBlurb: string;
  catalogSubtitle: string;
};

export function defaultSiteContent(): SiteContent {
  return {
    customTutors: false,
    stats: [
      { value: "1500+", label: "All tutors scored at least 1500 on the SAT" },
      { value: "40+", label: "Course offerings across all subjects" },
      { value: "10+", label: "A network of more than 10 experienced tutors and consultants" },
    ],
    tutors: [],
    ticker: [
      "AP Calculus AB, AP Calculus BC, AP Statistics, Algebra 1 & 2, Geometry, Precalculus, AP Biology, AP Chemistry, AP Physics, Middle school math",
      "AP English Language, AP English Literature, AP U.S. History, AP World History, AP Psychology, SAT, ACT, AP Music Theory, College essays",
      "Middle school science, Essay writing, Test prep, BCA exam prep, AP Computer Science, Python, Java",
    ],
    catalog: CATALOG.filter((g) => g.key !== "specialized").map((g) => ({
      label: g.label,
      courses: g.courses.map((c) => c.name),
    })),
    collegeNote:
      "One-on-one support to build a strong application: narrative strategy, essay drafting and revision, and list-building.",
    pricing: [
      {
        title: "K–8 Tutoring",
        subtitle: "Elementary & Middle School",
        price: 25,
        header: "foundation",
        featured: false,
        features: ["All K–8 subjects", "Homework & study skills support", "Foundation building"],
      },
      {
        title: "9–12 Courses",
        subtitle: "Regular & Honors High School Classes",
        price: 30,
        header: "standard",
        featured: false,
        features: ["All non-AP/IB classes", "Homework & exam review", "Foundation through advanced"],
      },
      {
        title: "Test Prep & AP/IB",
        subtitle: "SAT, AP/IB & Entrance Exams",
        price: 35,
        header: "testprep",
        featured: false,
        features: ["SAT, ACT & AP/IB exam prep", "BCA / Bergen Tech entrance exam", "Targeted strategies & practice"],
      },
      {
        title: "Specialized",
        subtitle: "Engineering, Competition Math & College Consulting",
        price: 60,
        header: "premium",
        featured: true,
        features: ["Engineering tutoring", "Competition math (AMC, AIME)", "College consulting & essays"],
      },
    ],
    mentorship: [
      {
        theme: "exam",
        title: "BCA Entrance Exam Prep",
        body: "Expert preparation for Bergen County Academies / Bergen Tech entrance exams with proven strategies and comprehensive practice.",
      },
      {
        theme: "math",
        title: "Competition Math",
        body: "Advanced problem-solving techniques and competition strategies for AMC, AIME, and other prestigious math competitions.",
      },
      {
        theme: "engineering",
        title: "Engineering Education",
        body: "Hands-on engineering mentorship covering advanced concepts, projects, and real-world applications beyond standard curriculum.",
      },
    ],
    heroBrand: "Bergen County Learns",
    heroTitle: "Achieve Your Academic Goals with Confidence",
    heroSubtitle:
      "Expert tutoring and consulting from highly\nqualified students at the **Bergen County Academies**.\nWe've been where you are, and know how to help you succeed.",
    tutoringBlurb:
      "We tutor **K–12 students** across humanities, STEM, music, computer science, and more. From building middle school foundations to mastering advanced coursework, we break down complex concepts into clear, manageable steps.",
    testPrepBlurb:
      "Prepare for the **SAT**, **PSAT**, **ACT**, **AP**, and **IB** exams with tutors who understand the material *and* the test. We've earned 5s on AP exams in our teaching subjects, so we know what it takes to perform under pressure.",
    aboutBlurb:
      "We are **high school seniors** from **Bergen County Academies** who have spent years tutoring through the National Honor Society. We believe in making complex concepts accessible through patience, clear explanations, and genuine enthusiasm for helping students succeed.",
    catalogSubtitle:
      "Browse our full course catalog below—over 65 courses from elementary school through AP and IB. Use the search to find exactly what you need.",
  };
}

const TEXT_KEYS = [
  "collegeNote",
  "heroBrand",
  "heroTitle",
  "heroSubtitle",
  "tutoringBlurb",
  "testPrepBlurb",
  "aboutBlurb",
  "catalogSubtitle",
] as const;

export function withTextFallbacks(saved: SiteContent): SiteContent {
  const base = defaultSiteContent();
  const next = { ...saved };
  for (const key of TEXT_KEYS) {
    if (!next[key]?.trim()) next[key] = base[key];
  }
  return next;
}
