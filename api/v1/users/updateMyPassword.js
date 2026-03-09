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
    console.log(`⚠️ Invalid HTTP method: ${req.method}`);
    return sendError(res, "Invalid request method. Only PATCH is allowed.", 405);
  }

  try {
    await connectDB();
    const user = await protect(req);
    console.log(`🔐 Password change requested for user: ${user._id}`);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    console.log(`📝 Validating password fields - newPassword provided: ${!!newPassword}, confirmPassword provided: ${!!confirmPassword}`);
    
    if (!newPassword) {
      console.log(`⚠️ Validation failed: newPassword is missing`);
      return sendError(res, "Please enter a new password. Password is required.", 400);
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      console.log(`⚠️ Validation failed: newPassword and confirmPassword don't match`);
      return sendError(res, "The new passwords do not match. Please make sure both passwords are identical.", 400);
    }
    
    console.log(`✅ Password validation passed`);

    // Get user with password field
    const userWithPassword = await User.findById(user._id).select("+password");

    if (!userWithPassword) {
      console.log(`❌ User not found: ${user._id}`);
      return sendError(res, "Your account could not be found. Please try logging in again.", 404);
    }

    // If user has a password, verify the current password before changing
    const hasExistingPassword = !!userWithPassword.password;
    console.log(`🔑 User has existing password: ${hasExistingPassword}`);
    
    if (hasExistingPassword) {
      // User has existing password - must verify current password
      if (!currentPassword) {
        console.log(`⚠️ currentPassword required but not provided`);
        return sendError(res, "Please enter your current password to verify your identity before changing it.", 400);
      }
      
      console.log(`🔍 Verifying currentPassword...`);
      // Verify current password
      const isPasswordCorrect = await userWithPassword.correctPassword(
        currentPassword,
        userWithPassword.password
      );

      if (!isPasswordCorrect) {
        console.log(`❌ currentPassword verification failed - incorrect password`);
        return sendError(res, "The current password you entered is incorrect. Please try again.", 401);
      }
      console.log(`✅ currentPassword verified successfully`);
    } else {
      // User doesn't have a password yet (social account or password reset)
      // In this case, they're setting a password for the first time
      // No need to verify current password
      console.log(`ℹ️ User setting password for first time (no existing password)`);
    }

    // Update password
    console.log(`🔄 Updating newPassword...`);
    userWithPassword.password = newPassword;
    userWithPassword.isUpdatePassword = true;
    await userWithPassword.save();
    console.log(`✅ Password updated successfully`);

    // Generate new access token
    console.log(`🎫 Generating new access token...`);
    const access_token = tokenService.signAccessToken(userWithPassword);
    console.log(`✅ New access token generated - user: ${user._id}`);

    return sendSuccess(
      res,
      {
        token: { access_token },
      },
      200,
      "Your password has been changed successfully. You've been logged in with the new credentials."
    );
  } catch (error) {
    console.error(`❌ Password change error:`, {
      userId: error.userId || 'unknown',
      message: error.message,
      statusCode: error.statusCode || 500
    });
    
    if (error.statusCode === 401) {
      return sendError(res, error.message, 401);
    }
    
    // Provide user-friendly error message for unexpected errors
    const userMessage = error.message?.includes('password') 
      ? `Password update failed: ${error.message}`
      : "An unexpected error occurred while updating your password. Please try again later.";
    
    return sendError(res, userMessage, 500);
  }
};
