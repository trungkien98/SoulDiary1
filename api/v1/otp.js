require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const otpService = require("../../../services/otpService");
const User = require("../../../models/userModel");

/**
 * Consolidated OTP Handler
 * POST /api/v1/otp/verify
 */
export default async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  if (req.method !== "POST") {
    return sendError(res, "Method not allowed", 405);
  }

  try {
    await connectDB();

    const { userId, code, type } = req.body;
    if (!userId || !code || !type) {
      return sendError(res, "Missing userId, code, or type", 400);
    }

    // Verify OTP
    const verifiedOtp = await otpService.verifyOTP(userId, code, type);
    if (!verifiedOtp) {
      return sendError(res, "Invalid or expired OTP", 400);
    }

    // Update user based on type
    if (type === "register") {
      await User.updateOne({ _id: userId }, { isVerified: true });
      return sendSuccess(
        res,
        {},
        200,
        "Email verified successfully. You can now login."
      );
    }

    // For password reset, return a flag
    if (type === "forgot_password") {
      return sendSuccess(
        res,
        { verified: true },
        200,
        "OTP verified. You can now reset your password."
      );
    }

    return sendSuccess(res, {}, 200, "OTP verified successfully");
  } catch (error) {
    console.error("OTP verify error:", error);
    return sendError(res, error.message || "OTP verification failed", 500);
  }
};
