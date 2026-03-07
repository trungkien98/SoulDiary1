require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const socialService = require("../../../services/socialService");
const authService = require("../../../services/authService");
const User = require("../../../models/userModel");

/**
 * POST /api/v1/auth/facebook
 * Login with Facebook OAuth
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

    const { accessToken } = req.body;
    if (!accessToken) {
      return sendError(res, "Thiếu accessToken", 400);
    }

    // Verify Facebook access token
    const profile = await socialService.verifyFacebookToken(accessToken);

    const facebookId = profile.id;
    const email = profile.email;
    const name = profile.name;
    const photo = profile.picture?.data?.url;

    // Find or create user
    let user = await User.findOne({ facebookId }).select("+refreshToken");

    if (!user && email) {
      user = await User.findOne({ email }).select("+refreshToken");
      if (user) {
        user.facebookId = facebookId;
        if (!user.photo && photo) user.photo = photo;
        if (!user.name && name) user.name = name;
        await user.save({ validateBeforeSave: false });
      }
    }

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name,
        photo,
        facebookId,
        password: null,
        isUpdatePassword: false,
        isVerified: true,
      });
    }

    // Create tokens
    const tokenService = require("../../../services/tokenService");
    const tokens = tokenService.signTokens(user);
    
    // Save refresh token to database
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });
    
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
      "Facebook login successful"
    );
  } catch (error) {
    console.error("Facebook login error:", error);
    return sendError(res, error.message || "Facebook login failed", 401);
  }
};
