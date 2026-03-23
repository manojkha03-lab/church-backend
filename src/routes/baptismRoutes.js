const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getBaptisms,
  createBaptism,
  updateBaptism,
  deleteBaptism,
} = require("../controllers/baptismController");

router.get("/", protect, getBaptisms);
router.post("/", protect, adminOnly, createBaptism);
router.put("/:id", protect, updateBaptism);
router.delete("/:id", protect, adminOnly, deleteBaptism);

module.exports = router;