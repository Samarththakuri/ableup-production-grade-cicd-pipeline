import { Router, Response } from "express";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { uploadResume } from "../middleware/upload";
import Application from "../models/Application";
import CandidateProfile from "../models/CandidateProfile";
import Job from "../models/Job";

const router = Router();
router.use(auth, requireRole("CANDIDATE"));

// GET applied jobs
router.get("/applied", async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find({ candidateId: req.user!._id })
        .populate("jobId", "title location remote salaryMin salaryMax isActive")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit),
      Application.countDocuments({ candidateId: req.user!._id }),
    ]);

    return res.json({ success: true, applications, meta: { page, limit, total } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET saved jobs
router.get("/saved", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user!._id }).populate(
      "savedJobs",
      "title location remote salaryMin salaryMax isActive recruiterId"
    );
    return res.json({ success: true, savedJobs: profile?.savedJobs || [] });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// POST toggle save job
router.post("/save/:jobId", async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const profile = await CandidateProfile.findOne({ userId: req.user!._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const idx = profile.savedJobs.findIndex((id) => id.toString() === jobId);
    if (idx > -1) {
      profile.savedJobs.splice(idx, 1);
      await profile.save();
      return res.json({ success: true, saved: false });
    } else {
      profile.savedJobs.push(job._id as any);
      await profile.save();
      return res.json({ success: true, saved: true });
    }
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// POST apply to job
router.post("/apply/:jobId", async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.verificationStatus !== "VERIFIED") {
      return res.status(403).json({ message: "Complete UDID verification to apply." });
    }

    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) return res.status(404).json({ message: "Job not found or inactive" });

    const existing = await Application.findOne({ jobId, candidateId: req.user!._id });
    if (existing) return res.status(409).json({ message: "Already applied" });

    const application = await Application.create({
      jobId,
      candidateId: req.user!._id,
      coverLetter: req.body.coverLetter,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    return res.status(201).json({ success: true, application });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// POST upload resume
router.post("/resume", (req: AuthRequest, res: Response) => {
  uploadResume(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    await CandidateProfile.findOneAndUpdate({ userId: req.user!._id }, { resumeUrl }, { upsert: true });
    return res.json({ success: true, resumeUrl });
  });
});

// GET profile
router.get("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user!._id });
    return res.json({
      success: true,
      user: {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        verificationStatus: req.user!.verificationStatus,
      },
      profile: profile || {},
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT update profile
router.put("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const { name, disabilityType, preferredWorkHours } = req.body;
    if (name) {
      req.user!.name = name;
      await req.user!.save();
    }
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user!._id },
      { disabilityType, preferredWorkHours },
      { new: true, upsert: true }
    );
    return res.json({ success: true, profile });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
