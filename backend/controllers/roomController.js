const Room = require("../models/Room");
const { getAvailabilityForAll, getAvailability } = require("../utils/availability");

// GET /api/rooms
async function getRooms(req, res) {
  const rooms = await Room.find({ status: "active" }).sort({ price: 1 });
  res.json(rooms);
}

// GET /api/rooms/:id
async function getRoom(req, res) {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json(room);
}

// GET /api/rooms/availability?checkIn=&checkOut=&roomType=
async function availability(req, res) {
  const { checkIn, checkOut, roomType } = req.query;
  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: "checkIn and checkOut are required" });
  }
  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(400).json({ message: "Check-out must be after check-in" });
  }
  if (roomType) {
    return res.json([await getAvailability(roomType, checkIn, checkOut)]);
  }
  res.json(await getAvailabilityForAll(checkIn, checkOut));
}

module.exports = { getRooms, getRoom, availability };
