const mongoose = require("mongoose");

const marriageSchema = new mongoose.Schema({
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  brideDateOfBirth: { type: Date, required: true },
  groomDateOfBirth: { type: Date, required: true },
  weddingDate: { type: Date, required: true },
  witnesses: {
    witness1: { type: String, required: true },
    witness2: { type: String, required: true },
  },
  priest: { type: String, required: true },
  location: { type: String, required: true },
  marriageLicense: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Marriage", marriageSchema);