require("dotenv").config();

const { connectDB } = require("../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../lib/utils");
const otpService = require("../../services/otpService");
const User = require("../../models/userModel");
const Email = require("../../utils/sendEmail");

/**
 * Consolidated OTP Handler
 * POST /api/v1/otp (default: verify)
 * POST /api/v1/otp?action=resend (resend OTP via email)
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  if (req.method !== "POST") {
    console.log(`⚠️ Invalid HTTP method for OTP: ${req.method}`);
    return sendError(res, "Invalid request method. Only POST is allowed.", 405);
  }

  try {
    await connectDB();

    const action = req.query.action;

    // RESEND OTP
    if (action === "resend") {
      const { email } = req.body;

      if (!email) {
        return sendError(res, "Email is required", 400);
      }

      const user = await User.findOne({ email });
      if (!user) {
        return sendError(res, "User not found", 404);
      }

      // Infer type from user's verification status
      const otpType = user.isVerified ? "forgotPassword" : "register";
      console.log(`📋 Resend OTP - Type inferred as: ${otpType}`);

      let otp;
      try {
        otp = await otpService.generateOTP(otpType, user._id);
        
        // Send email based on type
        if (otpType === "forgotPassword") {
          await new Email(user, otp).sendPasswordReset();
        } else {
          await new Email(user, otp).sendWelcome();
        }

        return sendSuccess(
          res,
          { otp },
          200,
          "OTP has been sent to your email"
        );
      } catch (emailError) {
        console.error("Email send error:", emailError.message);
        await otpService.clearOTP(otpType, user._id);
        return sendError(res, "Failed to send OTP email", 500);
      }
    }

    // VERIFY OTP (default)
    const { userId, code, type, email, otp } = req.body;
    
    // Support email-only verification (infer type from user)
    if (email && (code || otp)) {
      const user = await User.findOne({ email });
      if (!user) {
        return sendError(res, "User not found", 404);
      }

      const otpCode = code || otp;
      const inferredType = user.isVerified ? "forgotPassword" : "register";
      console.log(`📋 Verify OTP - Type inferred as: ${inferredType}`);

      const isValid = await otpService.isVerify(user._id, inferredType, otpCode);
      if (!isValid) {
        return sendError(res, "Invalid or expired OTP", 400);
      }

      if (inferredType === "register") {
        await User.updateOne({ _id: user._id }, { isVerified: true });
        return sendSuccess(
          res,
          {},
          200,
          "Email verified successfully. You can now login."
        );
      }

      return sendSuccess(res, { verified: true }, 200, "OTP verified successfully");
    }

    // Legacy format (with userId)
    if (!userId || !code || !type) {
      return sendError(res, "Missing userId, code, or type", 400);
    }

    const isValid = await otpService.isVerify(userId, type, code);
    if (!isValid) {
      return sendError(res, "Invalid or expired OTP", 400);
    }

    if (type === "register") {
      await User.updateOne({ _id: userId }, { isVerified: true });
      return sendSuccess(
        res,
        {},
        200,
        "Email verified successfully. You can now login."
      );
    }

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
    console.error(`❌ OTP handler error:`, {
      action: req.query.action,
      message: error.message
    });
    return sendError(res, "An error occurred during verification. Please try again.", 500);
  }
};
