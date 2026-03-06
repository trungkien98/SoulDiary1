require("dotenv").config();

const database = require("../config/db");
const app = require("../app");

// Initialize database connection
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return;
  try {
    await database.connect();
    dbConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

// Vercel serverless handler
module.exports = async (req, res) => {
  // Initialize DB on first request
  if (!dbConnected) {
    await connectDB();
  }

  // Handle the request through the Express app
  return app(req, res);
};
