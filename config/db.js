const mongoose = require("mongoose");

exports.connect = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DATABASE;
    if (!uri) throw new Error("Missing MONGO_URI/DATABASE in .env");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Connected to MongoDB");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Don't call process.exit(1) in serverless - let it be handled by caller
    throw err;
  }
};
