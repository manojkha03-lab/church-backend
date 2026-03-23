const Baptism = require("../models/Baptism");

exports.getBaptisms = async (req, res) => {
  try {
    const baptisms = await Baptism.find().populate("createdBy", "name").sort({ baptismDate: -1 });
    res.json(baptisms);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch baptisms", error: error.message });
  }
};

exports.createBaptism = [
  require("../middleware/validation").validateBaptism,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const baptism = new Baptism({
        ...req.body,
        createdBy: req.user.id,
      });

      await baptism.save();
      res.status(201).json({ message: "Baptism record created", baptism });
    } catch (error) {
      res.status(500).json({ message: "Unable to create baptism record", error: error.message });
    }
  }
];

exports.updateBaptism = async (req, res) => {
  try {
    const baptism = await Baptism.findById(req.params.id);
    if (!baptism) return res.status(404).json({ message: "Baptism record not found" });
    if (baptism.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(baptism, req.body);
    baptism.updatedAt = Date.now();
    await baptism.save();
    res.json({ message: "Baptism record updated", baptism });
  } catch (error) {
    res.status(500).json({ message: "Unable to update baptism record", error: error.message });
  }
};

exports.deleteBaptism = async (req, res) => {
  try {
    const baptism = await Baptism.findById(req.params.id);
    if (!baptism) return res.status(404).json({ message: "Baptism record not found" });
    if (baptism.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Baptism.findByIdAndDelete(req.params.id);
    res.json({ message: "Baptism record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete baptism record", error: error.message });
  }
};