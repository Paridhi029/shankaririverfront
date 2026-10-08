const express = require("express");
const c = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/login", c.login);

// Everything below requires a valid admin JWT
router.use(protect, adminOnly);

router.get("/dashboard", c.dashboard);

router.get("/rooms", c.listRooms);
router.post("/rooms", c.createRoom);
router.put("/rooms/:id", c.updateRoom);
router.delete("/rooms/:id", c.deleteRoom);

router.get("/bookings", c.listBookings);
router.post("/bookings/:id/cancel", c.adminCancelBooking);

router.get("/seasons", c.listSeasons);
router.post("/seasons", c.createSeason);
router.put("/seasons/:id", c.updateSeason);
router.delete("/seasons/:id", c.deleteSeason);

router.get("/enquiries", c.listEnquiries);
router.put("/enquiries/:id", c.updateEnquiry);

router.get("/settings", c.getSettingsHandler);
router.put("/settings", c.updateSettings);

module.exports = router;
