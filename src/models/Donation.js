const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "inr" },
  method:          { type: String, enum: ["stripe", "cash", "check", "upi", "bank"], default: "cash" },
  status:          { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  note:            { type: String, default: "" },
  stripeSessionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Donation", donationSchema);