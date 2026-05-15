const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const sendMail = async (options) => {
  if (!transporter) {
    console.log(`📡 [Email Simulation] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }
  return transporter.sendMail({
    from: `"YakshaNidhi" <${process.env.SMTP_USER}>`,
    ...options
  });
};

module.exports = { sendMail, transporter };
