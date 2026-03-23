const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAnnouncements);
router.post("/", protect, adminOnly, createAnnouncement);
router.put("/:id", protect, adminOnly, updateAnnouncement);
router.delete("/:id", protect, adminOnly, deleteAnnouncement);

module.exports = router;