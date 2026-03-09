require("dotenv").config();

const { connectDB } = require("../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../lib/utils");
const { protect } = require("../../lib/auth");
const User = require("../../models/userModel");
const tokenService = require("../../services/tokenService");

/**
 * Consolidated User Handler
 * GET/PUT /api/v1/users/profile
 * PATCH /api/v1/users/updateMyPassword
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    await connectDB();
    const user = await protect(req);

    // GET - Fetch user profile
    if (req.method === "GET") {
      try {
        return sendSuccess(
          res,
          {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              photo: user.photo,
              role: user.role,
              isVerified: user.isVerified,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
          },
          200,
          "Profile retrieved"
        );
      } catch (error) {
        console.error("Get profile error:", error);
        return sendError(res, "Failed to fetch profile", 500);
      }
    }

    // PUT - Update user profile
    if (req.method === "PUT") {
      try {
        const { name, photo } = req.body;
        if (name) user.name = name;
        if (photo) user.photo = photo;
        await user.save();

        return sendSuccess(
          res,
          {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              photo: user.photo,
              role: user.role,
            },
          },
          200,
          "Profile updated successfully"
        );
      } catch (error) {
        console.error("Update profile error:", error);
        return sendError(res, error.message || "Failed to update profile", 500);
      }
    }

    // PATCH - Update password
    if (req.method === "PATCH") {
      try {
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
        console.error("Update password error:", error);
        return sendError(res, error.message || "Failed to update password", 500);
      }
    }

    return sendError(res, "Method not allowed", 405);
  } catch (error) {
    if (error.statusCode === 401) return sendError(res, error.message, 401);
    console.error("User handler error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
