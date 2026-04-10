import { Router, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import CandidateProfile from "../models/CandidateProfile";
import { sendEmail, buildVerificationEmail } from "../utils/mailer";

const router = Router();
router.use(auth, requireRole("ADMIN"));

// POST create user with default password
router.post("/create-user", async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ message: "name, email, role required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const tempPassword = crypto.randomBytes(8).toString("base64").slice(0, 12);
    const hashed = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      verificationStatus: role === "CANDIDATE" ? "PENDING" : "VERIFIED",
      forcePasswordChange: true,
    });

    if (role === "CANDIDATE") {
      await CandidateProfile.create({ userId: user._id });
    }

    return res.status(201).json({ success: true, user: { id: user._id, name, email, role }, tempPassword });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT verify candidate
router.put("/verify/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // "VERIFIED" | "REJECTED"
    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await User.findByIdAndUpdate(req.params.userId, { verificationStatus: status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send email notification if verified
    if (status === "VERIFIED") {
      try {
        const { subject, html } = buildVerificationEmail(user.name);
        sendEmail({ to: user.email, subject, html });
      } catch (emailErr) {
        console.error("[Admin] Verification email error:", emailErr);
      }
    }

    return res.json({ success: true, user: { id: user._id, verificationStatus: user.verificationStatus } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// GET all users (paginated)
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: any = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    // Enrich candidate users with profile data (UDID, disability type)
    const enriched = await Promise.all(
      users.map(async (u: any) => {
        if (u.role === "CANDIDATE") {
          const profile = await CandidateProfile.findOne({ userId: u._id }).lean();
          return { ...u, udidNumber: profile?.udidNumber, disabilityType: profile?.disabilityType };
        }
        return u;
      })
    );

    return res.json({ success: true, users: enriched, meta: { page, limit, total } });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT force password reset
router.put("/user/:userId/force-reset", async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { forcePasswordChange: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ success: true, message: "User must change password on next login" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
