import mongoose, { Schema, Model } from "mongoose";

export type PRStatus = "open" | "changes_requested" | "approved" | "merged" | "closed";

export type ReviewStatus = "pending" | "approved" | "changes_requested";

export interface PRChange {
  type: "add" | "edit" | "delete";
  stepId?: string;
  step?: {
    id: string;
    order: number;
    title: string;
    reagents?: string[];
    timing?: string;
    equipment?: string[];
    notes?: string;
  };
  oldStep?: {
    id: string;
    order: number;
    title: string;
    reagents?: string[];
    timing?: string;
    equipment?: string[];
    notes?: string;
  };
}

export interface PRComment {
  authorId: string;
  text: string;
  path?: string; // Step ID or general comment
  createdAt: Date;
  _id?: mongoose.Types.ObjectId;
}

export interface PRReviewer {
  userId: string;
  status: ReviewStatus;
  reviewedAt?: Date;
}

export interface PullRequestDocument extends mongoose.Document {
  protocolId: string;
  authorId: string;
  branch: string;
  title: string;
  description?: string;
  status: PRStatus;
  changes: PRChange[];
  reviewers: PRReviewer[];
  comments: PRComment[];
  mergedBy?: string;
  mergedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}

const PRChangeSchema = new Schema<PRChange>(
  {
    type: {
      type: String,
      enum: ["add", "edit", "delete"],
      required: true,
    },
    stepId: { type: String },
    step: {
      id: { type: String },
      order: { type: Number },
      title: { type: String },
      reagents: [{ type: String }],
      timing: { type: String },
      equipment: [{ type: String }],
      notes: { type: String },
    },
    oldStep: {
      id: { type: String },
      order: { type: Number },
      title: { type: String },
      reagents: [{ type: String }],
      timing: { type: String },
      equipment: [{ type: String }],
      notes: { type: String },
    },
  },
  { _id: false }
);

const PRCommentSchema = new Schema<PRComment>(
  {
    authorId: { type: String, required: true },
    text: { type: String, required: true },
    path: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PRReviewerSchema = new Schema<PRReviewer>(
  {
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "changes_requested"],
      default: "pending",
    },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const PullRequestSchema = new Schema<PullRequestDocument>(
  {
    protocolId: {
      type: String,
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    branch: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "changes_requested", "approved", "merged", "closed"],
      default: "open",
      index: true,
    },
    changes: {
      type: [PRChangeSchema],
      default: [],
    },
    reviewers: {
      type: [PRReviewerSchema],
      default: [],
    },
    comments: {
      type: [PRCommentSchema],
      default: [],
    },
    mergedBy: {
      type: String,
    },
    mergedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PullRequestSchema.index({ protocolId: 1, status: 1 });
PullRequestSchema.index({ authorId: 1, status: 1 });
PullRequestSchema.index({ createdAt: -1 });

// Prevent re-compilation during development
const PullRequest: Model<PullRequestDocument> =
  mongoose.models.PullRequest ||
  mongoose.model<PullRequestDocument>("PullRequest", PullRequestSchema);

export default PullRequest;

