import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const tutorApplicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    school: { type: String, trim: true },
    gradYear: { type: String, trim: true },
    subjects: { type: [String], default: [] },
    gradeLevels: { type: [String], default: [] },
    satScore: String,
    apScores: String,
    experience: String,
    hoursPerWeek: String,
    availability: String,
    whyJoin: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNote: String,
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type TutorApplicationDoc = InferSchemaType<typeof tutorApplicationSchema> & { _id: Types.ObjectId };
export const TutorApplication: Model<TutorApplicationDoc> =
  (models.TutorApplication as Model<TutorApplicationDoc>) ||
  model<TutorApplicationDoc>("TutorApplication", tutorApplicationSchema);
