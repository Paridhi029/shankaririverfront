const mongoose = require("mongoose");

const seasonalPriceSchema = new mongoose.Schema(
  {
    roomType: { type: String, required: true }, // Only "Suite" is used (single room type)
    seasonName: { type: String, required: true }, // Normal / Weekend / Peak ...
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pricePerNight: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SeasonalPrice", seasonalPriceSchema);
