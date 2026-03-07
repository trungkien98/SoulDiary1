require("dotenv").config();

const serverless = require("serverless-http");
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

// Initialize DB before handling requests
(async () => {
  await connectDB();
})();

// Vercel serverless handler
module.exports = serverless(app);
