require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const { protect } = require("../../../lib/auth");
const User = require("../../../models/userModel");
const tokenService = require("../../../services/tokenService");

/**
 * PATCH /api/v1/users/updateMyPassword
 * Update user password
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Only handle PATCH requests
  if (req.method !== "PATCH") {
    return sendError(res, "Method not allowed", 405);
  }

  try {
    await connectDB();
    const user = await protect(req);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return sendError(res, "Vui lòng nhập currentPassword và newPassword", 400);
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return sendError(res, "confirmPassword không khớp", 400);
    }

    // Get user with password field
    const userWithPassword = await User.findById(user._id).select("+password");

    if (!userWithPassword) {
      return sendError(res, "User không tồn tại", 404);
    }

    // Check if user has password (not social login)
    if (!userWithPassword.password) {
      return sendError(
        res,
        "Tài khoản Google/Facebook chưa có mật khẩu. Hãy tạo mật khẩu trước.",
        400
      );
    }

    // Verify current password
    const isPasswordCorrect = await userWithPassword.correctPassword(
      currentPassword,
      userWithPassword.password
    );

    if (!isPasswordCorrect) {
      return sendError(res, "Mật khẩu hiện tại không đúng", 401);
    }

    // Update password
    userWithPassword.password = newPassword;
    userWithPassword.isUpdatePassword = true;
    await userWithPassword.save();

    // Generate new access token
    const access_token = tokenService.signAccessToken(userWithPassword);

    return sendSuccess(
      res,
      {
        token: { access_token },
      },
      200,
      "Đổi mật khẩu thành công"
    );
  } catch (error) {
    if (error.statusCode === 401) return sendError(res, error.message, 401);
    console.error("Update password error:", error);
    return sendError(res, error.message || "Failed to update password", 500);
  }
};
