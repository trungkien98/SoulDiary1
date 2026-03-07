require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const AppError = require("../../../utils/appError");
const otpService = require("../../../services/otpService");
const authService = require("../../../services/authService");
const Email = require("../../../utils/sendEmail");
const User = require("../../../models/userModel");

/**
 * POST /api/v1/auth/register
 * Register a new user with email and password
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

    const { email, password, name } = req.body;

    // Validate inputs
    if (!email || !password) {
      return sendError(res, "Thiếu email hoặc password", 400);
    }

    // Check if user exists
    const existed = await authService.findUser(email);
    if (existed) {
      return sendError(res, "Email đã tồn tại", 409);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate and send OTP
    const otp = await otpService.generateOTP("register", user._id);
    await new Email(user, otp).sendWelcome();

    return sendSuccess(
      res,
      { email: user.email },
      201,
      "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
    );
  } catch (error) {
    console.error("Register error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
