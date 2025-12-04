import mongoose, { Schema, Model } from "mongoose";

export interface VerificationDocument extends mongoose.Document {
  subjectId: string; // Protocol ID or Experiment ID
  subjectType: "protocol" | "experiment";
  verifierId: string; // User ID
  institutionId: string; // Institution name/ID
  timestamp: Date;
  status: "verified" | "pending" | "rejected";
  notes?: string;
  signature?: string; // Cryptographic signature
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}

const VerificationSchema = new Schema<VerificationDocument>(
  {
    subjectId: {
      type: String,
      required: true,
      index: true,
    },
    subjectType: {
      type: String,
      enum: ["protocol", "experiment"],
      required: true,
      index: true,
    },
    verifierId: {
      type: String,
      required: true,
      index: true,
    },
    institutionId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["verified", "pending", "rejected"],
      default: "verified",
    },
    notes: {
      type: String,
      trim: true,
    },
    signature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
VerificationSchema.index({ subjectId: 1, subjectType: 1 });
VerificationSchema.index({ institutionId: 1, timestamp: -1 });
VerificationSchema.index({ verifierId: 1, timestamp: -1 });

// Prevent re-compilation during development
const Verification: Model<VerificationDocument> =
  mongoose.models.Verification ||
  mongoose.model<VerificationDocument>("Verification", VerificationSchema);

export default Verification;

