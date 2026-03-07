require("dotenv").config();

const serverless = require("serverless-http");
const mongoose = require("mongoose");
const app = require("../app");

// Cache database connection
let isDbConnected = false;

const connectDB = async () => {
  if (isDbConnected) return;
  
  try {
    const uri = process.env.MONGO_URI || process.env.DATABASE;
    if (!uri) {
      throw new Error("Missing MONGO_URI or DATABASE environment variable");
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    isDbConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isDbConnected = false;
    throw error;
  }
};

// Add middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  if (!isDbConnected) {
    try {
      await connectDB();
    } catch (error) {
      return res.status(503).json({
        status: "fail",
        message: "Database connection unavailable",
      });
    }
  }
  next();
});

// Vercel serverless handler
module.exports = serverless(app);
