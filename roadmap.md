# Shankari Riverfront Resort — roadmap

All items from the organise + complete pass are done:

- [x] Single-source config: `frontend/config/contact.js`, `resort.js`, `admin.js`
- [x] Social links: `frontend/social-links/insta.js`, `facebook.js`, `linkedin.js`, `youtube.js`
- [x] Razorpay keys isolated in `backend/config/razorpay.js` + friendly unavailable message
- [x] `backend/.env.example` with named placeholders and comments
- [x] "Experience Shankari" video section on the homepage (lazy, no autoplay)
- [x] Removed customer self-cancellation by booking ID (frontend + backend routes)
- [x] Cancellation request flow (Email / Call) on the policy page
- [x] Full Cancellation & Refund, Privacy, Terms pages with shared layout
- [x] Footer links to all policies + Contact Us; no public admin login link
- [x] Admin seeded from `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD`, hashed passwords, JWT
- [x] Friendly API error messages, CORS + error handler in `backend/server.js`
- [x] Media folders for videos/audio; README rewritten

- [x] Single room type only: Suite Room, Rs 2,500/night, 9 rooms (frontend + seed)
- [x] WhatsApp / Instagram / LinkedIn / Facebook / Google Maps in one file: frontend/config/socialLinks.js
- [x] Address is clickable everywhere and opens Google Maps in a new tab
- [x] Add refresh-safe `/admin/login` and `/admin/dashboard` pages
- [x] Verify admin login, protected dashboard data, refresh, and logout
- [x] Package the verified updated frontend/backend project as a downloadable ZIP
