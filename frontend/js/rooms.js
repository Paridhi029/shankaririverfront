/* ==========================================================================
   Rooms listing + room details. Room data always comes from MongoDB.
   ========================================================================== */

// Build one room card
function roomCardHtml(room) {
  return `
    <article class="card">
      <img src="${imagePath(room.images[0])}" alt="${room.name}" loading="lazy" />
      <div class="card-body">
        <span class="tag">${room.type}</span>
        <h3>${room.name}</h3>
        <p class="muted">Up to ${room.capacity} guests</p>
        <p class="muted">${room.description.slice(0, 110)}...</p>
        <p class="price">From ${money(room.price)} <span class="muted" style="font-size:.85rem">/ night</span></p>
        <div class="card-actions">
          <a class="btn btn-small btn-outline" href="room-details.html?id=${room._id}">View Details</a>
          <a class="btn btn-small" href="booking.html?roomType=${encodeURIComponent(room.type)}">Book Now</a>
        </div>
      </div>
    </article>`;
}

// Load all rooms into a container
async function loadRooms(containerId, limit) {
  const box = document.getElementById(containerId);
  if (!box) return;
  let rooms;
  try {
    rooms = await apiGet("/api/rooms");
    if (!Array.isArray(rooms) || rooms.length === 0) throw new Error("empty");
  } catch (err) {
    rooms = SITE_CONFIG.fallbackRooms; // backend not reachable
  }
  if (limit) rooms = rooms.slice(0, limit);
  box.innerHTML = rooms.map(roomCardHtml).join("");
}

// Load a single room (room-details.html)
async function loadRoomDetails() {
  const box = document.getElementById("roomDetails");
  if (!box) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    box.innerHTML = '<p class="message error">No room selected.</p>';
    return;
  }

  try {
    let room;
    try {
      room = await apiGet("/api/rooms/" + id);
    } catch (err) {
      room = SITE_CONFIG.fallbackRooms.find((r) => r._id === id || r.type === id);
      if (!room) throw err;
    }

    box.innerHTML = `
      <div class="split">
        <img src="${imagePath(room.images[0])}" alt="${room.name}" />
        <div>
          <span class="tag">${room.type} Room</span>
          <h1>${room.name}</h1>
          <p class="muted">${room.description}</p>
          <table class="summary-table" style="margin-top:18px">
            <tr><th>Room size</th><td>${room.size}</td></tr>
            <tr><th>Capacity</th><td>Up to ${room.capacity} guests (suggested 2 adults + 1 child)</td></tr>
            <tr><th>Starting price</th><td>${money(room.price)} per night</td></tr>
            <tr><th>Rooms of this type</th><td>${room.totalRooms}</td></tr>
          </table>
          <h3 style="margin-top:22px">Amenities</h3>
          <ul class="amenities">${room.amenities.map((a) => `<li>${a}</li>`).join("")}</ul>
          <div class="card-actions" style="margin-top:24px">
            <a class="btn" href="booking.html?roomType=${encodeURIComponent(room.type)}">Book Now</a>
          </div>
        </div>
      </div>

      <div class="section-head" style="margin-top:70px">
        <p class="eyebrow">Photographs</p>
        <h2>Room Gallery</h2>
      </div>
      <div class="gallery-grid">
        ${room.images.map((img) => `<img src="${imagePath(img)}" alt="${room.name}" loading="lazy" />`).join("")}
      </div>`;

    document.title = room.name + " | " + SITE_CONFIG.resortName;
    setupRoomAvailabilityCheck(room.type);
  } catch (err) {
    box.innerHTML = `<p class="message error">Could not load this room: ${err.message}</p>`;
  }
}

// Availability box on the room details page (checked by the backend)
function setupRoomAvailabilityCheck(roomType) {
  const form = document.getElementById("availabilityForm");
  if (!form) return;

  const result = document.getElementById("availabilityResult");
  form.checkIn.min = todayISO();
  form.checkOut.min = todayISO();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const checkIn = form.checkIn.value;
    const checkOut = form.checkOut.value;

    if (!checkIn || !checkOut) return showMessage(result, "Please select both dates", "error");
    if (new Date(checkOut) <= new Date(checkIn))
      return showMessage(result, "Check-out must be after check-in", "error");

    try {
      const data = await apiGet(
        `/api/rooms/availability?roomType=${encodeURIComponent(roomType)}&checkIn=${checkIn}&checkOut=${checkOut}`
      );
      const a = data[0];
      if (a.availableRooms > 0) {
        showMessage(
          result,
          `${a.availableRooms} ${a.roomType} room(s) available out of ${a.totalRooms} for these dates.`,
          "success"
        );
      } else {
        showMessage(result, "Sold Out for the selected dates.", "error");
      }
    } catch (err) {
      showMessage(result, err.message, "error");
    }
  });
}
