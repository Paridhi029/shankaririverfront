const express = require("express");
const { quote } = require("../controllers/bookingController");

const router = express.Router();

// Availability + price quote for the booking page.
// NOTE: customers can no longer cancel a booking themselves. Cancellation
// requests are sent to the resort by email/phone and processed by the admin
// (see POST /api/admin/bookings/:id/cancel).
router.post("/quote", quote);

module.exports = router;
