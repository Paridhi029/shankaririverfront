/* ==========================================================================
   SOCIAL LINKS + LOCATION — SINGLE SOURCE OF TRUTH.

   This is the ONLY file to edit when the resort's real accounts are ready.
   Nothing else in the website contains these URLs.

     WhatsApp   -> WHATSAPP_NUMBER (that is all, the link is built for you)
     Instagram  -> INSTAGRAM_URL
     Location   -> GOOGLE_MAPS_ADDRESS / GOOGLE_MAPS_URL

   Set any URL to "" to hide that icon everywhere (nothing breaks).
   Never put passwords or secret API keys here (secrets live in backend/.env).
   ========================================================================== */

const SOCIAL_LINKS = {
  /* ---- WhatsApp ---------------------------------------------------------
     Only the phone number in international format, digits only.
     The correct click-to-chat link (https://wa.me/<number>) is built below,
     so the WhatsApp icon always opens WhatsApp and never an API endpoint. */
  WHATSAPP_NUMBER: "918959655405",
  WHATSAPP_MESSAGE: "Hello Shankari Riverfront Resort, I would like to enquire about a stay.",

  /* ---- Instagram (replace with the real profile URL) ------------------- */
  INSTAGRAM_URL: "https://www.instagram.com/shankririverfront/",

  /* ---- Google Maps ------------------------------------------------------
     Change the address below if the resort gets a new exact location.
     Both the clickable link and the map preview are built from it. */
  GOOGLE_MAPS_ADDRESS: "5G33+8J4, Balgaon, Akbarpura, Madhya Pradesh 451228",
};

// Correct WhatsApp click-to-chat link (wa.me is the official short link)
function buildWhatsAppUrl() {
  const digits = String(SOCIAL_LINKS.WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  const text = SOCIAL_LINKS.WHATSAPP_MESSAGE
    ? "?text=" + encodeURIComponent(SOCIAL_LINKS.WHATSAPP_MESSAGE)
    : "";
  return "https://wa.me/" + digits + text;
}

// Normal Google Maps search link — opens the location in a new tab / in the
// Google Maps app on a phone. No API key needed.
function buildGoogleMapsUrl() {
  const q = String(SOCIAL_LINKS.GOOGLE_MAPS_ADDRESS || "").trim();
  if (!q) return "";
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}

// "Get Directions" link (official Google Maps URL, api=1 format)
function buildGoogleMapsDirectionsUrl() {
  const q = String(SOCIAL_LINKS.GOOGLE_MAPS_ADDRESS || "").trim();
  if (!q) return "";
  return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
}

// Keyless embed used by the small map preview on the Contact page
function buildGoogleMapsEmbedUrl() {
  const q = String(SOCIAL_LINKS.GOOGLE_MAPS_ADDRESS || "").trim();
  if (!q) return "";
  return "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
}

const WHATSAPP_URL = buildWhatsAppUrl();
const INSTAGRAM_URL = SOCIAL_LINKS.INSTAGRAM_URL;
const GOOGLE_MAPS_URL = buildGoogleMapsUrl();
const GOOGLE_MAPS_DIRECTIONS_URL = buildGoogleMapsDirectionsUrl();
const GOOGLE_MAPS_EMBED_URL = buildGoogleMapsEmbedUrl();
