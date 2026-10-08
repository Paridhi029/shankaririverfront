const crypto = require("crypto");

const Booking = require("../models/Booking");
const { sendMail } = require("../utils/mailer");
const { getAvailability } = require("../utils/availability");
const { calculatePrice } = require("../utils/pricing");
const { validateSearch, validateGuest } = require("../utils/validate");
const {
  getRazorpay,
  isRazorpayConfigured,
  getPublicKeyId,
  getKeySecret,
  NOT_CONFIGURED_MESSAGE,
} = require("../config/razorpay");

// Simple readable booking id, e.g. SHK-8F3K2A
function makeBookingId() {
  return "SHK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}


// Booking confirmation + payment receipt email (guest gets it, resort gets a copy).
// sendMail never throws, so a mail problem can never undo a confirmed booking.
async function sendReceiptEmail(b) {
  const resort = "Shankari Riverfront Resort";
  const d = (x) => new Date(x).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
  const rows = [
    ["Booking ID", b.bookingId],
    ["Guest name", b.customerName],
    ["Email", b.email],
    ["Phone", b.phone],
    ["Room", `${b.roomType} (${b.numberOfRooms} room(s))`],
    ["Check-in", d(b.checkIn)],
    ["Check-out", d(b.checkOut)],
    ["Nights", b.numberOfNights],
    ["Guests", `${b.adults} adults, ${b.children} children`],
    ["Room charges", inr(b.roomCharges)],
    ["Tax", inr(b.tax)],
    ["Total paid", inr(b.totalAmount)],
    ["Payment ID", b.razorpayPaymentId],
    ["Order ID", b.razorpayOrderId],
    ["Payment status", b.paymentStatus],
    ["Booking status", b.bookingStatus],
  ];
  const text = `Dear ${b.customerName},\n\nThank you for booking with ${resort}. Your booking is confirmed and your payment has been received.\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nPlease keep this email as your payment receipt.\n\nWarm regards,\n${resort}`;
  const html = `<div style="font-family:Arial,sans-serif;color:#3c2b21;max-width:600px">
    <h2 style="margin:0 0 6px">${resort}</h2>
    <p>Dear ${b.customerName},<br>Thank you for your booking. Your booking is <strong>confirmed</strong> and your payment has been received.</p>
    <h3 style="margin:18px 0 8px">Booking Confirmation &amp; Payment Receipt</h3>
    <table style="border-collapse:collapse;width:100%">${rows
      .map(([k, v]) => `<tr><th style="text-align:left;padding:6px 8px;border:1px solid #e5ddd0;background:#faf6ef">${k}</th><td style="padding:6px 8px;border:1px solid #e5ddd0">${v}</td></tr>`)
      .join("")}</table>
    <p style="font-size:13px;color:#6b5c4f">Please keep this email as your payment receipt. Payments are processed through the authorised payment gateway configured by the resort.</p>
  </div>`;
  const subject = `Booking Confirmed - ${b.bookingId} - ${resort}`;
  const guest = await sendMail({ to: b.email, subject, text, html, replyTo: process.env.RESORT_EMAIL });
  await sendMail({ to: process.env.RESORT_EMAIL || process.env.ADMIN_EMAIL, subject: "New booking: " + b.bookingId, text, html });
  return guest.sent;
}

// POST /api/payment/create-order
// Availability is checked again here, right before creating the Razorpay order.
async function createOrder(req, res) {
  const dateError = validateSearch(req.body);
  if (dateError) return res.status(400).json({ message: dateError });
  const guestError = validateGuest(req.body);
  if (guestError) return res.status(400).json({ message: guestError });

  const { roomType, checkIn, checkOut, customerName, email, phone } = req.body;
  const numberOfRooms = Number(req.body.numberOfRooms || 1);
  const adults = Number(req.body.adults || 1);
  const children = Number(req.body.children || 0);
  if (!roomType) return res.status(400).json({ message: "Room type is required" });

  const avail = await getAvailability(roomType, checkIn, checkOut);
  if (avail.availableRooms < numberOfRooms) {
    return res.status(409).json({ message: "Selected rooms are no longer available" });
  }

  // Backend calculates the final amount (frontend value is never trusted)
  const price = await calculatePrice(roomType, checkIn, checkOut, numberOfRooms);

  // Razorpay keys missing -> friendly message, no booking is created
  if (!isRazorpayConfigured()) {
    return res.status(503).json({ message: NOT_CONFIGURED_MESSAGE });
  }
  const razorpay = getRazorpay();

  const booking = await Booking.create({
    bookingId: makeBookingId(),
    customerName,
    email: String(email).toLowerCase(),
    phone,
    roomType,
    numberOfRooms,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    adults,
    children,
    pricePerNight: price.pricePerNight,
    numberOfNights: price.numberOfNights,
    roomCharges: price.roomCharges,
    tax: price.tax,
    totalAmount: price.totalAmount,
    paymentStatus: "Pending",
    bookingStatus: "Pending",
  });

  // Double-booking guard: the pending booking now holds the rooms. If another
  // guest grabbed them at the same moment, undo this one.
  const after = await getAvailability(roomType, checkIn, checkOut, booking._id);
  if (after.availableRooms < numberOfRooms) {
    await Booking.deleteOne({ _id: booking._id });
    return res.status(409).json({ message: "Sorry, Suite Rooms are fully booked for these dates." });
  }

  try {
    const order = await razorpay.orders.create({
      amount: price.totalAmount * 100, // paise
      currency: "INR",
      receipt: booking.bookingId,
      notes: { bookingId: booking.bookingId },
    });
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      bookingId: booking.bookingId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getPublicKeyId(), // public key only, the secret never leaves the backend
      guest: { customerName, email, phone },
      price,
    });
  } catch (err) {
    console.error("Razorpay order failed:", err.message);
    booking.paymentStatus = "Failed";
    await booking.save();
    res.status(502).json({ message: "Could not create the payment order. Please try again." });
  }
}

// POST /api/payment/verify
// Verifies the Razorpay signature on the backend, then re-checks availability.
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const expectedSignature = crypto
    .createHmac("sha256", getKeySecret())
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    booking.paymentStatus = "Failed";
    booking.bookingStatus = "Cancelled";
    await booking.save();
    return res.status(400).json({ message: "Payment verification failed" });
  }

  // Final availability check before confirming the booking
  const avail = await getAvailability(
    booking.roomType,
    booking.checkIn,
    booking.checkOut,
    booking._id
  );
  if (avail.availableRooms < booking.numberOfRooms) {
    booking.paymentStatus = "Refund Pending";
    booking.bookingStatus = "Cancelled";
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();
    return res.status(409).json({
      message:
        "Payment received but the rooms were just booked by someone else. The resort will process your refund.",
    });
  }

  booking.razorpayPaymentId = razorpay_payment_id;
  booking.paymentStatus = "Paid";
  booking.bookingStatus = "Confirmed";
  await booking.save();

  const emailSent = await sendReceiptEmail(booking);
  res.json({ message: "Booking confirmed", booking, emailSent });
}

// POST /api/payment/failed  { orderId }
async function paymentFailed(req, res) {
  const { orderId } = req.body;
  const booking = await Booking.findOne({ razorpayOrderId: orderId });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.paymentStatus === "Pending") {
    booking.paymentStatus = "Failed";
    booking.bookingStatus = "Cancelled";
    await booking.save();
  }
  res.json({ message: "Payment marked as failed" });
}

module.exports = { createOrder, verifyPayment, paymentFailed };
