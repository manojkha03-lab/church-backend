const User     = require("../models/User");
const Donation = require("../models/Donation");
const ActivityLog = require("../models/ActivityLog");
const Notification = require("../models/Notification");

// ─────────────────────────────────────────────
// GET /api/admin/users  — list all users
// ─────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/approve/:id
// ─────────────────────────────────────────────
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({ action: "Approved user", targetUser: user.name, userId: req.user.id });
    await Notification.create({ message: `${user.name} was approved`, type: "approval" });

    res.json({ message: "User approved", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve user", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/reject/:id
// ─────────────────────────────────────────────
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({ action: "Rejected user", targetUser: user.name, userId: req.user.id });

    res.json({ message: "User rejected", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject user", error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/delete/:id
// ─────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({ action: "Deleted user", targetUser: user.name, userId: req.user.id });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/stats  — dashboard overview
// ─────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, pendingUsers, completedDonations, recentLogins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "pending" }),
      Donation.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      User.find({ lastLogin: { $ne: null } })
        .select("name email lastLogin role status")
        .sort({ lastLogin: -1 })
        .limit(10),
    ]);

    const donationData = completedDonations[0] || { total: 0, count: 0 };

    res.json({
      totalUsers,
      pendingUsers,
      totalDonations: donationData.total,
      completedDonations: donationData.count,
      recentLogins,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/promote/:id — promote to admin
// ─────────────────────────────────────────────
exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({ action: "Promoted user to admin", targetUser: user.name, userId: req.user.id });
    await Notification.create({ message: `${user.name} was promoted to admin`, type: "role" });

    res.json({ message: "User promoted to admin", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to promote user", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/demote/:id — demote to member
// ─────────────────────────────────────────────
exports.demoteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "member" },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await ActivityLog.create({ action: "Demoted admin to member", targetUser: user.name, userId: req.user.id });
    await Notification.create({ message: `${user.name} was demoted to member`, type: "role" });

    res.json({ message: "Admin demoted to member", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to demote user", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/all-data — all data overview
// ─────────────────────────────────────────────
exports.getAllData = async (req, res) => {
  try {
    const Event   = require("../models/Event");
    const Sermon  = require("../models/Sermon");

    const [users, events, sermons] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }),
      Event.find().sort({ createdAt: -1 }),
      Sermon.find().sort({ createdAt: -1 }),
    ]);
    res.json({ users, events, sermons });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/notifications
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/notifications/:id
// ─────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification dismissed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/activity-logs
// ─────────────────────────────────────────────
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs", error: err.message });
  }
};
