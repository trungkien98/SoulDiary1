const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

/**
 * Protect middleware for Vercel API routes
 * Verifies JWT token and attaches user to request
 */
const protect = async (req) => {
  let token;
  const auth = req.headers.authorization;

  if (auth && auth.startsWith("Bearer ")) {
    token = auth.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Bạn chưa đăng nhập", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError("User không tồn tại", 401);
    }

    return user;
  } catch (error) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 401);
  }
};

module.exports = { protect };
