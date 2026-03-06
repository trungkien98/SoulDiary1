const express = require("express");
const otpController = require("../controller/otpController");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: OTP
 *     description: 🔐 One-Time Password verification and management | Xác minh mã OTP
 */

/**
 * @openapi
 * /api/v1/otp/verify:
 *   post:
 *     tags: [OTP]
 *     summary: Verify OTP code | Xác minh mã OTP
 *     description: Verify a one-time password sent to user's email | Kiểm tra mã OTP
 *     operationId: verifyOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code sent to email
 *                 example: "123456"
 *               type:
 *                 type: string
 *                 enum: [forgotPassword, register]
 *                 description: Type of OTP (for registration or password reset)
 *                 example: register
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Xác thực OTP thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *       400:
 *         description: Bad Request - Invalid data or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidOTP:
 *                 value:
 *                   status: fail
 *                   message: Mã OTP không hợp lệ hoặc hết hạn
 *                   statusCode: 400
 *               missingFields:
 *                 value:
 *                   status: fail
 *                   message: Thiếu email, code hoặc type
 *                   statusCode: 400
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Không tìm thấy người dùng với email đã cung cấp
 *               statusCode: 404
 *       500:
 *         description: Server error
 */
router.post("/verify", otpController.verifyOTP);

/**
 * @openapi
 * /api/v1/otp/resend:
 *   post:
 *     tags: [OTP]
 *     summary: Resend OTP code | Gửi lại mã OTP
 *     description: Send a new OTP code to user's email (previous code will be invalidated) | Gửi mã OTP mới
 *     operationId: resendOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, type]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               type:
 *                 type: string
 *                 enum: [forgotPassword, register]
 *                 description: Type of OTP (for registration or password reset)
 *                 example: register
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Mã OTP đã được gửi lại thành công
 *       400:
 *         description: Bad Request - Invalid data or user already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               alreadyVerified:
 *                 value:
 *                   status: fail
 *                   message: Tài khoản đã được xác thực
 *                   statusCode: 400
 *               missingFields:
 *                 value:
 *                   status: fail
 *                   message: Thiếu email hoặc type
 *                   statusCode: 400
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Không tìm thấy người dùng với email đã cung cấp
 *               statusCode: 404
 *       500:
 *         description: Server error when sending OTP
 */
router.post("/resend", otpController.resendOTP);

module.exports = router;
