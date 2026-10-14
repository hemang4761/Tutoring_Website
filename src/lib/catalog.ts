export type CatalogCourse = { name: string; search: string };
export type CatalogGroup = { key: string; label: string; courses: CatalogCourse[] };

const c = (name: string, search = "") => ({ name, search: `${search} ${name}`.toLowerCase() });

export const CATALOG: CatalogGroup[] = [
  {
    key: "math",
    label: "Math",
    courses: [
      c("Middle school math (grades K–8)", "middle school math grades k 6 7 8 elementary"),
      c("Algebra 1"),
      c("Algebra 2"),
      c("Geometry"),
      c("Trigonometry"),
      c("Statistics", "intro"),
      c("Precalculus"),
      c("Calculus 1"),
      c("Calculus 2"),
      c("AP Calculus AB", "calc"),
      c("AP Calculus BC", "calc"),
      c("AP Precalculus"),
      c("AP Statistics"),
      c("IB Mathematics: Analysis & Approaches HL/SL", "ib math analysis approaches"),
      c("IB Mathematics: Applications & Interpretation HL/SL", "ib math applications interpretation"),
    ],
  },
  {
    key: "science",
    label: "Science",
    courses: [
      c("Middle school science (grades K–8)", "middle school science grades k 6 7 8 elementary"),
      c("Biology (honors / intro)"),
      c("Chemistry (honors / intro)"),
      c("Physics (honors / intro)"),
      c("AP Biology"),
      c("AP Chemistry"),
      c("AP Physics 1"),
      c("AP Physics 2"),
      c("AP Physics C: Mechanics"),
      c("AP Physics C: E&M", "em"),
      c("AP Environmental Science"),
      c("IB Biology HL/SL"),
      c("IB Chemistry HL/SL"),
      c("IB Physics HL/SL"),
      c("IB Environmental Systems & Societies"),
    ],
  },
  {
    key: "humanities",
    label: "Humanities",
    courses: [
      c("Middle school English & history"),
      c("English 9–12 (composition, literature)", "english 9 10 11 12"),
      c("U.S. History (intro / honors)", "us history"),
      c("World History (intro / honors)"),
      c("Essay writing & reading comprehension"),
      c("AP English Language & Composition"),
      c("AP English Literature & Composition"),
      c("AP U.S. Government & Politics", "ap government politics"),
      c("AP Comparative Government & Politics"),
      c("AP Psychology"),
      c("IB Language A: Literature HL/SL"),
      c("IB Language A: Language & Literature HL/SL"),
      c("IB History HL/SL"),
      c("IB Economics HL/SL"),
    ],
  },
  {
    key: "test-prep",
    label: "Test Prep",
    courses: [
      c("SAT"),
      c("ACT"),
      c("AP exams (all subjects we tutor)"),
      c("IB exams (all subjects we tutor)"),
      c("SAT Subject Tests"),
      c("BCA/BCTS Entrance Exam", "bca exam bergen county academies entrance exam bergen tech"),
    ],
  },
  {
    key: "music",
    label: "Music Theory",
    courses: [
      c("Fundamentals (notation, rhythm, scales)", "music"),
      c("Harmony & composition (intro)", "music"),
      c("AP Music Theory"),
    ],
  },
  {
    key: "other",
    label: "Other",
    courses: [
      c("Intro to computer science"),
      c("Economics (intro / honors)"),
      c("AP Computer Science A"),
      c("AP Computer Science Principles"),
      c("C Programming", "c language"),
      c("Python", "programming coding"),
      c("Java", "programming coding"),
      c("HTML/CSS", "web design web development"),
      c("JavaScript (JS)", "web development"),
      c("Data Structures", "algorithms"),
      c("AP Microeconomics"),
      c("AP Macroeconomics"),
      c("IB Computer Science HL/SL"),
      c("IB Business Management HL/SL"),
    ],
  },
  {
    key: "specialized",
    label: "Specialized",
    courses: [
      c("Competition Math (AMC, AIME)", "competition math amc aime"),
      c("Engineering", "engineering projects"),
      c("College Consulting & Essays", "college consulting essay application"),
    ],
  },
];

// broad subject areas used in forms
export const SUBJECT_AREAS = CATALOG.map((g) => g.label);
export const ALL_COURSES = CATALOG.flatMap((g) => g.courses.map((x) => x.name));
