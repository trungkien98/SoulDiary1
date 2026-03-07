const express = require("express");
const Email = require("../utils/sendEmail");

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
 *     description: Send a test email to verify Gmail SMTP configuration is working | Gửi email kiểm tra
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
 *                   example: Test email sent successfully to your Gmail inbox
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
    console.log("📧 Testing email with config:");
    console.log("  MAIL_HOST:", process.env.MAIL_HOST);
    console.log("  MAIL_PORT:", process.env.MAIL_PORT);
    console.log("  MAIL_USER:", process.env.MAIL_USER);
    console.log("  MAIL_FROM:", process.env.MAIL_FROM);

    // Send test email using the Email class
    const testUser = {
      email: process.env.MAIL_FROM,
      name: "Test User"
    };
    
    const emailService = new Email(testUser, "OTP123456");
    await emailService.sendWelcome();

    res.json({
      ok: true,
      message: "✅ Test email sent successfully to " + process.env.MAIL_FROM,
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        from: process.env.MAIL_FROM,
      }
    });
  } catch (err) {
    console.error("❌ Test email error:", err.message);
    res.status(500).json({
      ok: false,
      message: "Failed to send test email: " + err.message,
      error: err.message,
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        from: process.env.MAIL_FROM,
      }
    });
  }
});

/**
 * @openapi
 * /api/v1/mail/email-config:
 *   get:
 *     tags: [Testing]
 *     summary: Check email configuration | Kiểm tra cấu hình email
 *     description: Verify that Gmail SMTP configuration is set up correctly
 *     responses:
 *       200:
 *         description: Configuration is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 config:
 *                   type: object
 */
router.get("/email-config", async (req, res, next) => {
  try {
    res.json({
      ok: true,
      envLoaded: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        user: process.env.MAIL_USER ? "✅ SET" : "❌ NOT SET",
        pass: process.env.MAIL_PASS ? "✅ SET" : "❌ NOT SET",
        from: process.env.MAIL_FROM,
      }
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err.message
    });
  }
});

module.exports = router;
