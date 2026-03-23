const Donation = require("../models/Donation");

// Stripe is optional — backend runs without it
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

exports.createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }
    const { amount } = req.body; // amount in cents
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Church Donation",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/success`,
      cancel_url: `${req.protocol}://${req.get("host")}/cancel`,
      metadata: {
        userId: req.user.id,
      },
    });

    // Save pending donation
    const donation = new Donation({
      user: req.user.id,
      amount: amount / 100, // convert cents to dollars
      stripeSessionId: session.id,
    });
    await donation.save();

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Unable to create checkout session", error: error.message });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch donations", error: error.message });
  }
};

// POST /api/donations/add  — manually record a donation
exports.addDonation = async (req, res) => {
  try {
    const { userId, amount, method, note } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required" });
    }
    const donation = new Donation({
      user:   userId,
      amount: parseFloat(amount),
      method: method || "cash",
      status: "completed",
      note:   note || "",
    });
    await donation.save();
    const populated = await donation.populate("user", "name email");
    res.status(201).json({ message: "Donation recorded", donation: populated });
  } catch (error) {
    res.status(500).json({ message: "Unable to record donation", error: error.message });
  }
};

// GET /api/donations/all  — all donations with optional date range (admin)
exports.getAllDonations = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }
    const donations = await Donation.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    const total = donations
      .filter(d => d.status === "completed")
      .reduce((sum, d) => sum + d.amount, 0);
    res.json({ donations, total });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch donations", error: error.message });
  }
};

// GET /api/donations/mine  — donations for the authenticated user
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch your donations", error: error.message });
  }
};

// GET /api/donations/user/:id  — donations for a specific user
exports.getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.params.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch user donations", error: error.message });
  }
};