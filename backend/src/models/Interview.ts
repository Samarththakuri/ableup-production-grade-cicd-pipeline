import mongoose, { Schema, Document, Types } from "mongoose";

export type InterviewStatus = "SCHEDULED" | "ACCEPTED" | "RESCHEDULE_REQUESTED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED";

export interface IInterview extends Document {
  applicationId: Types.ObjectId;
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  scheduledAt: Date;
  duration: number; // minutes
  mode: "ONLINE" | "IN_PERSON" | "PHONE";
  location?: string; // meeting link or physical address
  notes?: string;
  status: InterviewStatus;
  candidateMessage?: string; // message when requesting reschedule
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>({
  applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  mode: { type: String, enum: ["ONLINE", "IN_PERSON", "PHONE"], default: "ONLINE" },
  location: String,
  notes: String,
  status: {
    type: String,
    enum: ["SCHEDULED", "ACCEPTED", "RESCHEDULE_REQUESTED", "RESCHEDULED", "COMPLETED", "CANCELLED"],
    default: "SCHEDULED",
  },
  candidateMessage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

InterviewSchema.index({ applicationId: 1 }, { unique: true });

export default mongoose.model<IInterview>("Interview", InterviewSchema);
