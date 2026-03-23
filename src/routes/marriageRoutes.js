const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getMarriages,
  createMarriage,
  updateMarriage,
  deleteMarriage,
} = require("../controllers/marriageController");

router.get("/", protect, getMarriages);
router.post("/", protect, adminOnly, createMarriage);
router.put("/:id", protect, updateMarriage);
router.delete("/:id", protect, adminOnly, deleteMarriage);

module.exports = router;