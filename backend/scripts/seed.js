/*
 * Seed script: creates the admin account and the single Suite Room type. Run it once with:  npm run seed
 *
 * Usage: node scripts/seed.js  [adminEmail] [adminPassword]
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const User = require("../models/User");
const Room = require("../models/Room");
const Setting = require("../models/Setting");

const AMENITIES = [
  "Air Conditioning",
  "Wi-Fi",
  "Electric Kettle",
  "Breakfast included",
  "Room Service",
  "Refrigerator",
  "Sofa",
  "Table",
  "Chairs",
  "Bed",
  "Wardrobe",
];

async function run() {
  await connectDB();

  // Admin credentials come from backend/.env (ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD).
  // You may also pass them on the command line: node scripts/seed.js email password
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    console.error("Missing ADMIN_INITIAL_PASSWORD in backend/.env - cannot create the admin account.");
    process.exit(1);
  }

  // Admin user
  let admin = await User.findOne({ email });
  if (!admin) {
    const hash = await bcrypt.hash(password, 10);
    admin = await User.create({ name: "Resort Admin", email, password: hash, role: "admin" });
    console.log(`Admin created -> ${email} (password taken from backend/.env)`);
  } else {
    admin.password = await bcrypt.hash(password, 10);
    admin.role = "admin";
    await admin.save();
    console.log("Admin password updated for:", email);
  }

  // Rooms: ONE room type only - 9 Suite Rooms at Rs 2,500 per night.
  // Any older room type (for example an old Deluxe room) is removed so the
  // website and the database always show exactly one room type.
  const SUITE = {
    name: "Suite Room",
    type: "Suite",
    description:
      "A spacious 240 sq. m. riverfront-facing suite with warm interiors and a seating area, ideal for a couple with one child. Breakfast is included with the stay.",
    price: 2500,
    capacity: 3, // 2 adults + 1 child
    size: "240 sq. m.",
    amenities: AMENITIES,
    totalRooms: 9,
    images: ["luxury-room.jpg", "luxury-room-2.jpg", "luxury-room-bathroom.jpg"],
    status: "active",
  };

  await Room.deleteMany({ type: { $ne: "Suite" } });
  await Room.findOneAndUpdate({ type: "Suite" }, SUITE, { upsert: true, new: true });
  console.log("Suite Room ready (9 rooms, Rs 2500 per night) - only room type in the database");

  // No seasonal or peak pricing: tariffs stay the same all year.
  // The admin dashboard can still add seasonal rates later if needed.

  // Settings document
  if (!(await Setting.findOne({ key: "site" }))) {
    await Setting.create({ key: "site" });
    console.log("Settings created");
  }

  await mongoose.connection.close();
  console.log("Seed finished");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
