/* ==========================================================================
   Website configuration used by every page.

   IMPORTANT: this file does not contain any editable resort information.
   It only collects the values from the dedicated configuration files:
     config/contact.js          -> phone, email, address
     config/socialLinks.js      -> WhatsApp, Instagram, Google Maps
     config/resort.js           -> booking + policy rules
     social-links/youtube.js    -> "Experience Shankari" video
   Never put passwords or secret API keys here (secrets live in backend/.env).
   ========================================================================== */

const SITE_CONFIG = {
  resortName: CONTACT_CONFIG.RESORT_NAME,
  tagline: CONTACT_CONFIG.TAGLINE,
  secondaryTagline: CONTACT_CONFIG.SECONDARY_TAGLINE,

  phone: CONTACT_CONFIG.PHONE_NUMBER,
  email: CONTACT_CONFIG.RESERVATION_EMAIL,
  adminEmail: CONTACT_CONFIG.ADMIN_EMAIL,
  address: CONTACT_CONFIG.ADDRESS,

  reservationFromHour: CONTACT_CONFIG.RESERVATION_FROM_HOUR,
  reservationToHour: CONTACT_CONFIG.RESERVATION_TO_HOUR,

  // Social + location links (all from config/socialLinks.js).
  // An empty string hides that link everywhere, nothing breaks.
  whatsapp: typeof WHATSAPP_URL !== "undefined" ? WHATSAPP_URL : "",
  instagram: typeof INSTAGRAM_URL !== "undefined" ? INSTAGRAM_URL : "",
  mapsUrl: typeof GOOGLE_MAPS_URL !== "undefined" ? GOOGLE_MAPS_URL : "",
  mapsDirectionsUrl: typeof GOOGLE_MAPS_DIRECTIONS_URL !== "undefined" ? GOOGLE_MAPS_DIRECTIONS_URL : "",
  mapsEmbedUrl: typeof GOOGLE_MAPS_EMBED_URL !== "undefined" ? GOOGLE_MAPS_EMBED_URL : "",
  youtube: typeof YOUTUBE_CHANNEL_URL !== "undefined" ? YOUTUBE_CHANNEL_URL : "",

  currency: "INR",
  currencySymbol: "₹",

  // Backend API base URL.
  // Leave "" when the frontend is served by the Express backend (npm start).
  // Empty means same-origin. Express serves the frontend and API together.
  // Only set a full URL when the frontend and backend are intentionally hosted separately.
  apiBaseUrl: "http://localhost:5000",

  // Folder that contains every website image
  imagesPath: "assets/images/",

  // Booking + tax rules (from config/resort.js)
  bookingWindowMonths: RESORT_CONFIG.BOOKING_WINDOW_MONTHS,
  taxRatePercent: RESORT_CONFIG.TAX_RATE_PERCENT,

  // Room list used ONLY when the Express/MongoDB backend is not reachable
  // (for example the published static preview). When the backend runs, the
  // real room data from MongoDB is always used instead.
  // The resort has ONE room type only: the Suite Room at ₹2,500 per night.
  fallbackRooms: [
    {
      _id: "suite",
      name: "Suite Room",
      type: "Suite",
      description:
        "A spacious 240 sq. m. riverfront-facing suite with warm interiors and a seating area, ideal for a couple with one child. Breakfast is included with the stay.",
      price: 2500,
      capacity: 3,
      size: "240 sq. m.",
      totalRooms: 9,
      amenities: [
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
      ],
      images: ["luxury-room.jpg", "luxury-room-2.jpg", "luxury-room-bathroom.jpg"],
    },
  ],
};
