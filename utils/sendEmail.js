const nodemailer = require("nodemailer");
const { htmlToText } = require("html-to-text");
const pug = require("pug");

// Validate email configuration
const validateEmailConfig = () => {
  const required = ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS", "MAIL_FROM"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }
};

module.exports = class Email {
  constructor(user, emailContent) {
    this.to = user.email;
    this.firstName = user.name;
    this.emailContent = emailContent;
    this.from = process.env.MAIL_FROM;
    validateEmailConfig();
  }

  newTransport() {
    // Gmail SMTP configuration
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      logger: process.env.NODE_ENV === "development",
      debug: process.env.NODE_ENV === "development",
    });
    return transport;
  }

  async send(template, subject) {
    try {
      const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
        firstName: this.firstName,
        emailContent: this.emailContent,
        subject,
      });

      const mailOptions = {
        from: this.from,
        to: this.to,
        subject: subject,
        html: html,
        text: htmlToText(html),
      };

      const transporter = this.newTransport();
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent to ${this.to}:`, info.messageId);
      return info;
    } catch (error) {
      console.error(`❌ Error sending email to ${this.to}:`, error.message);
      throw error;
    }
  }

  // Test email configuration
  static async testConnection() {
    try {
      validateEmailConfig();
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });
      
      await transporter.verify();
      console.log("✅ Email configuration verified successfully");
      return true;
    } catch (error) {
      console.error("❌ Email configuration error:", error.message);
      return false;
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Chào mừng bạn đến với SkyFlow");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Mã đặt lại mật khẩu của bạn (chỉ có giá trị trong 10 phút)",
    );
  }

  async sendLinkResetPass() {
    await this.send(
      "linkResetPass",
      "Link đặt lại mật khẩu của bạn (chỉ có giá trị trong 10 phút)",
    );
  }

  async sendBookingConfirmation() {
    await this.send("bookingConfirmation", "Xác nhận đặt vé thành công");
  }

  async sendContactMail() {
    await this.send("sendContactMail", "Gửi mail thành công");
  }
  async sendNewPassword() {
    await this.send(
      "newPassword", // tên file pug: views/email/newPassword.pug
      "Mật khẩu mới của bạn - SoulDiary",
    );
  }
};

// Thêm thông tin cấu hình tùy chọn
// auth: {
//     type: "OAuth2",
//     clientId: process.env.EMAIL_CLIENT_ID,
//     clientSecret: process.env.EMAIL_CLIENT_SECRET,
//     refreshToken: process.env.EMAIL_REFRESH_TOKEN
// }
