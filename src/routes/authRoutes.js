const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getMe,
  checkAvailability,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/firebase-login", (_req, res) => {
  res.status(410).json({ message: "Firebase login is disabled. Use password login." });
});
router.post("/check-availability", checkAvailability);
router.get("/me", protect, getMe);

module.exports = router;