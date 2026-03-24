const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMemberDashboard,
  getMemberEvents,
} = require("../controllers/memberController");

// All member routes require authentication (admin can also access)
router.use(protect);

router.get("/dashboard", getMemberDashboard);
router.get("/events", getMemberEvents);

module.exports = router;
