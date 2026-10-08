# Shankari Riverfront Resort — Website & Booking System

_"Shankari – The Daughter of Lord Shiva" · Riverfront Luxury Retreat_

A complete resort website with a room-booking system, Razorpay (test mode) payments
and an admin panel.

- **Frontend:** HTML5, CSS3, vanilla JavaScript (no frameworks)
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT
- **Payments:** Razorpay Checkout (server-side signature verification)

---

## 1. Folder structure

```
frontend/                 website (pure HTML/CSS/JS)
  *.html                  pages
  css/                    style.css, responsive.css
  js/                     main.js, rooms.js, booking.js, payment.js, admin.js, policies.js, config.js
  config/                 contact.js, resort.js, admin.js   <- edit these
  social-links/           insta.js, youtube.js  <- edit these
  assets/images/          all photos

backend/
  server.js               starts Express, serves the API and the frontend
  config/                 db.js (MongoDB), razorpay.js (payment keys)
  models/                 Room, Booking, User, SeasonalPrice, Enquiry, Setting
  controllers/            room, booking, payment, admin, enquiry, content
  routes/                 one route file per controller
  scripts/seed.js         creates the admin account and the rooms
  .env.example            copy to .env and fill in

lovable/, src/, public/   Lovable preview only — not part of the real website
```

## 2. Run the project

Backend + website (one command serves both):

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
npm run seed              # creates the admin account and the 9 rooms
npm start                 # http://localhost:5000
```

The website is then available at <http://localhost:5000> and the API at `/api/...`.

If you prefer to serve the frontend separately (for example with VS Code Live Server),
open `frontend/index.html` and set `apiBaseUrl` in `frontend/js/config.js` to
`http://localhost:5000`.

## 3. Environment setup

All secrets live in `backend/.env` (never commit this file). See
`backend/.env.example` for the full list with comments:

`PORT`, `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_MODE`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_PHONE`,
`RESORT_EMAIL`, `RESORT_PHONE`, `FRONTEND_URL`, `BACKEND_URL`, `TAX_RATE`,
`BOOKING_WINDOW_MONTHS`.

## 4. Razorpay

- Keys: `backend/.env` → read only by **`backend/config/razorpay.js`**. That file is
  the single place the payment keys are used.
- Use **Test mode** keys while developing. Switch to Live keys only when the resort
  is ready for real payments.
- The frontend never sees the key secret. It receives only the public key id and the
  order id from `POST /api/payment/create-order`.
- If the keys are missing, the booking page shows: _"Online payment is temporarily
  unavailable. Please contact the resort for assistance."_
- A booking is confirmed only after the backend verifies the Razorpay signature.
- No card number, CVV, card PIN or UPI PIN is ever stored — only the order id,
  payment id, status, amount and timestamps.

## 5. Editable configuration (no code knowledge needed)

| What | File |
| --- | --- |
| Resort name, phone, WhatsApp, emails, address, Google Maps | `frontend/config/contact.js` |
| Check-in/out times, tax %, booking window, property rules, policy dates | `frontend/config/resort.js` |
| Admin login URL / footer link visibility | `frontend/config/admin.js` |
| Instagram link | `frontend/social-links/insta.js` |
| YouTube video ("Experience Shankari") | `frontend/social-links/youtube.js` |

Leaving a social link empty simply hides that icon — nothing breaks.

## 6. Media

- Images: `frontend/assets/images/`
- Videos: `frontend/assets/media/videos/`
- Audio: `frontend/assets/media/audio/`
- YouTube links are **not** stored with the images — they live in
  `frontend/social-links/youtube.js`.

## 7. Admin panel

- URL: <http://localhost:5000/admin.html> (no link in the main navigation)
- Login uses the account created by `npm run seed` from `ADMIN_EMAIL` and
  `ADMIN_INITIAL_PASSWORD` in `backend/.env`. Passwords are stored hashed.
- To change the password: edit `ADMIN_INITIAL_PASSWORD` in `backend/.env` and run
  `npm run seed` again.
- The admin can see the dashboard, bookings, customers and payments, update booking
  status, confirm bookings, process cancellation requests, manage room availability
  and log out. Every admin API is protected by JWT.

## 8. Cancellations

Guests **cannot** cancel online. The Cancellation & Refund Policy page offers
"Email the Resort" (a pre-filled cancellation request) and "Call the Resort".
The team verifies the booking and cancels it from the admin panel.

## 9. Policy pages

- `frontend/cancellation.html` — Cancellation & Refund Policy
- `frontend/privacy.html` — Privacy Policy
- `frontend/terms.html` — Terms & Conditions

Configurable wording (notice hours, jurisdiction, rules, last-updated date) comes
from `frontend/config/resort.js`.

## 10. Still to replace

- Real Razorpay **test** key id and secret in `backend/.env`
- The real YouTube video id in `frontend/social-links/youtube.js`
- Confirm the social media profile URLs in `frontend/social-links/`
- The governing jurisdiction (city) in `frontend/config/resort.js`
- Replace the placeholder photos in `frontend/assets/images/` with real resort photos
