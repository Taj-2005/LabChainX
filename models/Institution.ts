import mongoose, { Schema, Model } from "mongoose";

export interface InstitutionDocument extends mongoose.Document {
  name: string;
  abbreviation?: string;
  trustScore: number; // Computed trust score (0-100)
  metadata: {
    country?: string;
    type?: "university" | "research_institute" | "company" | "government" | "other";
    website?: string;
    description?: string;
  };
  verificationCount: number; // Number of verifications performed
  verifiedCount: number; // Number of items verified by this institution
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}

const InstitutionSchema = new Schema<InstitutionDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    abbreviation: {
      type: String,
      trim: true,
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    metadata: {
      country: { type: String, trim: true },
      type: {
        type: String,
        enum: ["university", "research_institute", "company", "government", "other"],
      },
      website: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    verifiedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const Institution: Model<InstitutionDocument> =
  mongoose.models.Institution ||
  mongoose.model<InstitutionDocument>("Institution", InstitutionSchema);

export default Institution;

