import { Router, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import Job from "../models/Job";
import Application from "../models/Application";
import CandidateProfile from "../models/CandidateProfile";
import User from "../models/User";
import { sendEmail, buildShortlistEmail } from "../utils/mailer";

const router = Router();
router.use(auth, requireRole("RECRUITER"));

// GET recruiter's jobs
router.get("/jobs", async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const filter: any = { recruiterId: req.user!._id };
    if (req.query.active === "true") filter.isActive = true;

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);

    // Add shortlisted counts
    const jobIds = jobs.map((j) => j._id);
    const shortlistedCounts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds }, shortlisted: true } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(shortlistedCounts.map((c) => [c._id.toString(), c.count]));

    const result = jobs.map((j) => ({
      ...j.toObject(),
      shortlistedCount: countMap.get(j._id.toString()) || 0,
    }));

    return res.json({ success: true, jobs: result, meta: { page, limit, total } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// POST create job
router.post("/jobs", async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.create({ ...req.body, recruiterId: req.user!._id });
    return res.status(201).json({ success: true, job });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET applicants for a job
router.get("/job/:jobId/applicants", async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job || job.recruiterId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const filter: any = { jobId };
    if (req.query.status) filter.status = req.query.status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("candidateId", "name email verificationStatus")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    // Attach candidate profiles
    const candidateIds = applications.map((a: any) => a.candidateId?._id).filter(Boolean);
    const profiles = await CandidateProfile.find({ userId: { $in: candidateIds } });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const result = applications.map((a: any) => ({
      ...a.toObject(),
      candidateProfile: a.candidateId ? profileMap.get(a.candidateId._id.toString()) || null : null,
    }));

    return res.json({ success: true, applications: result, meta: { page, limit, total } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT shortlist/reject application
router.put("/application/:applicationId/shortlist", async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { shortlisted, reason } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(application.jobId);
    if (!job || job.recruiterId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.shortlisted = !!shortlisted;
    application.status = shortlisted ? "SHORTLISTED" : "REJECTED";
    application.shortlistReason = reason || undefined;
    application.shortlistedBy = req.user!._id as any;
    application.updatedAt = new Date();
    await application.save();

    // Send email notification if shortlisted
    if (shortlisted) {
      try {
        const candidate = await User.findById(application.candidateId);
        const job = await Job.findById(application.jobId);
        if (candidate?.email && job) {
          const { subject, html } = buildShortlistEmail(candidate.name, job.title);
          sendEmail({ to: candidate.email, subject, html }); // fire-and-forget
        }
      } catch (emailErr) {
        console.error("[Recruiter] Email notification error:", emailErr);
      }
    }

    return res.json({ success: true, application });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET job summary
router.get("/job/:jobId/summary", async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job || job.recruiterId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [total, shortlisted] = await Promise.all([
      Application.countDocuments({ jobId }),
      Application.countDocuments({ jobId, shortlisted: true }),
    ]);

    return res.json({ success: true, applicantsCount: total, shortlistedCount: shortlisted });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
