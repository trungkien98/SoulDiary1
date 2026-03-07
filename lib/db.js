const mongoose = require("mongoose");

let cachedConnection = null;

/**
 * Connect to MongoDB with caching for Vercel serverless
 * Reuses connection across function invocations
 */
const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI || process.env.DATABASE;
  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 1,
    });
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = { connectDB };
