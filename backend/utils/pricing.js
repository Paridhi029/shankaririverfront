const SeasonalPrice = require("../models/SeasonalPrice");
const Room = require("../models/Room");

// Returns an array of dates (one per night) between checkIn and checkOut
function getNights(checkIn, checkOut) {
  const nights = [];
  const d = new Date(checkIn);
  d.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);
  while (d < end) {
    nights.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return nights;
}

// Calculates the price date-by-date using seasonal prices (fallback: room base price)
async function calculatePrice(roomType, checkIn, checkOut, numberOfRooms) {
  const room = await Room.findOne({ type: roomType });
  if (!room) throw new Error("Room type not found");

  const seasons = await SeasonalPrice.find({ roomType });
  const nights = getNights(checkIn, checkOut);

  const breakdown = [];
  let roomChargesPerRoom = 0;

  for (const night of nights) {
    // find a season that contains this night
    const season = seasons.find(
      (s) => night >= new Date(s.startDate).setHours(0, 0, 0, 0) && night <= new Date(s.endDate).setHours(23, 59, 59, 999)
    );
    const price = season ? season.pricePerNight : room.price;
    breakdown.push({
      date: night.toISOString().slice(0, 10),
      seasonName: season ? season.seasonName : "Base Price",
      pricePerNight: price,
    });
    roomChargesPerRoom += price;
  }

  const numberOfNights = nights.length;
  const roomCharges = roomChargesPerRoom * numberOfRooms;

  // TAX_RATE may be written as a percent (12) or a fraction (0.12); both mean 12%
  let taxRate = Number(process.env.TAX_RATE || 0);
  if (taxRate > 0 && taxRate < 1) taxRate = Math.round(taxRate * 10000) / 100;
  const tax = Math.round(roomCharges * (taxRate / 100));
  const totalAmount = roomCharges + tax;

  const pricePerNight = numberOfNights > 0 ? Math.round(roomChargesPerRoom / numberOfNights) : 0;

  return {
    roomType,
    numberOfRooms,
    numberOfNights,
    pricePerNight,
    breakdown,
    roomCharges,
    taxRate,
    tax,
    totalAmount,
  };
}

module.exports = { calculatePrice, getNights };
