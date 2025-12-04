import mongoose, { Schema, Model } from "mongoose";
import { Protocol as ProtocolType } from "@/types";

interface ProtocolVersion {
  title: string;
  description?: string;
  steps: ProtocolType["steps"];
  savedAt: Date;
  savedBy: string;
  versionNumber: number;
}

interface ProtocolDocument extends Omit<ProtocolType, "id">, mongoose.Document {
  versions: ProtocolVersion[];
  currentVersion: number;
  status: "draft" | "published" | "archived";
  _id: mongoose.Types.ObjectId;
}

const ProtocolStepSchema = new Schema({
  id: { type: String, required: true },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  reagents: [{ type: String }],
  timing: { type: String },
  equipment: [{ type: String }],
  notes: { type: String },
});

const ProtocolVersionSchema = new Schema<ProtocolVersion>(
  {
    title: { type: String, required: true },
    description: { type: String },
    steps: { type: [ProtocolStepSchema], required: true },
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: String, required: true },
    versionNumber: { type: Number, required: true },
  },
  { _id: false }
);

const ProtocolSchema = new Schema<ProtocolDocument>(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    steps: {
      type: [ProtocolStepSchema],
      default: [],
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    versions: {
      type: [ProtocolVersionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    attachments: [{
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
    }],
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const Protocol: Model<ProtocolDocument> =
  mongoose.models.Protocol || mongoose.model<ProtocolDocument>("Protocol", ProtocolSchema);

export default Protocol;

