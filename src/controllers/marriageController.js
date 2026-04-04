const Marriage = require("../models/Marriage");

exports.getMarriages = async (req, res) => {
  try {
    const marriages = await Marriage.find().populate("createdBy", "name").sort({ weddingDate: -1 });
    res.json(marriages);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch marriages", error: error.message });
  }
};

exports.createMarriage = [
  require("../middleware/validation").validateMarriage,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const marriage = new Marriage({
        ...req.body,
        createdBy: req.user.id,
      });

      await marriage.save();
      res.status(201).json({ message: "Marriage record created", marriage });
    } catch (error) {
      res.status(500).json({ message: "Unable to create marriage record", error: error.message });
    }
  }
];

exports.updateMarriage = async (req, res) => {
  try {
    const marriage = await Marriage.findById(req.params.id);
    if (!marriage) return res.status(404).json({ message: "Marriage record not found" });
    if (marriage.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const allowed = ['brideName', 'groomName', 'brideDateOfBirth', 'groomDateOfBirth', 'weddingDate', 'witnesses', 'priest', 'location', 'marriageLicense', 'notes'];
    allowed.forEach(key => { if (req.body[key] !== undefined) marriage[key] = req.body[key]; });
    marriage.updatedAt = Date.now();
    await marriage.save();
    res.json({ message: "Marriage record updated", marriage });
  } catch (error) {
    res.status(500).json({ message: "Unable to update marriage record", error: error.message });
  }
};

exports.deleteMarriage = async (req, res) => {
  try {
    const marriage = await Marriage.findById(req.params.id);
    if (!marriage) return res.status(404).json({ message: "Marriage record not found" });
    if (marriage.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Marriage.findByIdAndDelete(req.params.id);
    res.json({ message: "Marriage record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete marriage record", error: error.message });
  }
};