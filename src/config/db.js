const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB Connected ✅");
  } catch (error) {
    logger.error("DB Connection Error", { message: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;