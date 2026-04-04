const PrayerRequest = require("../models/PrayerRequest");

exports.getPrayerRequests = async (req, res) => {
  try {
    const requests = await PrayerRequest.find().populate("user", "name").populate("comments.user", "name").sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch prayer requests", error: error.message });
  }
};

exports.createPrayerRequest = [
  require("../middleware/validation").validatePrayerRequest,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { title, description, isAnonymous } = req.body;
      const request = new PrayerRequest({
        title,
        description,
        user: req.user.id,
        isAnonymous,
      });
      await request.save();
      res.status(201).json({ message: "Prayer request created", request });
    } catch (error) {
      res.status(500).json({ message: "Unable to create prayer request", error: error.message });
    }
  }
];

exports.updatePrayerRequest = async (req, res) => {
  try {
    const request = await PrayerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Prayer request not found" });
    if (request.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const allowed = ['title', 'description', 'isAnonymous'];
    allowed.forEach(key => { if (req.body[key] !== undefined) request[key] = req.body[key]; });
    request.updatedAt = Date.now();
    await request.save();
    res.json({ message: "Prayer request updated", request });
  } catch (error) {
    res.status(500).json({ message: "Unable to update prayer request", error: error.message });
  }
};

exports.deletePrayerRequest = async (req, res) => {
  try {
    const request = await PrayerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Prayer request not found" });
    if (request.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    await request.deleteOne();
    res.json({ message: "Prayer request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete prayer request", error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const request = await PrayerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Prayer request not found" });
    request.comments.push({ text, user: req.user.id });
    await request.save();
    res.json({ message: "Comment added", request });
  } catch (error) {
    res.status(500).json({ message: "Unable to add comment", error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const request = await PrayerRequest.findById(req.params.id).populate("comments.user", "name");
    if (!request) return res.status(404).json({ message: "Prayer request not found" });
    res.json(request.comments);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch comments", error: error.message });
  }
};