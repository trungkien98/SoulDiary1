require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const authService = require("../../../services/authService");
const User = require("../../../models/userModel");

/**
 * POST /api/v1/auth/login
 * Login with email and password
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

    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return sendError(res, "Thiếu email hoặc password", 400);
    }

    // Find user
    const user = await authService.findUser(email, "+password");
    if (!user || !user.password) {
      return sendError(res, "Sai email hoặc mật khẩu", 401);
    }

    // Check if verified
    if (!user.isVerified) {
      return sendError(res, "Tài khoản chưa được xác thực", 401);
    }

    // Check password
    const ok = await user.correctPassword(password, user.password);
    if (!ok) {
      return sendError(res, "Sai email hoặc mật khẩu", 401);
    }

    // Create tokens
    const tokenService = require("../../../services/tokenService");
    const tokens = tokenService.signTokens(user);
    
    // Save refresh token to database
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });
    
    // Set refresh token as HTTP-only cookie (Vercel serverless compatible)
    res.setHeader(
      "Set-Cookie",
      `refreshToken=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/`
    );

    return sendSuccess(
      res,
      {
        token: tokens,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
        },
      },
      200,
      "Đăng nhập thành công"
    );
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
