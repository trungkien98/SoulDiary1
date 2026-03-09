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
      console.log(`📧 OTP resend request - email: ${email}`);

      if (!email) {
        console.log(`⚠️ Resend failed - email not provided`);
        return sendError(res, "Email is required to resend the verification code.", 400);
      }

      const user = await User.findOne({ email });
      if (!user) {
        console.log(`ℹ️ Resend OTP - email not found: ${email}`);
        // Don't reveal if email exists for security
        return sendSuccess(res, {}, 200, "If this email is registered, a verification code will be sent.");
      }

      // Infer type from user's verification status
      const otpType = user.isVerified ? "forgotPassword" : "register";
      console.log(`📋 OTP type inferred: ${otpType} - email: ${email}`);

      let otp;
      try {
        otp = await otpService.generateOTP(otpType, user._id);
        console.log(`✅ OTP generated - user: ${user._id}`);
        
        // Send email based on type
        if (otpType === "forgotPassword") {
          console.log(`📧 Sending password reset email to: ${email}`);
          await new Email(user, otp).sendPasswordReset();
        } else {
          console.log(`📧 Sending verification email to: ${email}`);
          await new Email(user, otp).sendWelcome();
        }
        
        console.log(`✅ Email sent successfully - email: ${email}`);

        return sendSuccess(
          res,
          { otp },
          200,
          "A verification code has been sent to your email. Please check your inbox."
        );
      } catch (emailError) {
        console.error(`❌ Email send error - email: ${email}:`, emailError.message);
        await otpService.clearOTP(otpType, user._id);
        return sendError(res, "Unable to send verification code. Please try again later.", 500);
      }
    }

    // VERIFY OTP (default)
    const { userId, code, type, email, otp } = req.body;
    
    // Support email-only verification (infer type from user)
    if (email && (code || otp)) {
      console.log(`🔐 OTP verification attempt - email: ${email}`);
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`⚠️ OTP verification failed - user not found: ${email}`);
        return sendError(res, "User account not found.", 404);
      }

      const otpCode = code || otp;
      const inferredType = user.isVerified ? "forgotPassword" : "register";
      console.log(`📋 OTP type inferred: ${inferredType}`);

      const isValid = await otpService.isVerify(user._id, inferredType, otpCode);
      if (!isValid) {
        console.log(`⚠️ OTP verification failed - invalid or expired code - email: ${email}`);
        return sendError(res, "The verification code is invalid or has expired. Please request a new code.", 400);
      }

      if (inferredType === "register") {
        console.log(`✅ Email verified - user: ${user._id}`);
        await User.updateOne({ _id: user._id }, { isVerified: true });
        return sendSuccess(
          res,
          {},
          200,
          "Your email has been verified successfully. You can now log in to your account."
        );
      }

      console.log(`✅ OTP verified for password reset - user: ${user._id}`);
      return sendSuccess(res, { verified: true }, 200, "Your identity has been verified. You can now reset your password.");
    }

    // Legacy format (with userId)
    if (!userId || !code || !type) {
      console.log(`⚠️ OTP verification failed - missing userId, code, or type`);
      return sendError(res, "User ID, verification code, and type are required.", 400);
    }

    console.log(`🔐 OTP verification attempt - userId: ${userId}, type: ${type}`);
    const isValid = await otpService.isVerify(userId, type, code);
    if (!isValid) {
      console.log(`⚠️ OTP verification failed - invalid or expired code`);
      return sendError(res, "The verification code is invalid or has expired. Please request a new code.", 400);
    }

    if (type === "register") {
      console.log(`✅ Email verified - user: ${userId}`);
      await User.updateOne({ _id: userId }, { isVerified: true });
      return sendSuccess(
        res,
        {},
        200,
        "Your email has been verified successfully. You can now log in to your account."
      );
    }

    if (type === "forgot_password") {
      console.log(`✅ OTP verified for password reset - user: ${userId}`);
      return sendSuccess(
        res,
        { verified: true },
        200,
        "Your identity has been verified. You can now reset your password."
      );
    }

    console.log(`✅ OTP verified - user: ${userId}`);
    return sendSuccess(res, {}, 200, "Verification code has been verified successfully.");
  } catch (error) {
    console.error(`❌ OTP handler error:`, {
      action: req.query.action,
      message: error.message
    });
    return sendError(res, "An error occurred during verification. Please try again.", 500);
  }
};
