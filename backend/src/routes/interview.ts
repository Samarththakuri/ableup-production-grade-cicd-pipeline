import { Router, Response } from "express";
import { auth, AuthRequest } from "../middleware/auth";
import Interview from "../models/Interview";
import Application from "../models/Application";
import Job from "../models/Job";
import User from "../models/User";
import { sendEmail, buildInterviewScheduledEmail, buildInterviewRescheduleRequestEmail, buildInterviewAcceptedEmail } from "../utils/mailer";

const router = Router();
router.use(auth);

// POST schedule interview (recruiter only)
router.post("/schedule", async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "RECRUITER") return res.status(403).json({ message: "Not authorized" });

    const { applicationId, scheduledAt, duration, mode, location, notes } = req.body;
    if (!applicationId || !scheduledAt) {
      return res.status(400).json({ message: "applicationId and scheduledAt are required" });
    }

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.status !== "SHORTLISTED") {
      return res.status(400).json({ message: "Can only schedule interviews for shortlisted candidates" });
    }

    const job = await Job.findById(application.jobId);
    if (!job || job.recruiterId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if interview already exists
    const existing = await Interview.findOne({ applicationId });
    if (existing) {
      // Update existing interview (reschedule)
      existing.scheduledAt = new Date(scheduledAt);
      existing.duration = duration || 30;
      existing.mode = mode || "ONLINE";
      existing.location = location;
      existing.notes = notes;
      existing.status = existing.status === "RESCHEDULE_REQUESTED" ? "RESCHEDULED" : "SCHEDULED";
      existing.updatedAt = new Date();
      await existing.save();

      // Notify candidate
      try {
        const candidate = await User.findById(application.candidateId);
        if (candidate?.email) {
          const { subject, html } = buildInterviewScheduledEmail(
            candidate.name, job.title, new Date(scheduledAt), duration || 30, mode || "ONLINE", location
          );
          sendEmail({ to: candidate.email, subject, html });
        }
      } catch (e) { console.error("[Interview] Email error:", e); }

      return res.json({ success: true, interview: existing });
    }

    const interview = await Interview.create({
      applicationId,
      jobId: application.jobId,
      candidateId: application.candidateId,
      recruiterId: req.user!._id,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      mode: mode || "ONLINE",
      location,
      notes,
    });

    // Notify candidate via email
    try {
      const candidate = await User.findById(application.candidateId);
      if (candidate?.email) {
        const { subject, html } = buildInterviewScheduledEmail(
          candidate.name, job.title, new Date(scheduledAt), duration || 30, mode || "ONLINE", location
        );
        sendEmail({ to: candidate.email, subject, html });
      }
    } catch (e) { console.error("[Interview] Email error:", e); }

    return res.status(201).json({ success: true, interview });
  } catch (err) {
    console.error("[Interview] Schedule error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT candidate responds to interview (accept or request reschedule)
router.put("/:interviewId/respond", async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== "CANDIDATE") return res.status(403).json({ message: "Not authorized" });

    const { action, message } = req.body; // action: "accept" | "reschedule"
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (interview.candidateId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (action === "accept") {
      interview.status = "ACCEPTED";
    } else if (action === "reschedule") {
      interview.status = "RESCHEDULE_REQUESTED";
      interview.candidateMessage = message || "Requesting a different time slot";
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'accept' or 'reschedule'" });
    }

    interview.updatedAt = new Date();
    await interview.save();

    // Notify recruiter
    try {
      const recruiter = await User.findById(interview.recruiterId);
      const candidate = await User.findById(interview.candidateId);
      const job = await Job.findById(interview.jobId);
      if (recruiter?.email && candidate && job) {
        if (action === "accept") {
          const { subject, html } = buildInterviewAcceptedEmail(
            recruiter.name, candidate.name, job.title, interview.scheduledAt
          );
          sendEmail({ to: recruiter.email, subject, html });
        } else if (action === "reschedule") {
          const { subject, html } = buildInterviewRescheduleRequestEmail(
            recruiter.name, candidate.name, job.title, message || "Requesting a different time slot"
          );
          sendEmail({ to: recruiter.email, subject, html });
        }
      }
    } catch (e) { console.error("[Interview] Email error:", e); }

    return res.json({ success: true, interview });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET interviews for current user
router.get("/my", async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.user!.role === "CANDIDATE"
      ? { candidateId: req.user!._id }
      : { recruiterId: req.user!._id };

    const interviews = await Interview.find(filter)
      .populate("jobId", "title location")
      .populate("candidateId", "name email")
      .populate("applicationId", "status")
      .sort({ scheduledAt: 1 });

    return res.json({ success: true, interviews });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET interview for a specific application
router.get("/application/:applicationId", async (req: AuthRequest, res: Response) => {
  try {
    const interview = await Interview.findOne({ applicationId: req.params.applicationId });
    return res.json({ success: true, interview: interview || null });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
