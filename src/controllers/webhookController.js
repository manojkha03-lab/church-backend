const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Donation = require("../models/Donation");

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const donation = await Donation.findOne({ stripeSessionId: session.id });

      if (donation) {
        donation.status = "completed";
        await donation.save();
        console.log(`Donation ${donation._id} marked as completed`);
      }
    } else if (event.type === "charge.failed") {
      const charge = event.data.object;
      const donation = await Donation.findOne({
        stripeSessionId: charge.payment_intent,
      });

      if (donation) {
        donation.status = "failed";
        await donation.save();
        console.log(`Donation ${donation._id} marked as failed`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: error.message });
  }
};