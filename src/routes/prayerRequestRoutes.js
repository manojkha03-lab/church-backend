const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPrayerRequests,
  createPrayerRequest,
  updatePrayerRequest,
  deletePrayerRequest,
  addComment,
  getComments,
} = require("../controllers/prayerRequestController");

router.get("/", protect, getPrayerRequests);
router.post("/", protect, createPrayerRequest);
router.put("/:id", protect, updatePrayerRequest);
router.delete("/:id", protect, deletePrayerRequest);
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);

module.exports = router;