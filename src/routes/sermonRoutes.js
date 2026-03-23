const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getSermons,
  createSermon,
  updateSermon,
  deleteSermon,
} = require("../controllers/sermonController");

router.get("/", getSermons);
router.post("/", protect, adminOnly, createSermon);
router.put("/:id", protect, adminOnly, updateSermon);
router.delete("/:id", protect, adminOnly, deleteSermon);

module.exports = router;
