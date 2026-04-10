import mongoose, { Schema, Document, Types } from "mongoose";

export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "REJECTED" | "HIRED";

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  status: ApplicationStatus;
  shortlisted: boolean;
  shortlistReason?: string;
  shortlistedBy?: Types.ObjectId;
  coverLetter?: string;
  appliedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  jobId: { type: Schema.Types.ObjectId, ref: "Job", index: true, required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  status: { type: String, enum: ["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"], default: "APPLIED" },
  shortlisted: { type: Boolean, default: false },
  shortlistReason: String,
  shortlistedBy: { type: Schema.Types.ObjectId, ref: "User" },
  coverLetter: String,
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
ApplicationSchema.index({ status: 1 });

export default mongoose.model<IApplication>("Application", ApplicationSchema);
