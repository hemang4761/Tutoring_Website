import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { RATE_TIERS } from "@/lib/constants";

const assignmentSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId },
    studentName: { type: String, required: true, trim: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjects: { type: [String], default: [] },
    rateTier: { type: String, enum: RATE_TIERS.map((r) => r.key), default: "hs" },
    rate: { type: Number, default: 30 },
    status: { type: String, enum: ["active", "paused", "ended"], default: "active", index: true },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type AssignmentDoc = InferSchemaType<typeof assignmentSchema> & { _id: Types.ObjectId };
export const Assignment: Model<AssignmentDoc> =
  (models.Assignment as Model<AssignmentDoc>) || model<AssignmentDoc>("Assignment", assignmentSchema);
