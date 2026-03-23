const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "mysecretkey";

// ================= REGISTER =================
exports.registerUser = [
  require("../middleware/validation").validateRegister,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

// ================= LOGIN =================
exports.loginUser = [
  require("../middleware/validation").validateLogin,
  require("../middleware/validation").handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // check user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // check account approval status
      if (user.status === "pending") {
        return res.status(403).json({ message: "Your account is pending approval by an administrator." });
      }
      if (user.status === "rejected") {
        return res.status(403).json({ message: "Your account has been rejected. Please contact the church office." });
      }

      // record login time
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      // create token
      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        getJwtSecret(),
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

// ================= ME =================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};