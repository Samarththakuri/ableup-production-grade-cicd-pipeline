import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/abelup";
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
