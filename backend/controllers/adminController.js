const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const SeasonalPrice = require("../models/SeasonalPrice");
const Enquiry = require("../models/Enquiry");
const { getSettings } = require("./contentController");

// ---------- Auth ----------

// POST /api/admin/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email: String(email).toLowerCase(), role: "admin" });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token, name: user.name, email: user.email });
}

// ---------- Dashboard ----------

// GET /api/admin/dashboard
async function dashboard(req, res) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const rooms = await Room.find();
  const totalRooms = rooms.reduce((sum, r) => sum + r.totalRooms, 0);

  const totalBookings = await Booking.countDocuments();
  const todaysBookings = await Booking.countDocuments({
    createdAt: { $gte: startOfToday, $lt: endOfToday },
  });
  const upcomingBookings = await Booking.countDocuments({
    checkIn: { $gte: endOfToday },
    bookingStatus: "Confirmed",
  });
  const confirmedBookings = await Booking.countDocuments({ bookingStatus: "Confirmed" });
  const cancelledBookings = await Booking.countDocuments({ bookingStatus: "Cancelled" });

  const paid = await Booking.find({ paymentStatus: "Paid" });
  const revenue = paid.reduce((sum, b) => sum + b.totalAmount, 0);

  res.json({
    totalRooms,
    totalBookings,
    todaysBookings,
    upcomingBookings,
    confirmedBookings,
    cancelledBookings,
    revenue,
  });
}

// ---------- Rooms ----------

async function listRooms(req, res) {
  res.json(await Room.find().sort({ createdAt: 1 }));
}

async function createRoom(req, res) {
  const room = await Room.create(req.body);
  res.status(201).json(room);
}

async function updateRoom(req, res) {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json(room);
}

async function deleteRoom(req, res) {
  await Room.findByIdAndDelete(req.params.id);
  res.json({ message: "Room deleted" });
}

// ---------- Bookings ----------

// GET /api/admin/bookings?search=
async function listBookings(req, res) {
  const search = (req.query.search || "").trim();
  let filter = {};
  if (search) {
    filter = {
      $or: [
        { bookingId: new RegExp(search, "i") },
        { customerName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
      ],
    };
  }
  res.json(await Booking.find(filter).sort({ createdAt: -1 }).limit(200));
}

// POST /api/admin/bookings/:id/cancel  (admin cancellation, no automatic refund)
async function adminCancelBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.bookingStatus === "Cancelled") {
    return res.status(400).json({ message: "Booking is already cancelled" });
  }
  booking.bookingStatus = "Cancelled";
  booking.cancelledAt = new Date();
  if (booking.paymentStatus === "Paid") booking.paymentStatus = "Refund Pending";
  await booking.save();
  res.json({ message: "Booking cancelled", booking });
}

// ---------- Seasonal prices ----------

async function listSeasons(req, res) {
  res.json(await SeasonalPrice.find().sort({ startDate: 1 }));
}

async function createSeason(req, res) {
  const { roomType, seasonName, startDate, endDate, pricePerNight } = req.body;
  if (!roomType || !seasonName || !startDate || !endDate || !pricePerNight) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: "End date must be after start date" });
  }
  res.status(201).json(await SeasonalPrice.create(req.body));
}

async function updateSeason(req, res) {
  const season = await SeasonalPrice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!season) return res.status(404).json({ message: "Season not found" });
  res.json(season);
}

async function deleteSeason(req, res) {
  await SeasonalPrice.findByIdAndDelete(req.params.id);
  res.json({ message: "Seasonal price deleted" });
}

// ---------- Enquiries ----------

async function listEnquiries(req, res) {
  res.json(await Enquiry.find().sort({ createdAt: -1 }).limit(200));
}

async function updateEnquiry(req, res) {
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
  res.json(enquiry);
}

// ---------- Settings (content + cancellation) ----------

async function getSettingsHandler(req, res) {
  res.json(await getSettings());
}

async function updateSettings(req, res) {
  const setting = await getSettings();
  const allowed = [
    "cancellationEnabled",
    "cancellationDeadlineHours",
    "refundPercentage",
    "cancellationPolicyText",
    "aboutText",
    "contactPhone",
    "contactEmail",
    "contactAddress",
    "galleryImages",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) setting[field] = req.body[field];
  });
  await setting.save();
  res.json(setting);
}

module.exports = {
  login,
  dashboard,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  listBookings,
  adminCancelBooking,
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
  listEnquiries,
  updateEnquiry,
  getSettingsHandler,
  updateSettings,
};
