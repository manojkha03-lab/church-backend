const mongoose = require("mongoose");

const baptismSchema = new mongoose.Schema({
  personName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  baptismDate: { type: Date, required: true },
  parents: {
    father: { type: String, required: true },
    mother: { type: String, required: true },
  },
  godparents: {
    godfather: { type: String },
    godmother: { type: String },
  },
  priest: { type: String, required: true },
  location: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Baptism", baptismSchema);