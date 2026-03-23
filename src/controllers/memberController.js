const Event = require("../models/Event");
const Announcement = require("../models/Announcement");
const PrayerRequest = require("../models/PrayerRequest");

// ─────────────────────────────────────────────
// GET /api/member/dashboard — member overview
// ─────────────────────────────────────────────
exports.getMemberDashboard = async (req, res) => {
  try {
    const [upcomingEvents, recentAnnouncements, myPrayerRequests] =
      await Promise.all([
        Event.find({ startDate: { $gte: new Date() } })
          .sort({ startDate: 1 })
          .limit(5),
        Announcement.find().sort({ createdAt: -1 }).limit(5),
        PrayerRequest.find({ user: req.user.id })
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    res.json({
      upcomingEvents,
      recentAnnouncements,
      myPrayerRequests,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/member/events — all events for members
// ─────────────────────────────────────────────
exports.getMemberEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err.message });
  }
};
