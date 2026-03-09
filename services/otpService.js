const Otp = require("../models/otpModel");

const clearOTP = async (type, userId) => {
  await Otp.deleteMany({
    user: userId,
    type: type,
  });
};

const generateOTP = async (type, userId) => {
  await clearOTP(type, userId);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expired = Date.now() + 10 * 60 * 1000;
  const otpData = await Otp.create({
    code: otp,
    user: userId,
    type: type,
    expired: expired,
  });

  return otp;
};

const isVerify = async (userId, type, code) => {
  const otp = await Otp.findOne({
    user: userId,
    type: type,
    code,
  });

  if (!otp) {
    return false;
  }

  if (otp.expired < new Date()) {
    await otp.deleteOne();
    return false;
  }

  await otp.deleteOne();
  return true;
};

module.exports = {
  generateOTP,
  clearOTP,
  isVerify,
};
