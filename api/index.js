require("dotenv").config();

const serverless = require("serverless-http");
const mongoose = require("mongoose");
const app = require("../app");

// Cache for database connection
let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  // Return cached connection if already connected
  if (cachedConnection) {
    return cachedConnection;
  }

  // Return pending connection promise if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create new connection
  connectionPromise = (async () => {
    try {
      const uri = process.env.MONGO_URI || process.env.DATABASE;
      if (!uri) {
        throw new Error("Missing MONGO_URI or DATABASE environment variable");
      }

      console.log("🔄 Connecting to MongoDB...");
      
      const connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000,
        maxPoolSize: 1, // Limit pool size for serverless
      });

      cachedConnection = connection;
      console.log("✅ MongoDB connected");
      return connection;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      connectionPromise = null; // Reset promise on failure
      throw error;
    }
  })();

  return connectionPromise;
};

// Middleware to ensure DB is connected for API routes (but not health checks)
app.use("/api/v1", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ DB connection failed for request:", error.message);
    return res.status(503).json({
      status: "fail",
      message: "Database service temporarily unavailable",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Vercel serverless handler
module.exports = serverless(app);
