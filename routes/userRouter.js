const express = require("express");
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: 👤 User profile management (requires authentication) | Quản lý hồ sơ người dùng
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get my profile | Xem hồ sơ của tôi
 *     description: Retrieve authenticated user's profile information | Lấy thông tin hồ sơ của bạn
 *     tags: [Users]
 *     security:
 *       - bearer: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Bạn chưa đăng nhập
 *               statusCode: 401
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: User không tồn tại
 *               statusCode: 404
 */
router.get("/me", protect, userController.getMeProfile);

/**
 * @openapi
 * /api/v1/users/updateMyPassword:
 *   patch:
 *     summary: Update password | Đổi mật khẩu
 *     description: Change user password with current password verification | Cập nhật mật khẩu
 *     tags: [Users]
 *     security:
 *       - bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: User's current password
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (minimum 8 characters)
 *                 minLength: 8
 *                 example: NewPassword456!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password
 *                 example: NewPassword456!
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Đổi mật khẩu thành công
 *                 token:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: New access token after password change
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZDBmM2I1YTVhNWE1YTVhNWE1YTVhNSIsImlhdCI6MTcwODM5OTUyOH0.xyz
 *       400:
 *         description: Bad Request - Missing fields or password mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   status: fail
 *                   message: Vui lòng nhập currentPassword và newPassword
 *                   statusCode: 400
 *               passwordMismatch:
 *                 value:
 *                   status: fail
 *                   message: confirmPassword không khớp
 *                   statusCode: 400
 *               socialAccount:
 *                 value:
 *                   status: fail
 *                   message: Tài khoản Google/Facebook chưa có mật khẩu. Hãy tạo mật khẩu trước.
 *                   statusCode: 400
 *       401:
 *         description: Unauthorized - Current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Mật khẩu hiện tại không đúng
 *               statusCode: 401
 *       404:
 *         description: User not found
 */
router.patch("/updateMyPassword", protect, userController.updateMyPassword);

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     summary: Update profile | Cập nhật hồ sơ
 *     description: Update user profile information (name, phone, date of birth, address, bio, photo) | Cập nhật thông tin hồ sơ
 *     tags: [Users]
 *     security:
 *       - bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name
 *                 example: Nguyen Van A
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "0987654321"
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *                 description: Date of birth
 *                 example: "1990-01-15T00:00:00.000Z"
 *               address:
 *                 type: string
 *                 description: User's address
 *                 example: Ho Chi Minh City, Vietnam
 *               photo:
 *                 type: string
 *                 nullable: true
 *                 description: URL to user's profile photo
 *                 example: https://example.com/photo.jpg
 *               bio:
 *                 type: string
 *                 nullable: true
 *                 description: Short bio about the user
 *                 example: I love journaling and self-reflection
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request - Invalid update fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               emailChange:
 *                 value:
 *                   status: fail
 *                   message: Không thể đổi email tại đây
 *                   statusCode: 400
 *               passwordChange:
 *                 value:
 *                   status: fail
 *                   message: Không thể đổi mật khẩu tại đây
 *                   statusCode: 400
 *               invalidDate:
 *                 value:
 *                   status: fail
 *                   message: dateOfBirth không hợp lệ
 *                   statusCode: 400
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: User not found
 */
router.patch("/me", protect, userController.updateMeProfile);

module.exports = router;
