const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const tokenService = require("../services/tokenService");
exports.getMeProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    "name email photo phone dateOfBirth address isVerified status createdAt updatedAt streakCount bestStreak lastStreakDate",
  );

  if (!user) return next(new AppError("User không tồn tại", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError("Vui lòng nhập currentPassword và newPassword", 400),
    );
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return next(new AppError("confirmPassword không khớp", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) return next(new AppError("User không tồn tại", 404));

  // nếu là social login không có password
  if (!user.password) {
    return next(
      new AppError(
        "Tài khoản Google/Facebook chưa có mật khẩu. Hãy tạo mật khẩu trước.",
        400,
      ),
    );
  }

  const ok = await user.correctPassword(currentPassword, user.password);
  if (!ok) return next(new AppError("Mật khẩu hiện tại không đúng", 401));

  // set password mới => pre('save') sẽ hash và set passwordChangedAt
  user.password = newPassword;
  user.isUpdatePassword = true;
  await user.save();

  // phát hành token mới (để tránh token cũ bị coi là hết hiệu lực sau đổi pass)
  const access_token = tokenService.signAccessToken(user);

  res.status(200).json({
    status: "success",
    message: "Đổi mật khẩu thành công",
    token: { access_token },
  });
});
exports.updateMeProfile = catchAsync(async (req, res, next) => {
  const allowed = ["name", "phone", "dateOfBirth", "address", "photo", "bio"];
  const update = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  if (req.body.email !== undefined) {
    return next(new AppError("Không thể đổi email tại đây", 400));
  }
  if (req.body.password !== undefined || req.body.newPassword !== undefined) {
    return next(new AppError("Không thể đổi mật khẩu tại đây", 400));
  }

  if (update.dateOfBirth !== undefined) {
    const d = new Date(update.dateOfBirth);
    if (Number.isNaN(d.getTime())) {
      return next(new AppError("dateOfBirth không hợp lệ", 400));
    }
    update.dateOfBirth = d;
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).select(
    "name email photo phone dateOfBirth address bio isVerified status createdAt updatedAt streakCount bestStreak lastStreakDate",
  );

  if (!user) return next(new AppError("User không tồn tại", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
