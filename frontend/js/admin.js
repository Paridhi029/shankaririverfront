/* ==========================================================================
   Admin panel. Login uses bcrypt + JWT on the backend; the token is kept in
   localStorage and sent with every admin request.
   ========================================================================== */

let token = localStorage.getItem("shankariToken") || "";

function requestedAdminView() {
  const queryView = new URLSearchParams(location.search).get("view");
  if (queryView === "login" || queryView === "dashboard") return queryView;
  return location.pathname.endsWith("/dashboard") ? "dashboard" : "login";
}

function goToAdmin(path) {
  // In the Lovable preview this page is displayed inside the site frame, so
  // navigation belongs to the top-level page. Standalone Express uses itself.
  try {
    if (window.top && window.top !== window) {
      window.top.location.assign(path);
      return;
    }
  } catch (error) {
    console.warn("Could not navigate the parent admin frame", error);
  }
  window.location.assign(path);
}

// GET with the admin token
async function adminGet(path) {
  const res = await fetch(apiUrl(path), { headers: { Authorization: "Bearer " + token } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return logout();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// POST / PUT / DELETE with the admin token
async function adminSend(path, method, body) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return logout();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function logout() {
  localStorage.removeItem("shankariToken");
  token = "";
  goToAdmin(ADMIN_CONFIG.LOGIN_URL);
}

// ---------- Login ----------

async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const msg = document.getElementById("loginMessage");
  const submit = form.querySelector('button[type="submit"]');

  submit.disabled = true;
  submit.textContent = "Signing in...";

  try {
    const response = await fetch(apiUrl("/api/admin/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: form.email.value.trim(),
        password: form.password.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    localStorage.setItem("shankariToken", data.token);
    token = data.token;

    goToAdmin(ADMIN_CONFIG.DASHBOARD_URL);

  } catch (error) {
    console.error("Admin login error:", error);

    if (msg) {
      msg.textContent = error.message;
      msg.classList.remove("hidden");
      msg.classList.add("message", "error");
    }

  } finally {
    submit.disabled = false;
    submit.textContent = "Login";
  }
}
// ---------- Tabs ----------

function openTab(name) {
  document.querySelectorAll(".admin-tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name)
  );
  document.querySelectorAll(".tab").forEach((t) => t.classList.add("hidden"));
  document.getElementById("tab-" + name).classList.remove("hidden");

  if (name === "dashboard") loadDashboard();
  if (name === "rooms") loadAdminRooms();
  if (name === "bookings") loadAdminBookings();
  if (name === "seasons") loadSeasons();
  if (name === "enquiries") loadEnquiries();
  if (name === "settings") loadSettings();
}

// ---------- Dashboard ----------

async function loadDashboard() {
  const box = document.getElementById("statGrid");
  try {
    const d = await adminGet("/api/admin/dashboard");
    const stats = [
      ["Total rooms", d.totalRooms],
      ["Total bookings", d.totalBookings],
      ["Today's bookings", d.todaysBookings],
      ["Upcoming bookings", d.upcomingBookings],
      ["Confirmed", d.confirmedBookings],
      ["Cancelled", d.cancelledBookings],
      ["Revenue (paid)", money(d.revenue)],
    ];
    box.innerHTML = stats
      .map((s) => `<div class="stat"><span>${s[0]}</span><strong>${s[1]}</strong></div>`)
      .join("");
  } catch (err) {
    box.innerHTML = `<p class="message error">${err.message}</p>`;
  }
}

// ---------- Rooms ----------

async function loadAdminRooms() {
  const box = document.getElementById("roomsTable");
  try {
    const rooms = await adminGet("/api/admin/rooms");
    box.innerHTML = `
      <table class="admin-table">
        <tr><th>Name</th><th>Type</th><th>Price</th><th>Capacity</th><th>Size</th><th>Total rooms</th><th>Images</th><th>Amenities</th><th>Status</th><th></th></tr>
        ${rooms
          .map(
            (r) => `
          <tr data-id="${r._id}">
            <td><input value="${r.name}" data-f="name" /></td>
            <td><input value="${r.type}" data-f="type" style="width:80px" /></td>
            <td><input type="number" value="${r.price}" data-f="price" style="width:80px" /></td>
            <td><input type="number" value="${r.capacity}" data-f="capacity" style="width:60px" /></td>
            <td><input value="${r.size}" data-f="size" style="width:70px" /></td>
            <td><input type="number" value="${r.totalRooms}" data-f="totalRooms" style="width:60px" /></td>
            <td><input value="${r.images.join(", ")}" data-f="images" /></td>
            <td><textarea data-f="amenities" rows="2">${r.amenities.join(", ")}</textarea></td>
            <td>
              <select data-f="status">
                <option ${r.status === "active" ? "selected" : ""}>active</option>
                <option ${r.status === "inactive" ? "selected" : ""}>inactive</option>
              </select>
            </td>
            <td>
              <button class="btn btn-small" onclick="saveRoom('${r._id}')">Save</button>
              <button class="btn btn-small btn-outline" onclick="deleteRoom('${r._id}')">Delete</button>
            </td>
          </tr>
          <tr><td colspan="10"><textarea data-id="${r._id}" data-f="description" rows="2" style="width:100%">${r.description}</textarea></td></tr>`
          )
          .join("")}
      </table>`;
  } catch (err) {
    box.innerHTML = `<p class="message error">${err.message}</p>`;
  }
}

function readRoomRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const body = {};
  row.querySelectorAll("[data-f]").forEach((el) => (body[el.dataset.f] = el.value));
  body.price = Number(body.price);
  body.capacity = Number(body.capacity);
  body.totalRooms = Number(body.totalRooms);
  body.images = body.images.split(",").map((s) => s.trim()).filter(Boolean);
  body.amenities = body.amenities.split(",").map((s) => s.trim()).filter(Boolean);
  const desc = document.querySelector(`textarea[data-id="${id}"][data-f="description"]`);
  if (desc) body.description = desc.value;
  return body;
}

async function saveRoom(id) {
  try {
    await adminSend("/api/admin/rooms/" + id, "PUT", readRoomRow(id));
    alert("Room saved");
    loadAdminRooms();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteRoom(id) {
  if (!confirm("Delete this room type?")) return;
  await adminSend("/api/admin/rooms/" + id, "DELETE");
  loadAdminRooms();
}

async function handleAddRoom(e) {
  e.preventDefault();
  const f = e.target;
  try {
    await adminSend("/api/admin/rooms", "POST", {
      name: f.name.value,
      type: f.type.value,
      price: Number(f.price.value),
      capacity: Number(f.capacity.value),
      size: f.size.value,
      totalRooms: Number(f.totalRooms.value),
      description: f.description.value,
      images: f.images.value.split(",").map((s) => s.trim()).filter(Boolean),
      amenities: f.amenities.value.split(",").map((s) => s.trim()).filter(Boolean),
    });
    f.reset();
    loadAdminRooms();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Bookings ----------

async function loadAdminBookings() {
  const box = document.getElementById("bookingsTable");
  const search = document.getElementById("bookingSearch").value.trim();
  try {
    const list = await adminGet("/api/admin/bookings?search=" + encodeURIComponent(search));
    box.innerHTML = `
      <table class="admin-table">
        <tr><th>Booking ID</th><th>Guest</th><th>Contact</th><th>Room</th><th>Dates</th><th>Guests</th><th>Amount</th><th>Payment</th><th>Status</th><th>Razorpay Payment ID</th><th></th></tr>
        ${list
          .map(
            (b) => `
          <tr>
            <td>${b.bookingId}</td>
            <td>${b.customerName}</td>
            <td>${b.email}<br />${b.phone}</td>
            <td>${b.roomType} x${b.numberOfRooms}</td>
            <td>${formatDate(b.checkIn)}<br />${formatDate(b.checkOut)}</td>
            <td>${b.adults}A ${b.children}C</td>
            <td>${money(b.totalAmount)}</td>
            <td>${b.paymentStatus}</td>
            <td>${b.bookingStatus}</td>
            <td>${b.razorpayPaymentId || "-"}</td>
            <td>${
              b.bookingStatus === "Confirmed"
                ? `<button class="btn btn-small btn-outline" onclick="cancelBookingAdmin('${b._id}')">Cancel</button>`
                : ""
            }</td>
          </tr>`
          )
          .join("")}
      </table>`;
  } catch (err) {
    box.innerHTML = `<p class="message error">${err.message}</p>`;
  }
}

async function cancelBookingAdmin(id) {
  if (!confirm("Cancel this booking? (refund is handled separately)")) return;
  try {
    await adminSend("/api/admin/bookings/" + id + "/cancel", "POST");
    loadAdminBookings();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Seasonal pricing ----------

async function loadSeasons() {
  const box = document.getElementById("seasonsTable");
  try {
    const list = await adminGet("/api/admin/seasons");
    box.innerHTML = `
      <table class="admin-table">
        <tr><th>Room type</th><th>Season</th><th>Start</th><th>End</th><th>Price / night</th><th></th></tr>
        ${list
          .map(
            (s) => `
          <tr data-id="${s._id}">
            <td><input value="${s.roomType}" data-f="roomType" style="width:90px" /></td>
            <td><input value="${s.seasonName}" data-f="seasonName" /></td>
            <td><input type="date" value="${new Date(s.startDate).toISOString().slice(0, 10)}" data-f="startDate" /></td>
            <td><input type="date" value="${new Date(s.endDate).toISOString().slice(0, 10)}" data-f="endDate" /></td>
            <td><input type="number" value="${s.pricePerNight}" data-f="pricePerNight" style="width:90px" /></td>
            <td>
              <button class="btn btn-small" onclick="saveSeason('${s._id}')">Save</button>
              <button class="btn btn-small btn-outline" onclick="deleteSeason('${s._id}')">Delete</button>
            </td>
          </tr>`
          )
          .join("")}
      </table>`;
  } catch (err) {
    box.innerHTML = `<p class="message error">${err.message}</p>`;
  }
}

function readRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const body = {};
  row.querySelectorAll("[data-f]").forEach((el) => (body[el.dataset.f] = el.value));
  return body;
}

async function saveSeason(id) {
  const body = readRow(id);
  body.pricePerNight = Number(body.pricePerNight);
  try {
    await adminSend("/api/admin/seasons/" + id, "PUT", body);
    alert("Seasonal price saved");
    loadSeasons();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteSeason(id) {
  if (!confirm("Delete this seasonal price?")) return;
  await adminSend("/api/admin/seasons/" + id, "DELETE");
  loadSeasons();
}

async function handleAddSeason(e) {
  e.preventDefault();
  const f = e.target;
  try {
    await adminSend("/api/admin/seasons", "POST", {
      roomType: f.roomType.value,
      seasonName: f.seasonName.value,
      startDate: f.startDate.value,
      endDate: f.endDate.value,
      pricePerNight: Number(f.pricePerNight.value),
    });
    f.reset();
    loadSeasons();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Enquiries ----------

async function loadEnquiries() {
  const box = document.getElementById("enquiriesTable");
  try {
    const list = await adminGet("/api/admin/enquiries");
    box.innerHTML = `
      <table class="admin-table">
        <tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Status</th></tr>
        ${list
          .map(
            (e) => `
          <tr>
            <td>${formatDate(e.createdAt)}</td>
            <td>${e.name}</td>
            <td>${e.email}</td>
            <td>${e.phone || "-"}</td>
            <td>${e.message}</td>
            <td>
              <select onchange="updateEnquiry('${e._id}', this.value)">
                ${["New", "Read", "Closed"]
                  .map((s) => `<option ${e.status === s ? "selected" : ""}>${s}</option>`)
                  .join("")}
              </select>
            </td>
          </tr>`
          )
          .join("")}
      </table>`;
  } catch (err) {
    box.innerHTML = `<p class="message error">${err.message}</p>`;
  }
}

async function updateEnquiry(id, status) {
  await adminSend("/api/admin/enquiries/" + id, "PUT", { status });
}

// ---------- Settings (cancellation + website content) ----------

async function loadSettings() {
  const form = document.getElementById("settingsForm");
  try {
    const s = await adminGet("/api/admin/settings");
    form.cancellationEnabled.value = String(s.cancellationEnabled);
    form.cancellationDeadlineHours.value = s.cancellationDeadlineHours;
    form.refundPercentage.value = s.refundPercentage;
    form.cancellationPolicyText.value = s.cancellationPolicyText;
    form.aboutText.value = s.aboutText;
    form.contactPhone.value = s.contactPhone;
    form.contactEmail.value = s.contactEmail;
    form.contactAddress.value = s.contactAddress;
    form.galleryImages.value = s.galleryImages.join(", ");
  } catch (err) {
    showMessage(document.getElementById("settingsMessage"), err.message, "error");
  }
}

async function handleSettings(e) {
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById("settingsMessage");
  try {
    await adminSend("/api/admin/settings", "PUT", {
      cancellationEnabled: f.cancellationEnabled.value === "true",
      cancellationDeadlineHours: Number(f.cancellationDeadlineHours.value),
      refundPercentage: Number(f.refundPercentage.value),
      cancellationPolicyText: f.cancellationPolicyText.value,
      aboutText: f.aboutText.value,
      contactPhone: f.contactPhone.value,
      contactEmail: f.contactEmail.value,
      contactAddress: f.contactAddress.value,
      galleryImages: f.galleryImages.value.split(",").map((s) => s.trim()).filter(Boolean),
    });
    showMessage(msg, "Settings saved", "success");
  } catch (err) {
    showMessage(msg, err.message, "error");
  }
}

// ---------- Start ----------

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const addRoomForm = document.getElementById("addRoomForm");
  const addSeasonForm = document.getElementById("addSeasonForm");
  const settingsForm = document.getElementById("settingsForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const bookingSearchBtn = document.getElementById("bookingSearchBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (addRoomForm) {
    addRoomForm.addEventListener("submit", handleAddRoom);
  }

  if (addSeasonForm) {
    addSeasonForm.addEventListener("submit", handleAddSeason);
  }

  if (settingsForm) {
    settingsForm.addEventListener("submit", handleSettings);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (bookingSearchBtn) {
    bookingSearchBtn.addEventListener("click", loadAdminBookings);
  }

  document.querySelectorAll(".admin-tabs button").forEach(function (button) {
    button.addEventListener("click", function () {
      openTab(button.dataset.tab);
    });
  });

  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");

  const view = requestedAdminView();

  if (view === "dashboard" && token) {
    loginSection.classList.add("hidden");
    panelSection.classList.remove("hidden");
    openTab("dashboard");
  } else {
    loginSection.classList.remove("hidden");
    panelSection.classList.add("hidden");
  }
});