require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const { protect } = require("../../../lib/auth");
const User = require("../../../models/userModel");

/**
 * GET /api/v1/users/profile - Get current user profile
 * PUT /api/v1/users/profile - Update user profile
 */
export default async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    // Connect to database
    await connectDB();

    // Protect route
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

    return sendError(res, "Method not allowed", 405);
  } catch (error) {
    if (error.statusCode === 401) {
      return sendError(res, error.message, 401);
    }
    console.error("User profile handler error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
