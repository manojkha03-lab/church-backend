const express = require("express");
const cors = require("cors");
const path = require("path");
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
const adminRoutes     = require("./src/routes/adminRoutes");
const memberRoutes    = require("./src/routes/memberRoutes");

const Event = require("./src/models/Event");
const Sermon = require("./src/models/Sermon");

const app = express();

// connect DB (non-blocking — server stays alive if it fails)
connectDB();
logger.info("Server initialization started");

// webhook route BEFORE JSON middleware (needs raw body)
app.use("/api/webhooks", webhookRoutes);

// CORS – allow deployed frontend, Vercel previews, ngrok tunnels, and localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',').map((o) => o.trim()),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server / same-origin requests (no origin header)
    if (!origin) return callback(null, true);

    // Exact match against configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any *.vercel.app preview deploy
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);

    // Allow ngrok tunnels (local mobile testing)
    if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.(app|dev)$/i.test(origin)) return callback(null, true);
    if (/^https:\/\/[a-z0-9-]+\.ngrok\.(io|dev|app)$/i.test(origin)) return callback(null, true);

    // Allow localhost dev
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(logger.requestLog);

// routes
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
app.use("/api/admin",      adminRoutes);
app.use("/api/member",     memberRoutes);

// public APIs (no auth required)
app.get("/api/public/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

app.get("/api/public/sermons", async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ createdAt: -1 });
    res.json(sermons);
  } catch (err) {
    res.status(500).json({ message: "Error fetching sermons" });
  }
});

// test route
app.get("/", (req, res) => {
  res.send("Server working ✅");
});

// 404 handler
app.use(notFoundHandler);

// global error handler (must be last)
app.use(errorHandler);

// port — Render sets PORT env var; default to 10000 for production
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});