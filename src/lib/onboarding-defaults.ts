import type { OnboardingStepType } from "@/models/Misc";

export type OnboardingStep = {
  key: string;
  type: OnboardingStepType;
  title: string;
  description?: string;
  body?: string;
  options?: string[];
  required: boolean;
};

export const DEFAULT_TUTOR_TEMPLATE: { intro: string; steps: OnboardingStep[] } = {
  intro:
    "Welcome to the BCLearns team! Finish these steps to unlock your full tutor dashboard, the claim board, and the team chat.",
  steps: [
    {
      key: "profile",
      type: "profile",
      title: "Complete your tutor profile",
      description: "This is what admins see when matching you with students, and what families see in their portal.",
      required: true,
    },
    {
      key: "availability",
      type: "availability",
      title: "Set your weekly availability",
      description: "Add the windows you can usually tutor. You can change this any time from your schedule.",
      required: true,
    },
    {
      key: "conduct",
      type: "acknowledge",
      title: "Tutor code of conduct",
      body: [
        "Show up on time and prepared for every session. If you must cancel, give at least 24 hours notice and tell an admin.",
        "Be patient, respectful, and encouraging. Never complete graded work for a student.",
        "Log every session (completed, canceled, or no-show) within 24 hours so hours and billing stay accurate.",
        "Keep family contact details private and only use them for tutoring.",
      ].join("\n\n"),
      required: true,
    },
    {
      key: "safety",
      type: "acknowledge",
      title: "Safety and communication policy",
      body: [
        "Communicate with families about scheduling and progress. Keep all communication professional.",
        "In-person sessions happen in public places or at the student's home with a parent or guardian present.",
        "Report any concern about a student's safety or wellbeing to an admin right away.",
      ].join("\n\n"),
      required: true,
    },
    {
      key: "payout",
      type: "choice",
      title: "How would you like to be paid?",
      options: ["Venmo", "Zelle", "Cash", "Other"],
      required: true,
    },
    {
      key: "emergency",
      type: "text",
      title: "Emergency contact",
      description: "Name, relationship, and phone number.",
      required: true,
    },
  ],
};

export const DEFAULT_FAMILY_TEMPLATE: { intro: string; steps: OnboardingStep[] } = {
  intro:
    "Welcome to BCLearns! You've been matched with a tutor. Complete these quick steps to unlock your family portal, where you can see your schedule, session notes, and hours.",
  steps: [
    {
      key: "contact",
      type: "profile",
      title: "Confirm your contact details",
      description: "We'll use these for scheduling and session reminders.",
      required: true,
    },
    {
      key: "policies",
      type: "acknowledge",
      title: "Tutoring policies",
      body: [
        "Cancellations: please give at least 24 hours notice. Late cancellations and no-shows may be billed in full.",
        "Payment: sessions are billed at the agreed hourly rate and are due within 7 days of the session.",
        "Sessions: tutors will log notes after each session, which you can see in your portal.",
      ].join("\n\n"),
      required: true,
    },
    {
      key: "payment",
      type: "choice",
      title: "Preferred payment method",
      options: ["Venmo", "Zelle", "Cash", "Check"],
      required: true,
    },
    {
      key: "availability",
      type: "availability",
      title: "When can your student meet?",
      description: "Add the times that usually work. Your tutor will use this to propose a schedule.",
      required: true,
    },
    {
      key: "notes",
      type: "text",
      title: "Anything your tutor should know?",
      description: "Learning style, accommodations, upcoming tests, or goals.",
      required: false,
    },
  ],
};
