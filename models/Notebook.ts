import mongoose, { Schema, Model } from "mongoose";
import { Notebook as NotebookType } from "@/types";

interface NotebookVersion {
  content: string;
  savedAt: Date;
  savedBy: string;
}

interface NotebookDocument extends Omit<NotebookType, "id">, mongoose.Document {
  versions: NotebookVersion[];
  _id: mongoose.Types.ObjectId;
}

const NotebookVersionSchema = new Schema<NotebookVersion>(
  {
    content: { type: String, required: true },
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: String, required: true },
  },
  { _id: false }
);

const NotebookSchema = new Schema<NotebookDocument>(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      default: "Untitled Notebook",
    },
    content: {
      type: String,
      default: "",
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    collaborators: [{
      type: String,
    }],
    version: {
      type: Number,
      default: 1,
    },
    versions: {
      type: [NotebookVersionSchema],
      default: [],
    },
    experimentImages: [{
      public_id: { type: String, required: true },
      secure_url: { type: String, required: true },
    }],
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const Notebook: Model<NotebookDocument> =
  mongoose.models.Notebook || mongoose.model<NotebookDocument>("Notebook", NotebookSchema);

export default Notebook;

