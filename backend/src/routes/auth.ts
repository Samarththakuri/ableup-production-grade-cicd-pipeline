import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import CandidateProfile from "../models/CandidateProfile";
import { auth, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  role: z.enum(["CANDIDATE", "RECRUITER"]),
  disabilityType: z.string().optional(),
  udidNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Block admin registration
    if ((data.role as string).toUpperCase() === "ADMIN") {
      return res.status(403).json({ message: "Admin accounts cannot be registered. Contact system administrator." });
    }

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      verificationStatus: data.role === "CANDIDATE" ? "PENDING" : "VERIFIED",
    });

    if (data.role === "CANDIDATE") {
      await CandidateProfile.create({
        userId: user._id,
        disabilityType: data.disabilityType,
        udidNumber: data.udidNumber,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        forcePasswordChange: user.forcePasswordChange,
      },
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ message: "Validation error", errors: err.errors });
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const isAdminAttempt = data.email.toLowerCase().includes("admin") || req.body.isAdminLogin;

    const user = await User.findOne({ email: data.email });
    if (!user) {
      if (isAdminAttempt || req.body.role === "admin") {
        return res.status(401).json({ code: "INVALID_ADMIN", message: "Invalid admin credentials." });
      }
      return res.status(404).json({ code: "USER_NOT_FOUND", message: "No account found with this email. You are a new user. Kindly register first." });
    }

    // If user is admin, always return admin-specific error on failure
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      if (user.role === "ADMIN") {
        return res.status(401).json({ code: "INVALID_ADMIN", message: "Invalid admin credentials." });
      }
      return res.status(401).json({ code: "INVALID_PASSWORD", message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    let profile = null;
    if (user.role === "CANDIDATE") {
      profile = await CandidateProfile.findOne({ userId: user._id });
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        forcePasswordChange: user.forcePasswordChange,
        disabilityType: profile?.disabilityType,
        udidNumber: profile?.udidNumber,
      },
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ message: "Validation error" });
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/change-password", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Invalid password data" });
    }
    const user = await User.findById(req.user!._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.forcePasswordChange = false;
    await user.save();

    return res.json({ success: true, message: "Password changed" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
