require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const otpService = require("../../../services/otpService");
const authService = require("../../../services/authService");
const tokenService = require("../../../services/tokenService");
const socialService = require("../../../services/socialService");
const Email = require("../../../utils/sendEmail");
const User = require("../../../models/userModel");

/**
 * Consolidated Auth Handler
 * POST /api/v1/auth?action=register|login|google|facebook|logout|refresh|forgot-password
 */
export default async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  if (req.method !== "POST") {
    return sendError(res, "Method not allowed", 405);
  }

  const { action } = req.query;

  try {
    await connectDB();

    // REGISTER
    if (action === "register") {
      const { email, password, name } = req.body;
      if (!email || !password) return sendError(res, "Thiếu email hoặc password", 400);

      const existed = await authService.findUser(email);
      if (existed) return sendError(res, "Email đã tồn tại", 409);

      const user = await User.create({ email, password, name });
      const otp = await otpService.generateOTP("register", user._id);
      await new Email(user, otp).sendWelcome();

      return sendSuccess(
        res,
        { email: user.email },
        201,
        "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
      );
    }

    // LOGIN
    if (action === "login") {
      const { email, password } = req.body;
      if (!email || !password) return sendError(res, "Thiếu email hoặc password", 400);

      const user = await authService.findUser(email, "+password");
      if (!user || !user.password) return sendError(res, "Sai email hoặc mật khẩu", 401);
      if (!user.isVerified) return sendError(res, "Tài khoản chưa được xác thực", 401);

      const ok = await user.correctPassword(password, user.password);
      if (!ok) return sendError(res, "Sai email hoặc mật khẩu", 401);

      const tokens = tokenService.signTokens(user);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });

      res.setHeader(
        "Set-Cookie",
        `refreshToken=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/`
      );

      return sendSuccess(
        res,
        {
          token: tokens,
          user: { _id: user._id, name: user.name, email: user.email, photo: user.photo },
        },
        200,
        "Đăng nhập thành công"
      );
    }

    // GOOGLE LOGIN
    if (action === "google") {
      const { idToken } = req.body;
      if (!idToken) return sendError(res, "Thiếu idToken", 400);

      const payload = await socialService.verifyGoogleIdToken(idToken);
      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name;
      const photo = payload.picture;

      let user = await User.findOne({ googleId }).select("+refreshToken");
      if (!user && email) {
        user = await User.findOne({ email }).select("+refreshToken");
        if (user) {
          user.googleId = googleId;
          if (!user.photo && photo) user.photo = photo;
          if (!user.name && name) user.name = name;
          await user.save({ validateBeforeSave: false });
        }
      }

      if (!user) {
        user = await User.create({
          email,
          name,
          photo,
          googleId,
          password: null,
          isUpdatePassword: false,
          isVerified: true,
        });
      }

      const tokens = tokenService.signTokens(user);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });

      res.setHeader(
        "Set-Cookie",
        `refreshToken=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/`
      );

      return sendSuccess(
        res,
        {
          token: tokens,
          user: { _id: user._id, name: user.name, email: user.email, photo: user.photo },
        },
        200,
        "Google login successful"
      );
    }

    // FACEBOOK LOGIN
    if (action === "facebook") {
      const { accessToken } = req.body;
      if (!accessToken) return sendError(res, "Thiếu accessToken", 400);

      const profile = await socialService.verifyFacebookToken(accessToken);
      const facebookId = profile.id;
      const email = profile.email;
      const name = profile.name;
      const photo = profile.picture?.data?.url;

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

      const tokens = tokenService.signTokens(user);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });

      res.setHeader(
        "Set-Cookie",
        `refreshToken=${tokens.refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/`
      );

      return sendSuccess(
        res,
        {
          token: tokens,
          user: { _id: user._id, name: user.name, email: user.email, photo: user.photo },
        },
        200,
        "Facebook login successful"
      );
    }

    // LOGOUT
    if (action === "logout") {
      res.setHeader(
        "Set-Cookie",
        "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"
      );
      return sendSuccess(res, {}, 200, "Logged out successfully");
    }

    // REFRESH TOKEN
    if (action === "refresh") {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, "Thiếu refreshToken", 400);

      let decoded;
      try {
        decoded = tokenService.verifyRefreshToken(refreshToken);
      } catch (error) {
        return sendError(res, "Invalid or expired refresh token", 401);
      }

      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return sendError(res, "Invalid or expired refresh token", 401);
      }

      const newAccessToken = tokenService.signAccessToken(user);
      return sendSuccess(
        res,
        {
          token: {
            access_token: newAccessToken,
            refresh_token: refreshToken,
          },
        },
        200,
        "Token refreshed successfully"
      );
    }

    // FORGOT PASSWORD
    if (action === "forgot-password") {
      const { email } = req.body;
      if (!email) return sendError(res, "Thiếu email", 400);

      const user = await authService.findUser(email);
      if (!user) return sendError(res, "Người dùng không tồn tại", 404);

      const otp = await otpService.generateOTP("forgot_password", user._id);
      await new Email(user, otp).sendPasswordReset();

      return sendSuccess(res, { email: user.email }, 200, "OTP sent to your email");
    }

    return sendError(res, "Invalid auth action", 400);
  } catch (error) {
    console.error("Auth error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
