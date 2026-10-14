import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { ROLES } from "@/lib/constants";

const onboardingResponseSchema = new Schema(
  {
    stepKey: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true },
    // invited = no password yet, active = can sign in, disabled = blocked
    status: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    onboarding: {
      status: { type: String, enum: ["pending", "complete"], default: "pending" },
      responses: { type: [onboardingResponseSchema], default: [] },
      completedAt: Date,
    },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    tutorProfile: { type: Schema.Types.ObjectId, ref: "TutorProfile" },
    notifyByEmail: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
