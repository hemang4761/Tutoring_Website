import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

// onboarding templates
export const ONBOARDING_STEP_TYPES = ["acknowledge", "text", "choice", "availability", "profile"] as const;
export type OnboardingStepType = (typeof ONBOARDING_STEP_TYPES)[number];

const stepSchema = new Schema(
  {
    key: { type: String, required: true },
    type: { type: String, enum: ONBOARDING_STEP_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    body: { type: String, trim: true }, // policy text for acknowledge steps
    options: { type: [String], default: [] },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const onboardingTemplateSchema = new Schema(
  {
    audience: { type: String, enum: ["tutor", "family"], required: true, unique: true },
    intro: { type: String, trim: true },
    steps: { type: [stepSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type OnboardingTemplateDoc = InferSchemaType<typeof onboardingTemplateSchema> & { _id: Types.ObjectId };
export const OnboardingTemplate: Model<OnboardingTemplateDoc> =
  (models.OnboardingTemplate as Model<OnboardingTemplateDoc>) ||
  model<OnboardingTemplateDoc>("OnboardingTemplate", onboardingTemplateSchema);

// notes on any entity
const noteSchema = new Schema(
  {
    entityType: { type: String, enum: ["lead", "tutor", "assignment"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);
noteSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type NoteDoc = InferSchemaType<typeof noteSchema> & { _id: Types.ObjectId };
export const Note: Model<NoteDoc> = (models.Note as Model<NoteDoc>) || model<NoteDoc>("Note", noteSchema);

// audit trail
const activityLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    summary: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema> & { _id: Types.ObjectId };
export const ActivityLog: Model<ActivityLogDoc> =
  (models.ActivityLog as Model<ActivityLogDoc>) || model<ActivityLogDoc>("ActivityLog", activityLogSchema);

// email audit
const emailLogSchema = new Schema(
  {
    to: { type: [String], default: [] },
    subject: { type: String, required: true },
    kind: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    error: String,
    providerId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
emailLogSchema.index({ createdAt: -1 });

export type EmailLogDoc = InferSchemaType<typeof emailLogSchema> & { _id: Types.ObjectId };
export const EmailLog: Model<EmailLogDoc> =
  (models.EmailLog as Model<EmailLogDoc>) || model<EmailLogDoc>("EmailLog", emailLogSchema);

// global settings singleton
const settingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    orgName: { type: String, default: "BCLearns" },
    replyTo: { type: String, default: "hello@bclearns.com" },
    notifyTutorsOnNewLead: { type: Boolean, default: true },
    extraNotifyEmails: { type: [String], default: [] },
    rateTiers: {
      type: [new Schema({ key: String, label: String, rate: Number }, { _id: false })],
      default: [],
    },
    remindersEnabled: { type: Boolean, default: true },
    quietDays: { type: Number, default: 14 },
    templates: {
      type: [new Schema({ label: { type: String, trim: true }, body: { type: String, trim: true } }, { _id: true })],
      default: [],
    },
    digestEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema> & { _id: Types.ObjectId };
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) || model<SettingsDoc>("Settings", settingsSchema);

const siteStatSchema = new Schema({ value: String, label: String }, { _id: false });
const siteTutorSchema = new Schema({ name: String, role: String, bio: String, photo: String }, { _id: false });
const siteGroupSchema = new Schema({ label: String, courses: { type: [String], default: [] } }, { _id: false });
const sitePriceSchema = new Schema(
  {
    title: String,
    subtitle: String,
    price: Number,
    header: { type: String, enum: ["foundation", "standard", "testprep", "premium"], default: "standard" },
    featured: { type: Boolean, default: false },
    features: { type: [String], default: [] },
  },
  { _id: false },
);
const siteSlideSchema = new Schema(
  {
    title: String,
    body: String,
    theme: { type: String, enum: ["exam", "math", "engineering"], default: "exam" },
  },
  { _id: false },
);

const siteContentSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    customTutors: { type: Boolean, default: false },
    stats: { type: [siteStatSchema], default: [] },
    tutors: { type: [siteTutorSchema], default: [] },
    ticker: { type: [String], default: [] },
    catalog: { type: [siteGroupSchema], default: [] },
    collegeNote: { type: String, default: "" },
    pricing: { type: [sitePriceSchema], default: [] },
    mentorship: { type: [siteSlideSchema], default: [] },
    heroBrand: { type: String, default: "" },
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    tutoringBlurb: { type: String, default: "" },
    testPrepBlurb: { type: String, default: "" },
    aboutBlurb: { type: String, default: "" },
    catalogSubtitle: { type: String, default: "" },
  },
  { timestamps: true },
);

export type SiteContentDoc = InferSchemaType<typeof siteContentSchema> & { _id: Types.ObjectId };
export const SiteContent: Model<SiteContentDoc> =
  (models.SiteContent as Model<SiteContentDoc>) || model<SiteContentDoc>("SiteContent", siteContentSchema);

// invite and password reset tokens (only the hash is stored)
const tokenSchema = new Schema(
  {
    type: { type: String, enum: ["invite", "reset"], required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true },
);

export type TokenDoc = InferSchemaType<typeof tokenSchema> & { _id: Types.ObjectId };
export const Token: Model<TokenDoc> = (models.Token as Model<TokenDoc>) || model<TokenDoc>("Token", tokenSchema);
