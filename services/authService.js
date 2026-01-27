// services/authService.js
const User = require("../models/userModel");
const tokenService = require("./tokenService");

/**
 * Helper: cookie options chuẩn cho both web/mobile
 * - dev: Lax + secure false
 * - prod: None + secure true (bắt buộc để cookie hoạt động cross-site)
 */
const buildCookieOptions = () => {
  const days = Number(process.env.JWT_COOKIE_EXPIRES_IN || 30);

  const opts = {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    opts.secure = true;
    opts.sameSite = "None";
  } else {
    opts.secure = false;
    opts.sameSite = "Lax";
  }

  return opts;
};

exports.findUser = (email, select = "") => {
  if (select) return User.findOne({ email }).select(select);
  return User.findOne({ email });
};

exports.findUserByFBId = async (id, select = "") => {
  if (select) return User.findOne({ facebookId: id }).select(select);
  return User.findOne({ facebookId: id });
};

exports.findUserById = async (userId) => {
  return User.findById(userId); // ✅ bỏ populate role
};

exports.updateOne = async (userId, payload, isValidate = false) => {
  return User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: !!isValidate,
  });
};

exports.getUserInfo = async (userId) => {
  return User.findById(userId);
};

// ====== Token flow (giữ nguyên logic) ======
exports.signToken = (user) => {
  // giữ nguyên output {access_token, refresh_token}
  return tokenService.signTokens(user);
};

/**
 * createSendToken: giữ nguyên hành vi
 * - sign access+refresh
 * - lưu refreshToken vào DB
 * - set refreshToken cookie (web)
 * - trả JSON
 *
 * NOTE: Nếu mobile muốn nhận refresh_token trong body thì client dùng luôn response.token.refresh_token.
 * Với web, cookie cũng được set đồng thời.
 */
exports.createSendToken = async (user, statusCode, res) => {
  const token = exports.signToken(user);

  // Lưu refresh token vào database
  await User.findByIdAndUpdate(
    user._id,
    { refreshToken: token.refresh_token },
    { new: true },
  );

  // Set cookie cho web
  res.cookie("refreshToken", token.refresh_token, buildCookieOptions());

  // tránh trả password
  user.password = undefined;

  return res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};
