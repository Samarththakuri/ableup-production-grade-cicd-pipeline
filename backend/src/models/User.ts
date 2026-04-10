import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  forcePasswordChange: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["CANDIDATE", "RECRUITER", "ADMIN"], required: true },
  verificationStatus: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING" },
  forcePasswordChange: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
