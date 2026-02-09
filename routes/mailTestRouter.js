const express = require("express");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

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
