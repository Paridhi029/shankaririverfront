/* ==========================================================================
   Booking page: availability search -> price quote -> guest details -> payment
   All availability and price values come from the backend.
   ========================================================================== */

// Data of the current booking attempt (kept in one simple object)
const bookingState = {
  roomType: "",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  numberOfRooms: 1,
  price: null,
};

// Fill the room type dropdown from the database
async function loadRoomTypes() {
  const select = document.getElementById("roomType");
  if (!select) return;
  let rooms;
  try {
    rooms = await apiGet("/api/rooms");
    if (!Array.isArray(rooms) || rooms.length === 0) throw new Error("empty");
  } catch (err) {
    // Backend not reachable -> use the room list from config.js so the guest
    // can still choose a room type
    rooms = SITE_CONFIG.fallbackRooms;
  }

  select.innerHTML = rooms
    .map((r) => `<option value="${r.type}">${r.name} (from ${money(r.price)})</option>`)
    .join("");

  // Preselect the room type coming from the rooms page
  const wanted = new URLSearchParams(location.search).get("roomType");
  if (wanted) {
    const match = rooms.find((r) => r.type === wanted || r.name === wanted);
    if (match) select.value = match.type;
  }
  bookingState.roomType = select.value;
}

// Step 1: check availability and get the backend price
async function handleSearch(e) {
  e.preventDefault();

  const form = e.target;
  const msg = document.getElementById("searchMessage");
  const summary = document.getElementById("summarySection");

  const checkIn = form.checkIn.value;
  const checkOut = form.checkOut.value;
  const adults = Number(form.adults.value);
  const children = Number(form.children.value);
  const numberOfRooms = Number(form.numberOfRooms.value);
  const roomType = form.roomType.value;

  // Basic frontend validation (the backend validates again)
  if (!checkIn || !checkOut) return showMessage(msg, "Please select both dates", "error");
  if (new Date(checkOut) <= new Date(checkIn))
    return showMessage(msg, "Check-out must be after check-in", "error");
  if (numberOfRooms < 1) return showMessage(msg, "Number of rooms must be positive", "error");
  if (adults < 1) return showMessage(msg, "At least one adult is required", "error");
  if (children < 0) return showMessage(msg, "Invalid number of children", "error");
  if (!roomType) return showMessage(msg, "Please select a room type", "error");
  if (adults > numberOfRooms * 2 || children > numberOfRooms || adults + children > numberOfRooms * 3)
    return showMessage(msg, "Each Suite Room allows up to 2 adults and 1 child. Please add more rooms.", "error");
  if (checkIn < todayISO()) return showMessage(msg, "Check-in cannot be in the past", "error");
  if (!withinBookingWindow(checkOut))
    return showMessage(
      msg,
      `Bookings are accepted up to ${SITE_CONFIG.bookingWindowMonths} months in advance (until ${formatDate(maxBookingISO())}). Please call us for later dates.`,
      "error"
    );

  showMessage(msg, "Checking availability...", "");
  summary.classList.add("hidden");

  try {
    const data = await apiPost("/api/bookings/quote", {
        roomType,
        checkIn,
        checkOut,
        adults,
        children,
        numberOfRooms,
      });

    Object.assign(bookingState, {
      roomType,
      checkIn,
      checkOut,
      adults,
      children,
      numberOfRooms,
      price: data.price,
    });

    const left = data.availability.availableRooms;
    showMessage(
      msg,
      `Suite Room is available for your selected dates. ${left} Suite Room${left === 1 ? "" : "s"} available - ${money(data.price.pricePerNight)} per room/night x ${data.price.numberOfNights} night(s) x ${numberOfRooms} room(s) = ${money(data.price.roomCharges)}.`,
      "success"
    );
    renderSummary(data.price);
    summary.classList.remove("hidden");
    summary.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    // Sold out / validation errors come straight from the backend.
    // Network or server problems get a clear "try again" message.
    showMessage(
      msg,
      err.offline ? "We couldn't check availability right now. Please try again." : err.message,
      "error"
    );
  }
}

// Step 2: booking summary (prices are exactly what the backend returned)
function renderSummary(price) {
  const nights = price.breakdown
    .map((n) => `<tr><td>${formatDate(n.date)} (${n.seasonName})</td><td>${money(n.pricePerNight)}</td></tr>`)
    .join("");

  document.getElementById("summaryStay").innerHTML = `
    <table class="summary-table">
      <tr><th>Check-in</th><td>${formatDate(bookingState.checkIn)}</td></tr>
      <tr><th>Check-out</th><td>${formatDate(bookingState.checkOut)}</td></tr>
      <tr><th>Room</th><td>${bookingState.roomType}</td></tr>
      <tr><th>Number of rooms</th><td>${bookingState.numberOfRooms}</td></tr>
      <tr><th>Guests</th><td>${bookingState.adults} adults, ${bookingState.children} children</td></tr>
      <tr><th>Nights</th><td>${price.numberOfNights}</td></tr>
    </table>`;

  document.getElementById("summaryPrice").innerHTML = `
    <table class="summary-table">
      <tr><th colspan="2">Price per night (seasonal pricing)</th></tr>
      ${nights}
      <tr><th>Room charges (${bookingState.numberOfRooms} room(s))</th><td>${money(price.roomCharges)}</td></tr>
      <tr><th>Tax (${price.taxRate}%)</th><td>${money(price.tax)}</td></tr>
      <tr class="total"><td>Total amount</td><td>${money(price.totalAmount)}</td></tr>
    </table>`;
}

// Step 3: guest details -> create the Razorpay order (see payment.js)
async function handlePayment(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("payMessage");

  const guest = {
    customerName: form.customerName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
  };

  if (guest.customerName.length < 2) return showMessage(msg, "Please enter your name", "error");
  if (!/^\S+@\S+\.\S+$/.test(guest.email)) return showMessage(msg, "Please enter a valid email", "error");
  if (!/^[0-9+\-\s]{8,15}$/.test(guest.phone))
    return showMessage(msg, "Please enter a valid phone number", "error");

  showMessage(msg, "Preparing secure payment...", "");
  await startPayment({ ...bookingState, ...guest }, msg);
}

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  if (!searchForm) return;

  loadRoomTypes();
  searchForm.checkIn.min = todayISO();
  searchForm.checkOut.min = todayISO();
  searchForm.checkIn.max = maxBookingISO();
  searchForm.checkOut.max = maxBookingISO();

  const note = document.getElementById("bookingWindowNote");
  if (note) {
    note.textContent = `Bookings open up to ${SITE_CONFIG.bookingWindowMonths} months ahead (until ${formatDate(maxBookingISO())}).`;
  }

  // Keep the check-out minimum one day after the chosen check-in
  searchForm.checkIn.addEventListener("change", () => {
    if (!searchForm.checkIn.value) return;
    const next = new Date(searchForm.checkIn.value);
    next.setDate(next.getDate() + 1);
    searchForm.checkOut.min = next.toISOString().slice(0, 10);
    if (searchForm.checkOut.value && searchForm.checkOut.value <= searchForm.checkIn.value) {
      searchForm.checkOut.value = searchForm.checkOut.min;
    }
  });
  searchForm.addEventListener("submit", handleSearch);

  document.getElementById("guestForm").addEventListener("submit", handlePayment);
});
