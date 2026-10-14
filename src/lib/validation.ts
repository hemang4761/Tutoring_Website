import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(30)
  .regex(/^[0-9+()\-.\s]+$/, "Enter a valid phone number");

export const studentSchema = z.object({
  name: z.string().trim().min(1, "Student name is required").max(100),
  grade: z.string().min(1, "Pick a grade"),
  school: z.string().trim().max(120).optional().default(""),
  subjects: z.array(z.string()).min(1, "Pick at least one subject").max(20),
});

export const leadSchema = z.object({
  parent: z.object({
    name: z.string().trim().min(2, "Your name is required").max(100),
    email: z.string().trim().email("Enter a valid email"),
    phone,
    preferredContact: z.enum(["email", "phone", "text"]),
  }),
  students: z.array(studentSchema).min(1).max(5),
  services: z.array(z.string()).min(1, "Pick at least one"),
  goals: z.string().trim().max(2000).optional().default(""),
  format: z.enum(["online", "in_person", "either"]),
  location: z.string().trim().max(120).optional().default(""),
  availability: z
    .array(z.object({ day: z.number().int().min(0).max(6), block: z.enum(["morning", "afternoon", "evening"]) }))
    .max(21),
  availabilityNotes: z.string().trim().max(1000).optional().default(""),
  sessionsPerWeek: z.string().max(40).optional().default(""),
  startTiming: z.string().max(60).optional().default(""),
  source: z.string().max(60).optional().default(""),
  referral: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional().default(""), // honeypot
});
export type LeadInput = z.input<typeof leadSchema>;

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
