const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");
const { errorHandler, notFoundHandler } = require("./src/middleware/errorHandler");
const authRoutes = require("./src/routes/authRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const sermonRoutes = require("./src/routes/sermonRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const donationRoutes = require("./src/routes/donationRoutes");
const prayerRequestRoutes = require("./src/routes/prayerRequestRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const baptismRoutes = require("./src/routes/baptismRoutes");
const marriageRoutes = require("./src/routes/marriageRoutes");
const sacramentRoutes = require("./src/routes/sacramentRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const memberRoutes = require("./src/routes/memberRoutes");

const app = express();

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();
logger.info("Server initialization started");

// ── Webhook route MUST come before express.json() (needs raw body) ────────────
app.use("/api/webhooks", webhookRoutes);

// ── Global middleware ─────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",").map(u => u.trim()).filter(Boolean) : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(logger.requestLog);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sermons", sermonRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/prayer-requests", prayerRequestRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/baptisms", baptismRoutes);
app.use("/api/marriages", marriageRoutes);
app.use("/api/sacraments", sacramentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Church API is running" });
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});