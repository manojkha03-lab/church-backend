const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getSacraments,
  createSacrament,
  updateSacrament,
  deleteSacrament,
} = require("../controllers/sacramentController");

router.get("/", protect, getSacraments);
router.post("/", protect, adminOnly, createSacrament);
router.put("/:id", protect, updateSacrament);
router.delete("/:id", protect, adminOnly, deleteSacrament);

module.exports = router;