const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.error("MONGO_URI is not set — database features will be unavailable");
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      logger.info("MongoDB Connected ✅");
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