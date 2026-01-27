// services/tokenService.js
const jwt = require("jsonwebtoken");

exports.signAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
  );
};

exports.signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );
};

exports.signTokens = (user) => {
  const accessToken = exports.signAccessToken(user);
  const refreshToken = exports.signRefreshToken(user);
  return { access_token: accessToken, refresh_token: refreshToken };
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
