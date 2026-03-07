require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const tokenService = require("../../../services/tokenService");
const User = require("../../../models/userModel");

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
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
    // Connect to database
    await connectDB();

    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, "Thiếu refreshToken", 400);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    // Generate new access token
    const newAccessToken = tokenService.signAccessToken(user);

    return sendSuccess(
      res,
      {
        token: {
          access_token: newAccessToken,
          refresh_token: refreshToken,
        },
      },
      200,
      "Token refreshed successfully"
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return sendError(res, "Token refresh failed", 401);
  }
};
