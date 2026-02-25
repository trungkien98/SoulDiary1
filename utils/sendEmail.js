const nodemailer = require("nodemailer");
const { htmlToText } = require("html-to-text");
const pug = require("pug");

module.exports = class Email {
  constructor(user, emailContent) {
    this.to = user.email;
    this.firstName = user.name;
    this.emailContent = emailContent;
    this.from = `SoulDiary <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // Tùy chọn đăng nhập
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
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

    await this.newTransport().sendMail(mailOptions);
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
