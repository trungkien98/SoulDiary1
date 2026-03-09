require("dotenv").config();

const { connectDB } = require("../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../lib/utils");
const { protect } = require("../../lib/auth");
const User = require("../../models/userModel");

/**
 * Consolidated User Handler
 * GET /api/v1/users/profile
 * PUT /api/v1/users/profile
 * 
 * Password change is handled separately at:
 * PATCH /api/v1/users/updateMyPassword
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    await connectDB();
    const user = await protect(req);
    console.log(`👤 User profile request - User: ${user._id}`);

    // GET - Fetch user profile
    if (req.method === "GET") {
      try {
        console.log(`📖 Fetching profile for user: ${user._id}`);
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
          "Your profile has been retrieved successfully."
        );
      } catch (error) {
        console.error(`❌ Get profile error for user ${user._id}:`, error);
        return sendError(res, "Unable to fetch your profile. Please try again later.", 500);
      }
    }

    // PUT - Update user profile
    if (req.method === "PUT") {
      try {
        const { name, photo } = req.body;
        console.log(`🔄 Updating profile for user ${user._id} - name: ${!!name}, photo: ${!!photo}`);
        
        if (name) {
          if (typeof name !== 'string' || name.trim().length === 0) {
            console.log(`⚠️ Invalid name provided`);
            return sendError(res, "Name must be a valid non-empty string.", 400);
          }
          user.name = name.trim();
          console.log(`✅ Name updated to: ${user.name}`);
        }
        
        if (photo) {
          user.photo = photo;
          console.log(`✅ Photo updated`);
        }
        
        await user.save();
        console.log(`✅ Profile saved successfully for user: ${user._id}`);

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
          "Your profile has been updated successfully."
        );
      } catch (error) {
        console.error(`❌ Update profile error for user ${user._id}:`, {
          message: error.message,
          statusCode: error.statusCode
        });
        return sendError(res, "Unable to update your profile. Please try again.", 500);
      }
    }

    console.log(`⚠️ Invalid HTTP method: ${req.method}`);
    return sendError(res, "Invalid request method. Please use GET or PUT.", 405);
  } catch (error) {
    if (error.statusCode === 401) {
      console.log(`🔒 Unauthorized access attempt: ${error.message}`);
      return sendError(res, error.message, 401);
    }
    console.error(`❌ User handler error:`, {
      message: error.message,
      statusCode: error.statusCode || 500
    });
    return sendError(res, "An unexpected error occurred. Please try again later.", 500);
  }
};
