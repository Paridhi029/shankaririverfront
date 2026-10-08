const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // Only "Suite" is used (single room type)
    description: { type: String, default: "" },
    price: { type: Number, required: true }, // base / starting price per night
    capacity: { type: Number, default: 3 },
    size: { type: String, default: "ADD_ROOM_SIZE" }, // unit not confirmed, editable in admin
    amenities: { type: [String], default: [] },
    totalRooms: { type: Number, default: 1 },
    images: { type: [String], default: [] }, // filenames inside frontend/assets/images/
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
