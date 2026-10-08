const express = require("express");
const { getRooms, getRoom, availability } = require("../controllers/roomController");

const router = express.Router();

router.get("/", getRooms);
router.get("/availability", availability);
router.get("/:id", getRoom);

module.exports = router;
