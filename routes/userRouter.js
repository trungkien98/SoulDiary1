const express = require("express");
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User profile APIs
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     security:
 *       - bearer: []
 *     responses:
 *       200:
 *         description: Success
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
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 65d0f3b5a5a5a5a5a5a5a5a5
 *                         name:
 *                           type: string
 *                           example: Nguyen Van A
 *                         email:
 *                           type: string
 *                           example: a@example.com
 *                         photo:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         phone:
 *                           type: string
 *                           nullable: true
 *                           example: "0987654321"
 *                         dateOfBirth:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2000-01-01T00:00:00.000Z"
 *                         address:
 *                           type: string
 *                           nullable: true
 *                           example: "HCMC"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                         status:
 *                           type: string
 *                           enum: [active, inactive]
 *                           example: active
 *                         streakCount:
 *                           type: integer
 *                           example: 3
 *                         bestStreak:
 *                           type: integer
 *                           example: 10
 *                         lastStreakDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2026-02-25T00:00:00.000Z"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-01T10:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-25T12:00:00.000Z"
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Bạn chưa đăng nhập
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: User không tồn tại
 */

router.get("/me", protect, userController.getMeProfile);
/**
 * @openapi
 * /api/v1/users/updateMyPassword:
 *   patch:
 *     summary: Update my password
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
 *                 example: oldPass123
 *               newPassword:
 *                 type: string
 *                 example: newPass123
 *               confirmPassword:
 *                 type: string
 *                 example: newPass123
 *     responses:
 *       200:
 *         description: Success
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
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad Request (missing fields / confirm not match / social account has no password)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: confirmPassword không khớp
 *       401:
 *         description: Unauthorized (invalid token / current password wrong)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Mật khẩu hiện tại không đúng
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: User không tồn tại
 */
router.patch("/updateMyPassword", protect, userController.updateMyPassword);
module.exports = router;
