require("dotenv").config();

const { connectDB } = require("../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../lib/utils");
const otpService = require("../../services/otpService");
const authService = require("../../services/authService");
const tokenService = require("../../services/tokenService");
const socialService = require("../../services/socialService");
const Email = require("../../utils/sendEmail");
const User = require("../../models/userModel");

/**
 * Consolidated Auth Handler
 * Handles:
 * POST /api/v1/auth?action=register|login|google|facebook|logout|refresh
 * GET /api/v1/auth/google-oauth?redirect=...
 * GET /api/v1/auth/google-oauth-callback?code=...&state=...
 * GET /api/v1/auth/facebook-oauth?redirect=...
 * GET /api/v1/auth/facebook-oauth-callback?code=...&state=...
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  let action = req.query.action;

  // Extract action from URL path if not in query params
  if (!action && req.url) {
    const pathMatch = req.url.match(/\/(google-oauth|facebook-oauth|google-oauth-callback|facebook-oauth-callback)/);
    if (pathMatch) {
      action = pathMatch[1];
    }
  }

  // ====== HANDLE GET REQUESTS FOR OAUTH ======
  if (req.method === "GET") {
    try {
      await connectDB();

      // Helper: Get correct protocol (handles Vercel proxy headers)
      const getProtocol = (req) => {
        return req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      };

      // GOOGLE OAUTH - Step 1: Redirect to Google consent
      if (action === "google-oauth") {
        const { redirect } = req.query;
        if (!redirect) return sendError(res, "Missing redirect parameter", 400);

        const protocol = getProtocol(req);
        const host = req.headers.host;
        const backendCallbackUri = `${protocol}://${host}/api/v1/auth?action=google-oauth-callback`;

        const { authUrl } = socialService.generateGoogleConsentUrl(backendCallbackUri, redirect);
        return res.redirect(authUrl);
      }

      // GOOGLE OAUTH CALLBACK - Step 2: Handle code exchange
      if (action === "google-oauth-callback") {
        const { code, state, error } = req.query;

        const stateData = socialService.getOAuthState(state);
        if (!stateData) {
          return sendError(res, "Invalid or expired OAuth state. Please try again.", 400);
        }

        const redirectUri = stateData.appRedirectUri;

        if (error) {
          const errorMsg = encodeURIComponent(`Google OAuth error: ${error}`);
          return res.redirect(`${redirectUri}?error=${errorMsg}`);
        }

        const protocol = getProtocol(req);
        const host = req.headers.host;
        const callbackUri = `${protocol}://${host}/api/v1/auth?action=google-oauth-callback`;
        const { idToken, payload } = await socialService.exchangeGoogleCode(code, callbackUri);

        let user = await authService.findUser(payload.email);
        if (!user) {
          user = await User.create({
            email: payload.email,
            name: payload.name,
            photo: payload.picture,
            isVerified: true,
            provider: "google",
          });
        }

        const tokens = tokenService.signTokens(user);
        await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });

        const appRedirect = redirectUri || "souldiary://oauth-callback";
        const tokenParam = encodeURIComponent(tokens.access_token);
        return res.redirect(`${appRedirect}?token=${tokenParam}&provider=google`);
      }

      // FACEBOOK OAUTH - Step 1: Redirect to Facebook consent
      if (action === "facebook-oauth") {
        const { redirect } = req.query;
        if (!redirect) return sendError(res, "Missing redirect parameter", 400);

        const protocol = getProtocol(req);
        const host = req.headers.host;
        const backendCallbackUri = `${protocol}://${host}/api/v1/auth?action=facebook-oauth-callback`;

        const { authUrl } = socialService.generateFacebookConsentUrl(backendCallbackUri, redirect);
        return res.redirect(authUrl);
      }

      // FACEBOOK OAUTH CALLBACK - Step 2: Handle code exchange
      if (action === "facebook-oauth-callback") {
        const { code, state, error } = req.query;

        const stateData = socialService.getOAuthState(state);
        if (!stateData) {
          return sendError(res, "Invalid or expired OAuth state. Please try again.", 400);
        }

        const redirectUri = stateData.appRedirectUri;

        if (error) {
          const errorMsg = encodeURIComponent(`Facebook OAuth error: ${error}`);
          return res.redirect(`${redirectUri}?error=${errorMsg}`);
        }

        const protocol = getProtocol(req);
        const host = req.headers.host;
        const callbackUri = `${protocol}://${host}/api/v1/auth?action=facebook-oauth-callback`;
        const { accessToken, payload } = await socialService.exchangeFacebookCode(code, callbackUri);

        let user = await authService.findUser(payload.email);
        if (!user) {
          user = await User.create({
            email: payload.email,
            name: payload.name,
            photo: payload.picture?.data?.url,
            isVerified: true,
            provider: "facebook",
          });
        }

        const tokens = tokenService.signTokens(user);
        await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });

        const appRedirect = redirectUri || "souldiary://oauth-callback";
        const tokenParam = encodeURIComponent(tokens.access_token);
        return res.redirect(`${appRedirect}?token=${tokenParam}&provider=facebook`);
      }

      return sendError(res, "Method not allowed for this action", 405);
    } catch (error) {
      console.error("❌ OAuth GET error:", error);
      return sendError(res, error.message || "Internal server error", 500);
    }
  }

  if (req.method !== "POST") {
    return sendError(res, "Method not allowed", 405);
  }

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
        \"Registration successful! Please check your email to verify your account.\"\n      );
      );
    }

    // LOGIN
    if (action === "login") {
      const { email, password } = req.body;
      if (!email || !password) return sendError(res, "Thiếu email hoặc password", 400);

      const user = await authService.findUser(email, "+password");
      
      if (!user) {
        console.log(`❌ Login failed: User not found with email ${email}`);
        return sendError(res, "Sai email hoặc mật khẩu", 401);
      }
      
      if (!user.password) {
        console.log(`❌ Login failed: User ${email} has no password (social login)`);
        return sendError(res, "Tài khoản này sử dụng đăng nhập xã hội. Vui lòng đăng nhập qua Google hoặc Facebook.", 401);
      }
      
      if (!user.isVerified) {
        console.log(`⚠️ Login failed - email not verified: ${email}`);
        return sendError(res, "Your email has not been verified yet. Please check your email for the verification link.", 403);
      }

      const ok = await user.correctPassword(password, user.password);
      if (!ok) {
        console.log(`⚠️ Login failed - incorrect password: ${email}`);
        return sendError(res, "Invalid email or password. Please check and try again.", 401);
      }

      console.log(`✅ Login successful - user: ${user._id}, email: ${email}`);
      const tokens = tokenService.signTokens(user);
      await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refresh_token });
      console.log(`🎫 Tokens generated and stored`);

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
        "You have been logged in successfully."
      );
    }

    // GOOGLE LOGIN
    if (action === "google") {
      const { idToken } = req.body;
      console.log(`🔵 Google login attempt`);
      if (!idToken) {
        console.log(`⚠️ Google login failed - idToken not provided`);
        return sendError(res, "Google ID token is required for authentication.", 400);
      }

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
      console.log(`🔵 Facebook login attempt`);
      if (!accessToken) {
        console.log(`⚠️ Facebook login failed - accessToken not provided`);
        return sendError(res, "Facebook access token is required for authentication.", 400);
      }

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
      console.log(`👋 Logout request received`);
      res.setHeader(
        "Set-Cookie",
        "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"
      );
      console.log(`✅ User logged out - refresh token cleared`);
      return sendSuccess(res, {}, 200, "You have been logged out successfully.");
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

    console.log(`⚠️ Invalid or unknown auth action: ${action}`);
    return sendError(res, "Invalid authentication action. Please check your request.", 400);
  } catch (error) {
    console.error(`❌ Auth handler error:`, {
      action,
      message: error.message
    });
    return sendError(res, "An authentication error occurred. Please try again.", 500);
  }
};
