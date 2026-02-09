const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const otpService = require("../services/otpService");
// const resetPasswordService = require("../services/resetPasswordService");
const Email = require("../utils/sendEmail");
const userService = require("../services/authService");

exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, code, type } = req.body;
  if (!email || !code || !type) {
    return next(new AppError("Vui lòng nhập đầy đủ thông tin", 400));
  }

  const user = await userService.findUser(email);

  if (!user) {
    return next(new AppError("Người dùng không tồn tại", 404));
  }

  const isValid = await otpService.isVerify(user._id, type, code);

  if (!isValid) {
    return next(new AppError("Mã OTP không hợp lệ hoặc hết thời gian", 400));
  }

  switch (type) {
    case "forgotPassword":
      const token = await resetPasswordService.generateToken(user._id);
      return res.status(200).json({
        status: "success",
        message: "Xác thực thành công",
        data: {
          token,
          email,
        },
      });
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
        await new Email(user, otp).sendPasswordReset();
        break;
      case "register":
        if (user.isVerified) {
          return next(new AppError("Người dùng đã xác thực", 400));
        }
        otp = await otpService.generateOTP(type, user._id);
        await new Email(user, otp).sendWelcome();
        break;
    }
  } catch (error) {
    await otpService.clearOTP(type, user._id);
    return next(new AppError("Lỗi khi gửi mã OTP", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Mã OTP đã được gửi lại",
  });
});
