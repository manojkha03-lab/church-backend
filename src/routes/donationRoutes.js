const express = require("express");
const router = express.Router();
const { protect, requireAdmin, requireMember } = require("../middleware/authMiddleware");
const {
	createCheckoutSession,
	getDonations,
	addDonation,
	getAllDonations,
	getMyDonations,
	getUserDonations,
} = require("../controllers/donationController");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/mine", protect, getMyDonations);
router.get("/", protect, requireAdmin, getDonations);
router.post("/add", protect, requireAdmin, addDonation);
router.get("/all", protect, requireAdmin, getAllDonations);
router.get("/user/:id", protect, requireAdmin, getUserDonations);

module.exports = router;