const express = require("express");
const otpController = require("../controller/otpController");
const router = express.Router();

/**
 * @swagger
 * /api/v1/otp/verify:
 *   post:
 *     tags:
 *       - OTP
 *     summary: Xác thực mã OTP
 *     operationId: verifyOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [forgotPassword, register]
 *     responses:
 *       200:
 *         description: Xác thực OTP thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mã OTP không hợp lệ/hết hạn
 *       404:
 *         description: Không tìm thấy người dùng với email đã cung cấp
 *       500:
 *         description: Lỗi máy chủ
 */
router.post("/verify", otpController.verifyOTP);

/**
 * @swagger
 * /api/v1/otp/resend:
 *   post:
 *     tags:
 *       - OTP
 *     summary: Gửi lại mã OTP
 *     operationId: resendOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               type:
 *                 type: string
 *                 enum: [forgotPassword, register]
 *     responses:
 *       200:
 *         description: Mã OTP đã được gửi lại thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc người dùng chưa/đã xác thực
 *       404:
 *         description: Không tìm thấy người dùng với email đã cung cấp
 *       500:
 *         description: Lỗi khi gửi mã OTP
 */
router.post("/resend", otpController.resendOTP);

module.exports = router;
