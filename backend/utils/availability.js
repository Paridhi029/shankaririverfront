const Room = require("../models/Room");
const Booking = require("../models/Booking");

// Bookings that block a room: Confirmed, or Pending and created less than 15 minutes ago
// (unpaid Pending bookings expire after 15 minutes so they do not block rooms forever)
function blockingBookingFilter(roomType, checkIn, checkOut) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return {
    roomType,
    // date overlap: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
    $or: [
      { bookingStatus: "Confirmed" },
      { bookingStatus: "Pending", paymentStatus: "Pending", createdAt: { $gte: fifteenMinutesAgo } },
    ],
  };
}

// Real availability calculated from MongoDB bookings.
// excludeBookingId is used when re-checking availability for a booking that already exists.
async function getAvailability(roomType, checkIn, checkOut, excludeBookingId) {
  const room = await Room.findOne({ type: roomType, status: "active" });
  if (!room) return { roomType, totalRooms: 0, bookedRooms: 0, availableRooms: 0 };

  const filter = blockingBookingFilter(roomType, checkIn, checkOut);
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const bookings = await Booking.find(filter);

  // Count night by night: the busiest night decides how many rooms are free.
  // (Two bookings that touch the search range but never overlap each other
  // must not be added together.)
  let bookedRooms = 0;
  const night = new Date(checkIn);
  night.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);
  while (night < end) {
    const start = night.getTime();
    const stop = start + 24 * 60 * 60 * 1000;
    const used = bookings
      .filter((b) => new Date(b.checkIn).getTime() < stop && new Date(b.checkOut).getTime() > start)
      .reduce((sum, b) => sum + b.numberOfRooms, 0);
    if (used > bookedRooms) bookedRooms = used;
    night.setDate(night.getDate() + 1);
  }
  const availableRooms = Math.max(room.totalRooms - bookedRooms, 0);

  return {
    roomType,
    roomName: room.name,
    totalRooms: room.totalRooms,
    bookedRooms,
    availableRooms,
  };
}

// Availability for every active room type
async function getAvailabilityForAll(checkIn, checkOut) {
  const rooms = await Room.find({ status: "active" });
  const result = [];
  for (const room of rooms) {
    result.push(await getAvailability(room.type, checkIn, checkOut));
  }
  return result;
}

module.exports = { getAvailability, getAvailabilityForAll };
