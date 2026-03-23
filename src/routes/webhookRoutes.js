const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/webhookController");

// Stripe webhook must receive raw body, not JSON
router.post("/stripe", express.raw({ type: "application/json" }), handleWebhook);

module.exports = router;