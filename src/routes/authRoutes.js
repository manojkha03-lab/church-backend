const express = require("express");
const router = express.Router();

// import controller functions
const { sendOtp, verifyOtpHandler, registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ================= TEST =================
router.get("/test", (req, res) => {
  res.send("Auth working ✅");
});

// ================= OTP =================
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpHandler);

// ================= REGISTER =================
router.post("/register", registerUser);

// ================= LOGIN =================
router.post("/login", loginUser);

// ================= ME =================
router.get("/me", protect, getMe);

module.exports = router;