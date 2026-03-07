// controller/authController.js
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const otpService = require("../services/otpService");
const authService = require("../services/authService");
const tokenService = require("../services/tokenService");
const socialService = require("../services/socialService");

const User = require("../models/userModel");
const Email = require("../utils/sendEmail");
// ====== LOCAL: REGISTER ======
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return next(new AppError("Thiếu email hoặc password", 400));
  }

  const existed = await authService.findUser(email);
  if (existed) {
    return next(new AppError("Email đã tồn tại", 409));
  }
  
  const user = await User.create({
    email,
    password,
    name,
  });

  const otp = await otpService.generateOTP("register", user._id);

  try {
    await new Email(user, otp).sendWelcome();
  } catch (emailError) {
    console.error("Email send error during registration:", emailError.message);
    // Don't delete the user, but notify them of the email issue
    return res.status(201).json({
      status: "success",
      message: "Đăng ký thành công. Lỗi gửi email - vui lòng dùng nút 'Gửi lại mã OTP'.",
      data: {
        email: user.email,
        warning: "Email không thể gửi. Vui lòng kiểm tra cấu hình email."
      },
    });
  }

  res.status(201).json({
    status: "success",
    message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
    data: {
      email: user.email,
    },
  });
});

// ====== LOCAL: LOGIN ======
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Thiếu email hoặc password", 400));
  }

  const user = await authService.findUser(email, "+password");
  
  if (!user) {
    console.log(`❌ Login failed: User not found with email ${email}`);
    return next(new AppError("Sai email hoặc mật khẩu", 401));
  }
  
  if (!user.password) {
    console.log(`❌ Login failed: User ${email} has no password (social login)`);
    return next(new AppError("Tài khoản này sử dụng đăng nhập xã hội. Vui lòng đăng nhập qua Google hoặc Facebook.", 401));
  }
  
  if (!user.isVerified) {
    console.log(`❌ Login failed: User ${email} not verified`);
    return next(new AppError("Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực.", 401));
  }

  const ok = await user.correctPassword(password, user.password);
  if (!ok) {
    console.log(`❌ Login failed: Wrong password for ${email}`);
    return next(new AppError("Sai email hoặc mật khẩu", 401));
  }

  console.log(`✅ Login successful for ${email}`);
  await authService.createSendToken(user, 200, res);
});

// ====== GOOGLE LOGIN ======
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
      isVerified: true,
    });
  }

  await authService.createSendToken(user, 200, res);
});

// ====== FACEBOOK LOGIN ======
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
      isVerified: true,
    });
  }

  await authService.createSendToken(user, 200, res);
});

// ====== REFRESH TOKEN ======
exports.refresh = catchAsync(async (req, res, next) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

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
  // clear cookie (nếu có bật cookie)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  // mobile-first: ưu tiên body
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id).select("+refreshToken");

      // ✅ chỉ revoke nếu token khớp DB
      if (user && user.refreshToken === refreshToken) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    } catch (_) {}
  }

  res.status(200).json({ status: "success" });
});
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Vui lòng nhập email", 400));

  const user = await authService.findUser(email);
  if (!user) return next(new AppError("Người dùng không tồn tại", 404));

  if (!user.isVerified)
    return next(new AppError("Người dùng chưa xác thực", 400));

  let otp;
  try {
    otp = await otpService.generateOTP("forgotPassword", user._id);
    await new Email(user, otp).sendPasswordReset(); // gửi OTP
  } catch (e) {
    await otpService.clearOTP("forgotPassword", user._id);
    return next(new AppError("Lỗi khi gửi mã OTP", 500));
  }

  res.status(200).json({
    status: "success",
    message: "OTP đặt lại mật khẩu đã được gửi về email.",
  });
});
