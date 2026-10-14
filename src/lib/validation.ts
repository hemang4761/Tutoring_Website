import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(30)
  .regex(/^[0-9+()\-.\s]+$/, "Enter a valid phone number");

const K12 = new Set(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);

export const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Your name is required").max(100),
    email: z.string().trim().email("Enter a valid email"),
    grade: z.string().min(1, "Pick a grade"),
    phone: z.string().trim().regex(/^\d{3}-\d{3}-\d{4}$/, "Use XXX-XXX-XXXX"),
    respondent: z.string(),
    service: z.string(),
    tutoringRequest: z.string().trim().max(120).optional().default(""),
    courses: z.string().trim().max(1000).optional().default(""),
    hoursPerWeek: z.string().trim().max(40).optional().default(""),
    comments: z.string().trim().max(2000).optional().default(""),
    alsoConsulting: z.string().optional().default(""),
    careerInterests: z.string().trim().max(2000).optional().default(""),
    academics: z.string().trim().max(2000).optional().default(""),
    extracurriculars: z.string().trim().max(2000).optional().default(""),
    collegeList: z.string().trim().max(2000).optional().default(""),
    consultingGoals: z.string().trim().max(2000).optional().default(""),
    website: z.string().max(0).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.grade && !K12.has(data.grade)) {
      ctx.addIssue({ code: "custom", path: ["grade"], message: "Pick a grade from K through 12" });
    }
    if (data.respondent !== "student" && data.respondent !== "parent") {
      ctx.addIssue({ code: "custom", path: ["respondent"], message: "Tell us who you are" });
    }
    if (data.service !== "tutoring" && data.service !== "college") {
      ctx.addIssue({ code: "custom", path: ["service"], message: "Pick a service" });
    }
    if (data.service === "tutoring") {
      if (!data.tutoringRequest) {
        ctx.addIssue({ code: "custom", path: ["tutoringRequest"], message: "Pick a tutoring request" });
      }
      if (!data.courses) {
        ctx.addIssue({ code: "custom", path: ["courses"], message: "List the courses you need" });
      }
      if (!data.hoursPerWeek) {
        ctx.addIssue({ code: "custom", path: ["hoursPerWeek"], message: "Enter hours per week" });
      }
      if (data.alsoConsulting !== "yes" && data.alsoConsulting !== "no") {
        ctx.addIssue({ code: "custom", path: ["alsoConsulting"], message: "Pick yes or no" });
      }
    }
    const college = data.service === "college" || data.alsoConsulting === "yes";
    if (college) {
      if (!data.careerInterests) {
        ctx.addIssue({ code: "custom", path: ["careerInterests"], message: "Share your career interests" });
      }
      if (!data.extracurriculars) {
        ctx.addIssue({ code: "custom", path: ["extracurriculars"], message: "Add a short list of activities" });
      }
      if (!data.consultingGoals) {
        ctx.addIssue({ code: "custom", path: ["consultingGoals"], message: "Tell us what you want help with" });
      }
    }
  });
export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;

export const applicationSchema = z.object({
  name: z.string().trim().min(2, "Your name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  phone,
  school: z.string().trim().min(2, "School is required").max(120),
  gradYear: z.string().min(4, "Pick your graduation year"),
  subjects: z.array(z.string()).min(1, "Pick at least one subject"),
  gradeLevels: z.array(z.string()).min(1, "Pick at least one"),
  satScore: z.string().trim().max(20).optional().default(""),
  apScores: z.string().trim().max(1000).optional().default(""),
  experience: z.string().trim().min(10, "Tell us a little about your experience").max(3000),
  hoursPerWeek: z.string().min(1, "Pick one"),
  availability: z.string().trim().max(1000).optional().default(""),
  whyJoin: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional().default(""),
});
export type ApplicationInput = z.input<typeof applicationSchema>;
