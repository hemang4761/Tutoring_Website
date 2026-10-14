import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { TUTOR_STATUSES } from "@/lib/constants";

export const availabilitySlotSchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, required: true }, // "15:30"
    end: { type: String, required: true },
  },
  { _id: false },
);

const tutorProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    headline: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    photoUrl: String,
    school: { type: String, default: "Bergen County Academies" },
    gradYear: String,
    subjects: { type: [String], default: [] },
    gradeLevels: { type: [String], default: [] },
    availability: { type: [availabilitySlotSchema], default: [] },
    maxStudents: { type: Number, default: 4 },
    status: { type: String, enum: TUTOR_STATUSES, default: "invited" },
    showOnSite: { type: Boolean, default: false },
    siteOrder: { type: Number, default: 100 },
    application: { type: Schema.Types.ObjectId, ref: "TutorApplication" },
  },
  { timestamps: true },
);

export type TutorProfileDoc = InferSchemaType<typeof tutorProfileSchema> & { _id: Types.ObjectId };
export const TutorProfile: Model<TutorProfileDoc> =
  (models.TutorProfile as Model<TutorProfileDoc>) ||
  model<TutorProfileDoc>("TutorProfile", tutorProfileSchema);
