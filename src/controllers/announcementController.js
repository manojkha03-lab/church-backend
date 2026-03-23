const Announcement = require("../models/Announcement");

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ pinned: -1, startDate: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch announcements", error: error.message });
  }
};

exports.createAnnouncement = [
  require("../middleware/validation").validateAnnouncement,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { title, content, startDate, endDate, pinned } = req.body;
      const announcement = new Announcement({
        title,
        content,
        startDate,
        endDate,
        pinned,
        createdBy: req.user.id,
      });
      await announcement.save();
      res.status(201).json({ message: "Announcement created", announcement });
    } catch (error) {
      res.status(500).json({ message: "Unable to create announcement", error: error.message });
    }
  }
];

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    Object.assign(announcement, req.body);
    await announcement.save();
    res.json({ message: "Announcement updated", announcement });
  } catch (error) {
    res.status(500).json({ message: "Unable to update announcement", error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    await announcement.deleteOne();
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete announcement", error: error.message });
  }
};