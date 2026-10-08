require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { isRazorpayConfigured } = require("./config/razorpay");

const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const contentRoutes = require("./routes/contentRoutes");

const app = express();

// CORS: during development every origin is allowed. In production set
// FRONTEND_URL in backend/.env to your website address.
const allowedOrigin = (process.env.FRONTEND_URL || "").trim();
app.use(cors(allowedOrigin ? { origin: allowedOrigin, credentials: true } : {}));
app.use(express.json());

// API routes
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/content", contentRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    razorpayMode: process.env.RAZORPAY_MODE || "test",
    razorpayConfigured: isRazorpayConfigured(),
  });
});

// Serve the static frontend (so the whole project can run with one command).
// Admin aliases keep clean URLs working on first load and after refresh. The
// second static mount lets relative CSS/JS files resolve from /admin/* too.
const frontendDir = path.join(__dirname, "..", "frontend");
app.get("/admin", (req, res) => res.redirect(302, "/admin/login"));
app.get("/admin.html", (req, res) => {
  const view = req.query.view === "dashboard" ? "dashboard" : "login";
  res.redirect(302, `/admin/${view}`);
});
app.get(["/admin/login", "/admin/dashboard"], (req, res) => {
  res.sendFile(path.join(frontendDir, "admin.html"));
});
app.use("/admin", express.static(frontendDir));
app.use(express.static(frontendDir));

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ message: "This service is not available" });
});

// Error handler: developers see the details in the console, guests see a
// short friendly message.
app.use((err, req, res, next) => {
  console.error("[error]", req.method, req.originalUrl, err);
  const dbDown = err.name && String(err.name).startsWith("Mongo");
  res.status(500).json({
    message: dbDown
      ? "Booking service is temporarily unavailable. Please try again shortly."
      : "We couldn't complete your request right now. Please try again or contact the resort.",
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    if (!isRazorpayConfigured()) {
      console.warn(
        "[razorpay] Keys are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env to enable online payments."
      );
    }
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
