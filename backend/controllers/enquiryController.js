const Enquiry = require("../models/Enquiry");
const { sendMail, isMailConfigured } = require("../utils/mailer");

const esc = (s) =>
  String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// POST /api/enquiries
async function createEnquiry(req, res) {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email and message are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email" });
  }

  const enquiry = await Enquiry.create({ name, email, phone: phone || "", message });

  // Notify the resort inbox (RESORT_EMAIL in backend/.env). The enquiry is
  // already stored, so email problems never fail the guest's submission.
  const to = process.env.RESORT_EMAIL || process.env.ADMIN_EMAIL;
  const mail = await sendMail({
    to,
    replyTo: email,
    subject: `New website enquiry from ${name}`,
    text: `New enquiry from the Shankari Riverfront Resort website

Name:    ${name}
Email:   ${email}
Phone:   ${phone || "-"}

Message:
${message}

Enquiry ID: ${enquiry._id}`,
    html: `<h2>New website enquiry</h2>
<table cellpadding="6">
  <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
  <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
  <tr><td><b>Phone</b></td><td>${esc(phone) || "-"}</td></tr>
</table>
<p><b>Message</b><br>${esc(message).replace(/\n/g, "<br>")}</p>
<p style="color:#888">Enquiry ID: ${enquiry._id}</p>`,
  });

  res.status(201).json({
    message: mail.sent
      ? "Enquiry submitted successfully. Our team will contact you shortly."
      : "Enquiry received. Our team will contact you shortly.",
    id: enquiry._id,
    emailed: mail.sent,
    emailConfigured: isMailConfigured(),
  });
}

module.exports = { createEnquiry };
