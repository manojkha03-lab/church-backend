const Sermon = require("../models/Sermon");

exports.getSermons = async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ date: -1 });
    res.json(sermons);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch sermons", error: error.message });
  }
};

exports.createSermon = [
  require("../middleware/validation").validateSermon,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { title, speaker, date, videoUrl, notes } = req.body;
      const sermon = new Sermon({
        title,
        speaker,
        date,
        videoUrl,
        notes,
        createdBy: req.user.id,
      });
      await sermon.save();
      res.status(201).json({ message: "Sermon created", sermon });
    } catch (error) {
      res.status(500).json({ message: "Unable to create sermon", error: error.message });
    }
  }
];

exports.updateSermon = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ message: "Sermon not found" });

    const { title, speaker, date, videoUrl, notes } = req.body;
    if (title !== undefined) sermon.title = title;
    if (speaker !== undefined) sermon.speaker = speaker;
    if (date !== undefined) sermon.date = date;
    if (videoUrl !== undefined) sermon.videoUrl = videoUrl;
    if (notes !== undefined) sermon.notes = notes;
    await sermon.save();
    res.json({ message: "Sermon updated", sermon });
  } catch (error) {
    res.status(500).json({ message: "Unable to update sermon", error: error.message });
  }
};

exports.deleteSermon = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ message: "Sermon not found" });

    await sermon.deleteOne();
    res.json({ message: "Sermon deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete sermon", error: error.message });
  }
};
