const express = require("express");
const router = express.Router();
const { protect, requireAdmin, requireMember } = require("../middleware/authMiddleware");
const { getProfile, updateProfile, getUserById, getAllUsers, getMemberDirectory, updateUserRole, deleteUser } = require("../controllers/profileController");
const upload = require("../middleware/upload");

router.get("/me", protect, getProfile);
router.put("/me", protect, upload.single("photo"), updateProfile);
router.post("/update", protect, upload.single("photo"), updateProfile);
router.get("/directory", protect, getMemberDirectory);
router.get("/all", protect, requireAdmin, getAllUsers);
router.put("/:id/role", protect, requireAdmin, updateUserRole);
router.delete("/:id", protect, requireAdmin, deleteUser);
router.get("/:id", protect, getUserById);

module.exports = router;