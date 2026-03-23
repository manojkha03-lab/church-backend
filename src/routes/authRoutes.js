const express = require("express");
const router = express.Router();

// import controller functions
const { checkAvailability, registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ================= TEST =================
router.get("/test", (req, res) => {
  res.send("Auth working ✅");
});

// ================= CHECK AVAILABILITY =================
router.post("/check-availability", checkAvailability);

// ================= REGISTER =================
router.post("/register", registerUser);

// ================= LOGIN =================
router.post("/login", loginUser);

// ================= ME =================
router.get("/me", protect, getMe);

module.exports = router;