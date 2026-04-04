const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.error("MONGO_URI is not set — database features will be unavailable");
    return;
  }

  // Connection event listeners for monitoring
  mongoose.connection.on("connected", () => logger.info("Mongoose connected"));
  mongoose.connection.on("disconnected", () => logger.warn("Mongoose disconnected"));
  mongoose.connection.on("error", (err) => logger.error("Mongoose connection error", { message: err.message }));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info("MongoDB Connected ✅");

      // Drop stale indexes and sync schema indexes
      try {
        const usersCol = mongoose.connection.collection("users");
        const indexes = await usersCol.indexes();
        for (const idx of indexes) {
          const key = Object.keys(idx.key)[0];
          // Drop firebaseUid index entirely (Firebase removed)
          if (key === "firebaseUid") {
            logger.info(`Dropping obsolete index "${idx.name}"`);
            await usersCol.dropIndex(idx.name);
          }
          // Fix non-sparse mobile index
          if (key === "mobile" && idx.unique && !idx.sparse) {
            logger.info(`Dropping non-sparse index "${idx.name}" to recreate as sparse`);
            await usersCol.dropIndex(idx.name);
          }
        }
        // Also unset firebaseUid from all documents so it doesn't linger
        await usersCol.updateMany({}, { $unset: { firebaseUid: "" } });
        const User = require("../models/User");
        await User.syncIndexes();
        logger.info("User indexes synced");
      } catch (idxErr) {
        logger.warn("Index sync warning: " + idxErr.message);
      }

      return;
    } catch (error) {
      logger.error(`DB Connection attempt ${attempt}/${MAX_RETRIES} failed`, {
        message: error.message,
      });
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }
  }
  logger.error("All DB connection attempts failed — server running without database");
};

module.exports = connectDB;