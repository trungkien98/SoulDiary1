// controller/authController.js
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const authService = require("../services/authService");
const tokenService = require("../services/tokenService");
const socialService = require("../services/socialService");
const User = require("../models/userModel");

// ====== LOCAL: REGISTER ======
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return next(new AppError("Thiếu email hoặc password", 400));
  }

  const existed = await authService.findUser(email);
  if (existed) return next(new AppError("Email đã tồn tại", 409));

  const user = await User.create({ email, password, name });

  await authService.createSendToken(user, 201, res);
});

// ====== LOCAL: LOGIN ======
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Thiếu email hoặc password", 400));
  }

  const user = await authService.findUser(email, "+password");
  if (!user || !user.password) {
    return next(new AppError("Sai email hoặc mật khẩu", 401));
  }

  const ok = await user.correctPassword(password, user.password);
  if (!ok) return next(new AppError("Sai email hoặc mật khẩu", 401));

  await authService.createSendToken(user, 200, res);
});

// ====== GOOGLE LOGIN ======
// client gửi { idToken }
exports.googleLogin = catchAsync(async (req, res, next) => {
  const { idToken } = req.body;
  if (!idToken) return next(new AppError("Thiếu idToken", 400));

  const payload = await socialService.verifyGoogleIdToken(idToken);

  const googleId = payload.sub;
  const email = payload.email; // thường có
  const name = payload.name;
  const photo = payload.picture;

  // ưu tiên tìm theo googleId, nếu chưa có thì link theo email
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
    // tạo user mới (social)
    user = await User.create({
      email,
      name,
      photo,
      googleId,
      password: null,
      isUpdatePassword: false,
    });
  }

  await authService.createSendToken(user, 200, res);
});

// ====== FACEBOOK LOGIN ======
// client gửi { accessToken }
exports.facebookLogin = catchAsync(async (req, res, next) => {
  const { accessToken } = req.body;
  if (!accessToken) return next(new AppError("Thiếu accessToken", 400));

  const fb = await socialService.verifyFacebookAccessToken(accessToken);

  const facebookId = fb.id;
  const name = fb.name;
  const email = fb.email; // có thể null nếu user không cấp quyền
  const photo = fb.picture?.data?.url;

  let user = await User.findOne({ facebookId }).select("+refreshToken");

  // link theo email nếu có
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
    // nếu facebook không trả email và model email required -> sẽ lỗi
    if (!email) {
      return next(
        new AppError(
          "Facebook không trả email. Vui lòng cấp quyền email hoặc dùng phương thức đăng nhập khác.",
          400,
        ),
      );
    }

    user = await User.create({
      email,
      name,
      photo,
      facebookId,
      password: null,
      isUpdatePassword: false,
    });
  }

  await authService.createSendToken(user, 200, res);
});

// ====== REFRESH TOKEN ======
// web: lấy từ cookie refreshToken
// mobile: gửi refreshToken trong body
exports.refresh = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) return next(new AppError("Thiếu refreshToken", 400));

  // verify chữ ký refresh token
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch (e) {
    return next(
      new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401),
    );
  }

  // kiểm tra user tồn tại + refreshToken khớp DB để revoke được
  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || !user.refreshToken) {
    return next(new AppError("Refresh token không hợp lệ", 401));
  }

  if (user.refreshToken !== refreshToken) {
    return next(
      new AppError("Refresh token đã bị thay thế hoặc bị thu hồi", 401),
    );
  }

  // rotate refresh token + cấp access token mới
  await authService.createSendToken(user, 200, res);
});

// ====== LOGOUT ======
exports.logout = catchAsync(async (req, res) => {
  // clear cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  // nếu bạn muốn revoke refreshToken trong DB luôn (nên làm):
  // (chỉ làm được nếu client gửi refreshToken hoặc bạn decode cookie)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    } catch (_) {}
  }

  res.status(200).json({ status: "success" });
});
