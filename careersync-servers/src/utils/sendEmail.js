// src/utils/sendEmail.js

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.error("sendEmail ERROR: missing recipient email");
    throw new Error("Recipient email missing");
  }

  const msg = {
    to: to.trim(),
    from: process.env.EMAIL_FROM,
    subject,
    html,
  };

  return sgMail.send(msg);
};

module.exports = sendEmail;
