import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { FORMATS, LEAD_STATUSES, RATE_TIERS, TIME_BLOCKS } from "@/lib/constants";

const studentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  grade: { type: String, trim: true },
  school: { type: String, trim: true },
  subjects: { type: [String], default: [] },
  notes: { type: String, trim: true },
});

const leadSchema = new Schema(
  {
    parent: {
      type: new Schema(
        {
          name: { type: String, required: true, trim: true },
          email: { type: String, required: true, lowercase: true, trim: true },
          phone: { type: String, trim: true },
          preferredContact: { type: String, enum: ["email", "phone", "text"], default: "email" },
        },
        { _id: false },
      ),
      required: true,
    },
    students: { type: [studentSchema], default: [] },
    subjects: { type: [String], default: [] },
    services: { type: [String], default: [] }, // tutoring, test prep, college consulting, etc
    goals: { type: String, trim: true },
    format: { type: String, enum: FORMATS.map((f) => f.key), default: "either" },
    location: { type: String, trim: true },
    availability: {
      type: [
        new Schema(
          { day: { type: Number, min: 0, max: 6 }, block: { type: String, enum: TIME_BLOCKS.map((b) => b.key) } },
          { _id: false },
        ),
      ],
      default: [],
    },
    availabilityNotes: { type: String, trim: true },
    startTiming: { type: String, trim: true },
    sessionsPerWeek: { type: String, trim: true },
    source: { type: String, trim: true },
    referral: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    rateTier: { type: String, enum: RATE_TIERS.map((r) => r.key) },
    tags: { type: [String], default: [] },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    assignedTutors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    channel: { type: Schema.Types.ObjectId, ref: "Channel" },
    familyUser: { type: Schema.Types.ObjectId, ref: "User" },
    contactedAt: Date,
    assignedAt: Date,
    activeAt: Date,
    lostReason: String,
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ "parent.name": "text", "parent.email": "text", "students.name": "text", subjects: "text" });

export type LeadDoc = InferSchemaType<typeof leadSchema> & { _id: Types.ObjectId };
export const Lead: Model<LeadDoc> = (models.Lead as Model<LeadDoc>) || model<LeadDoc>("Lead", leadSchema);
