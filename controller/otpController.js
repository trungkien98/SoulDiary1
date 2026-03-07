const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const otpService = require("../services/otpService");
// const resetPasswordService = require("../services/resetPasswordService");
const Email = require("../utils/sendEmail");
const userService = require("../services/authService");
const crypto = require("crypto");

const generateRandomPassword = (length = 12) => {
  return crypto.randomBytes(32).toString("base64url").slice(0, length);
};
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, code, type } = req.body;
  if (!email || !code || !type) {
    return next(new AppError("Vui lòng nhập đầy đủ thông tin", 400));
  }

  const user = await userService.findUser(email, "+password");

  if (!user) {
    return next(new AppError("Người dùng không tồn tại", 404));
  }

  const isValid = await otpService.isVerify(user._id, type, code);

  if (!isValid) {
    return next(new AppError("Mã OTP không hợp lệ hoặc hết thời gian", 400));
  }

  switch (type) {
    case "forgotPassword": {
      if (!user.isVerified) {
        return next(new AppError("Người dùng chưa xác thực", 400));
      }

      const newPasswordPlain = generateRandomPassword(12);

      // 2) cập nhật password (pre-save sẽ hash)
      user.password = newPasswordPlain;
      user.isUpdatePassword = true;
      await user.save(); // quan trọng: dùng save để chạy pre('save') hash password

      // 3) clear OTP để không dùng lại
      await otpService.clearOTP(type, user._id);

      // 4) gửi mail mật khẩu mới
      await new Email(user, newPasswordPlain).sendNewPassword();

      return res.status(200).json({
        status: "success",
        message: "Mật khẩu mới đã được gửi về email.",
      });
    }
    case "register":
      await userService.updateOne(user._id, { isVerified: true });
      return res.status(200).json({
        status: "success",
        message: "Xác thực thành công",
      });
  }
});

exports.resendOTP = catchAsync(async (req, res, next) => {
  const { email, type } = req.body;

  if (!email || !type) {
    return next(new AppError("Vui lòng nhập đầy đủ thông tin", 400));
  }

  const user = await userService.findUser(email);

  if (!user) {
    return next(new AppError("Người dùng không tồn tại", 404));
  }

  let otp;

  try {
    switch (type) {
      case "forgotPassword":
        if (!user.isVerified) {
          return next(new AppError("Người dùng chưa xác thực", 400));
        }
        otp = await otpService.generateOTP(type, user._id);
        try {
          await new Email(user, otp).sendPasswordReset();
        } catch (emailError) {
          console.error("Email send error:", emailError.message);
          await otpService.clearOTP(type, user._id);
          return next(new AppError("Lỗi khi gửi mã OTP. Vui lòng kiểm tra cấu hình email.", 500));
        }
        return res.status(200).json({
          status: "success",
          message: "Mã OTP đã được gửi về email của bạn",
        });
        
      case "register":
        if (user.isVerified) {
          return next(new AppError("Người dùng đã xác thực", 400));
        }
        otp = await otpService.generateOTP(type, user._id);
        try {
          await new Email(user, otp).sendWelcome();
        } catch (emailError) {
          console.error("Email send error:", emailError.message);
          await otpService.clearOTP(type, user._id);
          return next(new AppError("Lỗi khi gửi mã OTP. Vui lòng kiểm tra cấu hình email.", 500));
        }
        return res.status(200).json({
          status: "success",
          message: "Mã OTP đã được gửi về email của bạn",
        });
        
      default:
        return next(new AppError("Loại OTP không hợp lệ", 400));
    }
  } catch (error) {
    await otpService.clearOTP(type, user._id);
    console.error("Unexpected error in resendOTP:", error.message);
    return next(new AppError("Lỗi khi gửi mã OTP", 500));
  }
});
