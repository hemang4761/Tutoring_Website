import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const channelSchema = new Schema(
  {
    kind: { type: String, enum: ["general", "lead", "dm"], required: true },
    name: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    // only used for dms; general and lead channels are visible to all staff
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    archived: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now },
    reads: {
      type: [
        new Schema(
          { user: { type: Schema.Types.ObjectId, ref: "User" }, at: { type: Date, default: Date.now } },
          { _id: false },
        ),
      ],
      default: [],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
channelSchema.index({ kind: 1, lastMessageAt: -1 });

const messageSchema = new Schema(
  {
    channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    kind: { type: String, enum: ["text", "system"], default: "text" },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attachments: {
      type: [new Schema({ url: String, name: String }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true },
);
messageSchema.index({ channel: 1, createdAt: -1 });

export type ChannelDoc = InferSchemaType<typeof channelSchema> & { _id: Types.ObjectId };
export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: Types.ObjectId };

export const Channel: Model<ChannelDoc> =
  (models.Channel as Model<ChannelDoc>) || model<ChannelDoc>("Channel", channelSchema);
export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) || model<MessageDoc>("Message", messageSchema);
