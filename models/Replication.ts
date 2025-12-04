import mongoose, { Schema, Model } from "mongoose";

interface ReplicationVerification {
  verifiedBy: string; // User ID
  verifiedAt: Date;
  institution: string;
  signature: string; // Cryptographic signature
  notes?: string;
}

interface ReplicationDocument extends mongoose.Document {
  protocolId: string;
  protocolTitle: string;
  replicatorId: string;
  replicatorName: string;
  replicatorInstitution: string;
  status: "pending" | "in-progress" | "completed" | "verified" | "failed";
  results: {
    success: boolean;
    data?: Record<string, unknown>;
    observations?: string;
    notes?: string;
  };
  verifications: ReplicationVerification[];
  startedAt: Date;
  completedAt?: Date;
  signedAt?: Date;
  signature?: string; // ECDSA signature for data integrity
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Types.ObjectId;
}

const ReplicationVerificationSchema = new Schema<ReplicationVerification>(
  {
    verifiedBy: { type: String, required: true },
    verifiedAt: { type: Date, default: Date.now },
    institution: { type: String, required: true },
    signature: { type: String, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const ReplicationSchema = new Schema<ReplicationDocument>(
  {
    protocolId: {
      type: String,
      required: true,
      index: true,
    },
    protocolTitle: {
      type: String,
      required: true,
    },
    replicatorId: {
      type: String,
      required: true,
    },
    replicatorName: {
      type: String,
      required: true,
    },
    replicatorInstitution: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "verified", "failed"],
      default: "pending",
    },
    results: {
      success: { type: Boolean, default: false },
      data: { type: Schema.Types.Mixed },
      observations: { type: String },
      notes: { type: String },
    },
    verifications: {
      type: [ReplicationVerificationSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    signedAt: {
      type: Date,
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
ReplicationSchema.index({ protocolId: 1, status: 1 });
ReplicationSchema.index({ replicatorId: 1, status: 1 });

// Prevent re-compilation during development
const Replication: Model<ReplicationDocument> =
  mongoose.models.Replication || mongoose.model<ReplicationDocument>("Replication", ReplicationSchema);

export default Replication;

