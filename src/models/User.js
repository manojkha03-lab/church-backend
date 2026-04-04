const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    default: ""
  },
  provider: {
    type: String,
    enum: ["local", "google", "email", "phone"],
    default: "local"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member"
  },
  // pending = awaiting approval, approved = can login, rejected = blocked
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  phone: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  profileImage: {
    type: String,
    default: ""
  },
  lastLogin: { type: Date, default: null },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Sparse unique: only enforce uniqueness when mobile has a value (allows Google users without mobile)
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);

module.exports = User;