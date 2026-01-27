const mongoose = require("mongoose");

exports.connect = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DATABASE;
    if (!uri) throw new Error("Missing MONGO_URI/DATABASE in .env");

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};
