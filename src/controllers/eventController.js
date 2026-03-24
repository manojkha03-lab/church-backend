const Event = require("../models/Event");

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch events", error: error.message });
  }
};

exports.createEvent = [
  require("../middleware/validation").validateEvent,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { title, description, location, startDate, endDate, capacity } = req.body;

      const event = new Event({
        title,
        description,
        location,
        startDate,
        endDate,
        capacity,
        createdBy: req.user.id,
      });

      await event.save();
      res.status(201).json({ message: "Event created", event });
    } catch (error) {
      res.status(500).json({ message: "Unable to create event", error: error.message });
    }
  }
];

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { title, description, location, startDate, endDate, capacity, image } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;
    if (capacity !== undefined) event.capacity = capacity;
    if (image !== undefined) event.image = image;
    await event.save();
    res.json({ message: "Event updated", event });
  } catch (error) {
    res.status(500).json({ message: "Unable to update event", error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete event", error: error.message });
  }
};
