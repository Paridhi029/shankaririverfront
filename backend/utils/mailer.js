/* ==========================================================================
   EMAIL SENDING (enquiries + notifications)

   Uses plain SMTP through nodemailer, so it works with Gmail, Zoho, Outlook
   or any provider. All credentials live in backend/.env:

     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, RESORT_EMAIL

   For Gmail you must use an App Password (Google Account -> Security ->
   2-Step Verification -> App passwords), not your normal password.

   If SMTP is not configured, the website still works: the enquiry is saved in
   the database and the server logs a clear warning instead of crashing.
   ========================================================================== */
const nodemailer = require("nodemailer");

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Send an email. Never throws - returns { sent: boolean, error?: string }.
 */
async function sendMail({ to, subject, text, html, replyTo }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("[mail] SMTP is not configured - email not sent:", subject);
    return { sent: false, error: "SMTP not configured" };
  }
  try {
    await tx.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: to || process.env.RESORT_EMAIL || process.env.ADMIN_EMAIL,
      subject,
      text,
      html,
      replyTo,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Failed to send email:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendMail, isMailConfigured: isConfigured };
