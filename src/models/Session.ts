import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { SESSION_STATUSES } from "@/lib/constants";

const sessionSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    subject: { type: String, trim: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    location: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    status: { type: String, enum: SESSION_STATUSES, default: "scheduled", index: true },
    notes: { type: String, trim: true }, // shared with the family
    privateNotes: { type: String, trim: true }, // internal only
    recurrenceId: String,
    reminderSentAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

sessionSchema.index({ tutor: 1, start: 1 });
sessionSchema.index({ start: 1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema> & { _id: Types.ObjectId };
export const Session: Model<SessionDoc> =
  (models.Session as Model<SessionDoc>) || model<SessionDoc>("Session", sessionSchema);
