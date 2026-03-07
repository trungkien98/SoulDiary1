require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");

/**
 * POST /api/v1/auth/logout
 * Logout user (clear tokens)
 */
export default async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Only accept POST
  if (req.method !== "POST") {
    return sendError(res, "Method not allowed", 405);
  }

  try {
    // Clear refresh token cookie
    res.setHeader(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    );

    return sendSuccess(res, {}, 200, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return sendError(res, error.message || "Logout failed", 500);
  }
};
