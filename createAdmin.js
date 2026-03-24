/**
 * One-time script to create the first admin user.
 *
 * Usage:
 *   node createAdmin.js
 *
 * Make sure your .env file has MONGO_URI and JWT_SECRET set.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const ADMIN_NAME = process.env.ADMIN_NAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || "0000000000";

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not set in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ name: ADMIN_NAME });
    if (existing) {
      console.log(`User "${ADMIN_NAME}" already exists (role: ${existing.role}).`);
      if (existing.role !== "admin") {
        existing.role = "admin";
        existing.status = "approved";
        await existing.save();
        console.log("Promoted to admin.");
      }
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = new User({
      name: ADMIN_NAME,
      mobile: ADMIN_MOBILE,
      password: hashedPassword,
      role: "admin",
      status: "approved",
      provider: "local",
      isVerified: true,
    });

    await admin.save();
    console.log(`Admin user "${ADMIN_NAME}" created successfully!`);
    console.log("You can now login with:");
    console.log(`  Name: ${ADMIN_NAME}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("\n⚠️  Change the default password immediately after first login!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();