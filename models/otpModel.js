const mongoose = require("mongoose");
const validator = require("validator");

const otpSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã OTP không được để trống"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng không được để trống"],
    },
    type: {
      type: String,
      enum: ["register", "forgotPassword"],
    },
    expired: {
      type: Date,
      required: [true, "Thời gian hết hạn không được để trống"],
    },
  },
  { timestamps: true },
);

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
