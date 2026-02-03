const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;

  if (auth && auth.startsWith("Bearer ")) token = auth.split(" ")[1];
  if (!token) return next(new AppError("Bạn chưa đăng nhập", 401));

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError("User không tồn tại", 401));

  req.user = user;
  next();
});
