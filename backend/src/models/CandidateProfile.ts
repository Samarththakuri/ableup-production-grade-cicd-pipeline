import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICandidateProfile extends Document {
  userId: Types.ObjectId;
  disabilityType?: string;
  disabilityPercentage?: number;
  udidNumber?: string;
  udidDocumentUrl?: string;
  preferredWorkHours?: string;
  resumeUrl?: string;
  savedJobs: Types.ObjectId[];
}

const CandidateProfileSchema = new Schema<ICandidateProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
  disabilityType: String,
  disabilityPercentage: Number,
  udidNumber: { type: String, unique: true, sparse: true },
  udidDocumentUrl: String,
  preferredWorkHours: String,
  resumeUrl: String,
  savedJobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
});

export default mongoose.model<ICandidateProfile>("CandidateProfile", CandidateProfileSchema);
