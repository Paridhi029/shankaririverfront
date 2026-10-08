# Shankari Riverfront Resort — Easy Local Setup

The project is configured to run the **public website, booking system and admin panel from one Express server**.

## 1. First-time setup

Open PowerShell in the main `shankari-riverfront-resort-updated` folder:

```powershell
npm run install:backend
```

Make sure MongoDB is running locally and that `backend/.env` contains the correct database and Razorpay settings.

If the admin account has not been created yet:

```powershell
npm run seed
```

## 2. Start everything

From the **main project folder**:

```powershell
npm start
```

Then open:

- Website: `http://localhost:5000/`
- Booking: `http://localhost:5000/booking.html`
- Admin: `http://localhost:5000/admin`
- Admin login: `http://localhost:5000/admin/login`
- Admin dashboard: `http://localhost:5000/admin/dashboard`
- Health check: `http://localhost:5000/api/health`

Do **not** run `python -m http.server 5500` for this setup. Express serves the frontend itself.

## 3. Razorpay testing

The project is configured to use Razorpay through the backend. Keep Razorpay in **Test Mode** while testing.

Check:

```text
http://localhost:5000/api/health
```

The response should include:

```json
{
  "ok": true,
  "razorpayMode": "test",
  "razorpayConfigured": true
}
```

A configured response only confirms that the keys are present. To confirm the full payment flow, make a test booking and complete it using Razorpay's test-mode payment details. The backend then verifies the Razorpay signature before confirming the booking.

## 4. Important architecture

```text
Browser
  |
  +-- /                    -> public frontend
  +-- /booking.html        -> booking + payment
  +-- /admin/login         -> admin login
  +-- /admin/dashboard     -> admin dashboard
  |
  +-- /api/*               -> Express API
                             |
                             +-- MongoDB
                             +-- Razorpay
```

The frontend uses **same-origin API calls**. There is no separate frontend server in this configuration.
