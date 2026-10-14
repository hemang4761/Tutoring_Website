import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const claimRequestSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
      index: true,
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: Date,
    decisionNote: String,
  },
  { timestamps: true },
);

export type ClaimRequestDoc = InferSchemaType<typeof claimRequestSchema> & { _id: Types.ObjectId };
export const ClaimRequest: Model<ClaimRequestDoc> =
  (models.ClaimRequest as Model<ClaimRequestDoc>) ||
  model<ClaimRequestDoc>("ClaimRequest", claimRequestSchema);
