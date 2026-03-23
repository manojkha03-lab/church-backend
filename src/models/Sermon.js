const mongoose = require("mongoose");

const sermonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  speaker: { type: String, required: true },
  date: { type: Date, required: true },
  videoUrl: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sermon", sermonSchema);
