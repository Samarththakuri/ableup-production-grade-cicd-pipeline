import { Router, Request, Response } from "express";
import Job from "../models/Job";

const router = Router();

// GET public job search
router.get("/search", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const filter: any = { isActive: true };

    if (req.query.q) {
      filter.$or = [
        { title: { $regex: req.query.q, $options: "i" } },
        { description: { $regex: req.query.q, $options: "i" } },
      ];
    }
    if (req.query.location) filter.location = { $regex: req.query.location, $options: "i" };
    if (req.query.remote === "true") filter.remote = true;
    if (req.query.disability) filter.disabilityEligible = { $in: [req.query.disability] };

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);

    return res.json({ success: true, jobs, meta: { page, limit, total } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET single job
router.get("/:jobId", async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.jobId).populate("recruiterId", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json({ success: true, job });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
