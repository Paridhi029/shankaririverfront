// Simple shared validation helpers

function validateSearch(body) {
  const { checkIn, checkOut, adults, children, numberOfRooms } = body;

  if (!checkIn || !checkOut) return "Check-in and check-out dates are required";

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return "Invalid dates";
  if (outDate <= inDate) return "Check-out must be after check-in";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inDate < today) return "Check-in cannot be in the past";

  // Bookings are accepted only for the next BOOKING_WINDOW_MONTHS months
  const months = Number(process.env.BOOKING_WINDOW_MONTHS || 3);
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + months);
  if (outDate > maxDate)
    return `Bookings are accepted up to ${months} months in advance. Please contact the resort for later dates.`;

  if (numberOfRooms !== undefined && (Number(numberOfRooms) < 1 || isNaN(Number(numberOfRooms))))
    return "Number of rooms must be positive";
  if (adults !== undefined && (Number(adults) < 1 || isNaN(Number(adults))))
    return "At least one adult is required";
  if (children !== undefined && (Number(children) < 0 || isNaN(Number(children))))
    return "Invalid number of children";

  // Each Suite Room: max 2 adults + 1 child
  const r = Number(numberOfRooms || 1), a = Number(adults || 1), c = Number(children || 0);
  if (a > r * 2 || c > r || a + c > r * 3)
    return "Each Suite Room allows up to 2 adults and 1 child. Please add more rooms.";

  return null;
}

function validateGuest(body) {
  if (!body.customerName || body.customerName.trim().length < 2) return "Please enter a valid name";
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) return "Please enter a valid email";
  if (!body.phone || !/^[0-9+\-\s]{8,15}$/.test(body.phone)) return "Please enter a valid phone number";
  return null;
}

module.exports = { validateSearch, validateGuest };
