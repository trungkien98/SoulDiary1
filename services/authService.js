// services/authService.js
const User = require("../models/userModel");
const tokenService = require("./tokenService");

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

exports.signToken = (user) => {
  return tokenService.signTokens(user);
};

exports.createSendToken = async (user, statusCode, res) => {
  const token = exports.signToken(user);

  // lưu refreshToken để rotate/revoke
  await User.findByIdAndUpdate(user._id, { refreshToken: token.refresh_token });

  const shouldSetCookie =
    String(process.env.COOKIE_AUTH || "false").toLowerCase() === "true";
  if (shouldSetCookie) {
    res.cookie("refreshToken", token.refresh_token, buildCookieOptions());
  }

  // trả user sạch (tránh lộ field nhạy cảm)
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.refreshToken;
  delete safeUser.googleId;
  delete safeUser.facebookId;

  return res.status(statusCode).json({
    status: "success",
    token,
    data: { user: safeUser },
  });
};
