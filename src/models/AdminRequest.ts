import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { REQUEST_STATUSES, REQUEST_TYPES } from "@/lib/constants";

const replySchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const adminRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requesterRole: { type: String, enum: ["tutor", "family", "admin"], required: true },
    type: { type: String, enum: REQUEST_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    session: { type: Schema.Types.ObjectId, ref: "Session" },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    status: { type: String, enum: REQUEST_STATUSES, default: "open", index: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    replies: { type: [replySchema], default: [] },
    resolvedAt: Date,
  },
  { timestamps: true },
);

export type AdminRequestDoc = InferSchemaType<typeof adminRequestSchema> & { _id: Types.ObjectId };
export const AdminRequest: Model<AdminRequestDoc> =
  (models.AdminRequest as Model<AdminRequestDoc>) ||
  model<AdminRequestDoc>("AdminRequest", adminRequestSchema);
