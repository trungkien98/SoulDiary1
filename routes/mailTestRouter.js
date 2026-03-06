const express = require("express");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Testing
 *     description: 🧪 Testing utilities for development | Công cụ kiểm tra phát triển
 */

/**
 * @openapi
 * /api/v1/test/test-email:
 *   get:
 *     tags: [Testing]
 *     summary: Test email sending | Kiểm tra gửi email
 *     description: Send a test email to verify Mailtrap/email configuration is working | Gửi email kiểm tra
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sent! Check Mailtrap inbox.
 *       500:
 *         description: Email sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Failed to send email
 *               statusCode: 500
 */
router.get("/test-email", async (req, res, next) => {
  try {
    await sendEmail({
      to: "test@example.com",
      subject: "Mailtrap test",
      html: "<h2>Hello from SoulDiary ✅</h2>",
    });
    res.json({ ok: true, message: "Sent! Check Mailtrap inbox." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
