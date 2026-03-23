const express = require("express");
const router = express.Router();
const { protect, memberOnly } = require("../middleware/authMiddleware");
const {
  getMemberDashboard,
  getMemberEvents,
} = require("../controllers/memberController");

// All member routes require authentication + member/admin role
router.use(protect, memberOnly);

router.get("/dashboard", getMemberDashboard);
router.get("/events", getMemberEvents);

module.exports = router;
