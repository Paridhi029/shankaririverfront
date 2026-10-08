/* ==========================================================================
   Shared helpers used by every page: navbar, config text, API calls.
   All request errors are turned into friendly guest-facing messages here;
   the technical details stay in the browser console for developers.
   ========================================================================== */

// Build a full API url (base url comes from js/config.js -> apiBaseUrl)
function apiUrl(path) {
  return SITE_CONFIG.apiBaseUrl + path;
}

// Friendly message used when the backend cannot be reached at all
const OFFLINE_MESSAGE =
  "We couldn't reach the booking service. Please try again or contact the resort.";

// Turn any failed response into a readable message
async function readError(res) {
  const data = await res.json().catch(() => ({}));
  if (data && data.message) {
    const e = new Error(data.message);
    if (res.status >= 500) e.offline = true;
    return e;
  }
  console.error("[api] HTTP", res.status, res.url);
  if (res.status === 404 || res.status >= 500) {
    const e = new Error(OFFLINE_MESSAGE);
    e.offline = true;
    return e;
  }
  return new Error("We couldn't complete your request. Please check the details and try again.");
}

// Simple GET request
async function apiGet(path) {
  let res;
  try {
    res = await fetch(apiUrl(path));
  } catch (networkError) {
    console.error("[api] network error", path, networkError);
    const e = new Error(OFFLINE_MESSAGE);
    e.offline = true;
    throw e;
  }
  if (!res.ok) throw await readError(res);
  return res.json().catch(() => ({}));
}

// Simple POST request
async function apiPost(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  let res;
  try {
    res = await fetch(apiUrl(path), { method: "POST", headers, body: JSON.stringify(body) });
  } catch (networkError) {
    console.error("[api] network error", path, networkError);
    const e = new Error(OFFLINE_MESSAGE);
    e.offline = true;
    throw e;
  }
  if (!res.ok) throw await readError(res);
  return res.json().catch(() => ({}));
}

// Format money using the configuration
function money(amount) {
  return SITE_CONFIG.currencySymbol + Number(amount || 0).toLocaleString("en-IN");
}

// Format a date as 12 Sep 2026
function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Full path of an image inside frontend/assets/images/
function imagePath(fileName) {
  return SITE_CONFIG.imagesPath + (fileName || "resort-main.jpg");
}

// Show a message inside an element
function showMessage(el, text, type) {
  if (!el) return;
  el.className = "message " + (type || "");
  el.textContent = text;
  el.classList.remove("hidden");
}

// Today's date as yyyy-mm-dd (used as the minimum for date inputs)
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Last date a guest may select (booking window, default 3 months ahead)
function maxBookingISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + (SITE_CONFIG.bookingWindowMonths || 3));
  return d.toISOString().slice(0, 10);
}

// True when the selected date is inside the allowed booking window
function withinBookingWindow(dateString) {
  return dateString <= maxBookingISO();
}

// Replace [data-config="key"] text with the config value, everywhere.
// Social links with no URL configured are hidden instead of linking nowhere.
function applyConfig() {
  document.querySelectorAll("[data-config]").forEach((el) => {
    const key = el.dataset.config;
    const value = SITE_CONFIG[key];
    const social = ["instagram", "youtube", "whatsapp", "mapsUrl", "mapsDirectionsUrl"].includes(key);

    if (social && !value) {
      const item = el.closest("li") || el;
      item.remove();
      return;
    }
    if (!value) return;

    if (el.tagName === "A") {
      if (el.dataset.configText !== "false") el.textContent = value;
      if (key === "phone") el.href = "tel:" + value;
      else if (key === "email" || key === "adminEmail") el.href = "mailto:" + value;
      else if (social) {
        el.href = value;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
    } else {
      el.textContent = value;
    }
  });
  const year = document.getElementById("footerYear");
  if (year) year.textContent = new Date().getFullYear();
}

// Every address shown on the website opens the resort location in Google Maps.
// A real <a> link is used (never window.open) so it also works inside previews
// and embedded frames, where scripted pop-ups are blocked.
function setupMapLinks() {
  const frame = document.getElementById("mapFrame");
  if (frame && SITE_CONFIG.mapsEmbedUrl) frame.src = SITE_CONFIG.mapsEmbedUrl;
  const url = SITE_CONFIG.mapsUrl;
  if (!url) return;
  document.querySelectorAll('[data-config="address"]').forEach((el) => {
    if (el.dataset.mapLinked === "true") return;
    el.dataset.mapLinked = "true";
    if (el.tagName === "A") {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
      return;
    }
    const text = el.textContent;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = "Open in Google Maps";
    link.textContent = text;
    link.className = "map-link";
    el.textContent = "";
    el.appendChild(link);
  });
}

// Mobile hamburger menu
function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
}

