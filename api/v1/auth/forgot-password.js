require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const otpService = require("../../../services/otpService");
const authService = require("../../../services/authService");
const Email = require("../../../utils/sendEmail");

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset (sends OTP to email)
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

    const { email } = req.body;
    if (!email) {
      return sendError(res, "Thiếu email", 400);
    }

    // Find user
    const user = await authService.findUser(email);
    if (!user) {
      return sendError(res, "Người dùng không tồn tại", 404);
    }

    // Generate and send OTP
    const otp = await otpService.generateOTP("forgot_password", user._id);
    await new Email(user, otp).sendPasswordReset();

    return sendSuccess(
      res,
      { email: user.email },
      200,
      "OTP sent to your email"
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return sendError(res, error.message || "Failed to send reset OTP", 500);
  }
};
