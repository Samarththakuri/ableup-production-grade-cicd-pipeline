import mongoose, { Schema, Document, Types } from "mongoose";

export interface IJob extends Document {
  recruiterId: Types.ObjectId;
  title: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  workHours?: string;
  disabilityEligible: string[];
  accessibilityFeatures: string[];
  location?: string;
  remote: boolean;
  isActive: boolean;
  applicantsCount: number;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  recruiterId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  salaryMin: Number,
  salaryMax: Number,
  workHours: String,
  disabilityEligible: [String],
  accessibilityFeatures: [String],
  location: String,
  remote: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  applicantsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

JobSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model<IJob>("Job", JobSchema);
