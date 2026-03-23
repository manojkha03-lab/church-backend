const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getUsers,
  approveUser,
  rejectUser,
  deleteUser,
  getStats,
  promoteUser,
  demoteUser,
  getAllData,
  getNotifications,
  deleteNotification,
  getActivityLogs,
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/users",              getUsers);
router.get("/stats",              getStats);
router.get("/all-data",           getAllData);
router.get("/notifications",      getNotifications);
router.delete("/notifications/:id", deleteNotification);
router.get("/activity-logs",      getActivityLogs);
router.put("/approve/:id",        approveUser);
router.put("/reject/:id",         rejectUser);
router.put("/promote/:id",        promoteUser);
router.put("/demote/:id",         demoteUser);
router.delete("/delete/:id",      deleteUser);

module.exports = router;
