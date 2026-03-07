require("dotenv").config();

const serverless = require("serverless-http");
const mongoose = require("mongoose");
const app = require("../app");

// Connection state management
let mongoConnection = null;

// Connect to MongoDB with timeout
const connectToMongo = async () => {
  if (mongoConnection) {
    return mongoConnection;
  }

  return mongoose.connect(
    process.env.MONGO_URI || process.env.DATABASE,
    {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 1,
    }
  ).then(conn => {
    mongoConnection = conn;
    return conn;
  }).catch(err => {
    console.error("💥 MongoDB failed:", err.message);
    throw err;
  });
};

// Hook into /api/v1 requests to ensure DB is ready
app.use("/api/v1", async (req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    res.status(503).json({
      status: "fail",
      message: "Service unavailable",
    });
  }
});

// Export serverless handler - Vercel will call this
module.exports = serverless(app);
