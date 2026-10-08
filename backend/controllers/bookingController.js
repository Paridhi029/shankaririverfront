const Booking = require("../models/Booking");
const { getAvailability } = require("../utils/availability");
const { calculatePrice } = require("../utils/pricing");
const { validateSearch } = require("../utils/validate");

// POST /api/bookings/quote
// Backend checks availability and calculates the price. The frontend only displays it.
async function quote(req, res) {
  const error = validateSearch(req.body);
  if (error) return res.status(400).json({ message: error });

  const { roomType, checkIn, checkOut } = req.body;
  const numberOfRooms = Number(req.body.numberOfRooms || 1);
  if (!roomType) return res.status(400).json({ message: "Room type is required" });

  const avail = await getAvailability(roomType, checkIn, checkOut);
  if (avail.availableRooms < numberOfRooms) {
    return res.status(409).json({
      message:
        avail.availableRooms === 0
          ? "Sorry, Suite Rooms are fully booked for these dates."
          : `Only ${avail.availableRooms} room(s) available for the selected dates`,
      availability: avail,
    });
  }

  const price = await calculatePrice(roomType, checkIn, checkOut, numberOfRooms);
  res.json({ availability: avail, price });
}

module.exports = { quote };
