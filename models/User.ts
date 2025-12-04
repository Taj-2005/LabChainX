import mongoose, { Schema, Model } from "mongoose";
import { User as UserType } from "@/types";

interface UserDocument extends Omit<UserType, "id">, mongoose.Document {
  password: string;
  _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    institution: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["researcher", "reviewer", "admin"],
      default: "researcher",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      trim: true,
    },
    profileImage: {
      public_id: { type: String },
      secure_url: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;

