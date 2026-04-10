import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db";
import bcrypt from "bcryptjs";
import User from "./models/User";
import CandidateProfile from "./models/CandidateProfile";
import Job from "./models/Job";

const seed = async () => {
  await connectDB();
  console.log("Seeding database...");

  // Clear existing
  await User.deleteMany({});
  await CandidateProfile.deleteMany({});
  await Job.deleteMany({});

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // Create users
  const candidate = await User.create({
    name: "Rahul Sharma",
    email: "candidate@abelup.com",
    password: hash("candidate123"),
    role: "CANDIDATE",
    verificationStatus: "VERIFIED",
  });

  const recruiter = await User.create({
    name: "Priya Patel",
    email: "recruiter@abelup.com",
    password: hash("recruiter123"),
    role: "RECRUITER",
    verificationStatus: "VERIFIED",
  });

  await User.create({
    name: "Admin User",
    email: "admin@abelup.com",
    password: hash("admin123"),
    role: "ADMIN",
    verificationStatus: "VERIFIED",
  });

  // Candidate profile
  await CandidateProfile.create({
    userId: candidate._id,
    disabilityType: "Locomotor Disability",
    udidNumber: "MH1234567890",
  });

  // Sample jobs
  const jobs = await Job.insertMany([
    {
      recruiterId: recruiter._id,
      title: "Frontend Developer",
      description: "Build accessible web interfaces with React and TypeScript.",
      salaryMin: 600000,
      salaryMax: 1200000,
      location: "Mumbai",
      remote: true,
      disabilityEligible: ["Locomotor Disability", "Visual Impairment"],
      accessibilityFeatures: ["Screen reader compatible", "Flexible hours"],
      isActive: true,
    },
    {
      recruiterId: recruiter._id,
      title: "Data Entry Specialist",
      description: "Process and verify data with attention to detail.",
      salaryMin: 300000,
      salaryMax: 500000,
      location: "Delhi",
      remote: false,
      disabilityEligible: ["Hearing Impairment", "Locomotor Disability"],
      accessibilityFeatures: ["Wheelchair accessible", "Visual alerts"],
      isActive: true,
    },
    {
      recruiterId: recruiter._id,
      title: "Customer Support Executive",
      description: "Handle customer inquiries via chat and email.",
      salaryMin: 350000,
      salaryMax: 550000,
      location: "Bangalore",
      remote: true,
      disabilityEligible: ["Locomotor Disability", "Multiple Disabilities"],
      accessibilityFeatures: ["Work from home", "Flexible schedule"],
      isActive: true,
    },
  ]);

  console.log(`Seeded: 3 users, 1 profile, ${jobs.length} jobs`);
  process.exit(0);
};

seed();
