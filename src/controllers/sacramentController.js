const Sacrament = require("../models/Sacrament");

exports.getSacraments = async (req, res) => {
  try {
    const sacraments = await Sacrament.find().populate("createdBy", "name").sort({ sacramentDate: -1 });
    res.json(sacraments);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch sacraments", error: error.message });
  }
};

exports.createSacrament = [
  require("../middleware/validation").validateSacrament,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const sacrament = new Sacrament({
        ...req.body,
        createdBy: req.user.id,
      });

      await sacrament.save();
      res.status(201).json({ message: "Sacrament record created", sacrament });
    } catch (error) {
      res.status(500).json({ message: "Unable to create sacrament record", error: error.message });
    }
  }
];

exports.updateSacrament = async (req, res) => {
  try {
    const sacrament = await Sacrament.findById(req.params.id);
    if (!sacrament) return res.status(404).json({ message: "Sacrament record not found" });
    if (sacrament.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(sacrament, req.body);
    sacrament.updatedAt = Date.now();
    await sacrament.save();
    res.json({ message: "Sacrament record updated", sacrament });
  } catch (error) {
    res.status(500).json({ message: "Unable to update sacrament record", error: error.message });
  }
};

exports.deleteSacrament = async (req, res) => {
  try {
    const sacrament = await Sacrament.findById(req.params.id);
    if (!sacrament) return res.status(404).json({ message: "Sacrament record not found" });
    if (sacrament.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Sacrament.findByIdAndDelete(req.params.id);
    res.json({ message: "Sacrament record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete sacrament record", error: error.message });
  }
};