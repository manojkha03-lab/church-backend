const mongoose = require("mongoose");

const sacramentSchema = new mongoose.Schema({
  personName: { type: String, required: true },
  sacramentType: {
    type: String,
    enum: ["Confirmation", "Eucharist", "Reconciliation", "Anointing of the Sick", "Holy Orders"],
    required: true
  },
  dateOfBirth: { type: Date, required: true },
  sacramentDate: { type: Date, required: true },
  sponsor: { type: String },
  priest: { type: String, required: true },
  location: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sacrament", sacramentSchema);