require("dotenv").config();

const { handleCORS, sendSuccess } = require("../../lib/utils");

/**
 * GET /api/health
 * Health check endpoint - responds immediately without DB check
 */
export default async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  return sendSuccess(
    res,
    {
      status: "operational",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    200,
    "Soul Diary API is running"
  );
};