// Floating reservation call card + WhatsApp button (shown on every page).
// The card only invites a call while the reservation desk is open.
function setupReservationWidget() {
  if (document.querySelector(".floating-widgets")) return;

  const from = SITE_CONFIG.reservationFromHour;
  const to = SITE_CONFIG.reservationToHour;
  const hour = new Date().getHours();
  const open = hour >= from && hour < to;
  const hours = "10 AM to 10 PM";

  const box = document.createElement("div");
  box.className = "floating-widgets";
  box.innerHTML = `
    <div class="reservation-card" id="reservationCard">
      <button class="reservation-close" aria-label="Close reservation card">&times;</button>
      <p class="reservation-title">For Reservation (${hours})</p>
      <a class="reservation-phone" href="tel:${SITE_CONFIG.phone}">${SITE_CONFIG.phone}</a>
      <p class="reservation-note">${open ? "Call now for special deals" : "Our desk reopens at 10 AM - WhatsApp us anytime"}</p>
    </div>
    <a class="whatsapp-fab" href="${SITE_CONFIG.whatsapp}"
       target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5 0-2.3-.2-4.6-2.2-2.3-2-2.9-3.7-3-4.2-.1-.5.3-1.5.8-1.8.3-.2.7-.1.9.2l.8 1.3c.1.2.1.5 0 .7l-.4.6c-.1.2-.1.4 0 .6.3.5.8 1.2 1.5 1.8.7.6 1.4.9 1.8 1.1.2.1.5 0 .6-.1l.6-.6c.2-.2.5-.2.7-.1l1.4.7c.3.2.4.5.3.8Z"/>
      </svg>
    </a>`;
  document.body.appendChild(box);

  box.querySelector(".reservation-close").addEventListener("click", () => {
    document.getElementById("reservationCard").remove();
  });
}

// Ready-made "Cancellation Request" email (customers cannot cancel online)
function cancellationMailtoLink() {
  const subject = `Cancellation Request - ${SITE_CONFIG.resortName}`;
  const body = [
    "Guest Name:",
    "Registered Mobile Number:",
    "Registered Email Address:",
    "Booking Reference / Booking ID:",
    "Check-in Date:",
    "Reason for cancellation:",
    "",
    "Please verify my booking and advise on the applicable cancellation policy.",
  ].join("\n");
  return `mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// "Experience Shankari" video section (only on pages that contain it).
// The link lives in social-links/youtube.js - deleting that file simply
// hides the section, nothing else breaks.
function setupVideoSection() {
  const section = document.getElementById("videoSection");
  const frame = document.getElementById("resortVideo");
  if (!section || !frame) return;
  const enabled = typeof YOUTUBE_ENABLED !== "undefined" ? YOUTUBE_ENABLED : false;
  const id = typeof YOUTUBE_VIDEO_ID !== "undefined" ? YOUTUBE_VIDEO_ID : "";
  if (!enabled || !id) return;
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  section.hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  setupMapLinks();
  setupVideoSection();
  setupNav();
  setupReservationWidget();

  // Any "request cancellation" link on the site opens a prepared email
  document.querySelectorAll("[data-cancellation-mailto]").forEach((a) => {
    a.href = cancellationMailtoLink();
  });
});
