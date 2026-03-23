const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyFirebaseToken = require("../utils/verifyFirebaseToken");

const getJwtSecret = () => process.env.JWT_SECRET || "mysecretkey";

// ================= CHECK AVAILABILITY =================
// Quick pre-check so the frontend can validate before Firebase OTP flow
exports.checkAvailability = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (name) {
      const existing = await User.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: "This name is already taken." });
      }
    }
    if (mobile) {
      const existing = await User.findOne({ mobile });
      if (existing) {
        return res.status(400).json({ message: "This mobile number is already registered." });
      }
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= REGISTER (after Firebase OTP verified on frontend) =================
exports.registerUser = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Name, mobile, and password are required." });
    }
    if (!/^[0-9]{10,15}$/.test(mobile)) {
      return res.status(400).json({ message: "Mobile must be a valid number (10-15 digits)." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Check duplicates
    const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: "This name is already taken." });
    }
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: "This mobile number is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      mobile,
      password: hashedPassword,
      provider: "local",
      isVerified: true,
      status: "pending",
    });

    await user.save();

    res.status(201).json({
      message: "Registration successful! Your account is pending admin approval.",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= LOGIN (name + password) =================
exports.loginUser = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required." });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Google users cannot login with password
    if (user.provider === "google") {
      return res.status(400).json({ message: "This account uses Google Sign-In. Please use the 'Continue with Google' button." });
    }
    if (!user.password) {
      return res.status(400).json({ message: "This account does not have a password set." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    // Check account approval status
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending approval by an administrator.", pendingApproval: true });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your account has been rejected. Please contact the church office." });
    }

    // Record login time
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, mobile: user.mobile, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

// ================= GOOGLE LOGIN (Firebase) =================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required." });
    }

    const decoded = await verifyFirebaseToken(idToken);
    const { email, name: displayName, picture } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Google account must have an email address." });
    }

    // Check if Google user already exists by email
    let user = await User.findOne({ email, provider: "google" });

    if (!user) {
      // Generate a unique name
      let userName = displayName || email.split("@")[0];
      const nameExists = await User.findOne({ name: userName });
      if (nameExists) {
        userName = `${userName}_${Date.now().toString(36).slice(-4)}`;
      }

      user = new User({
        name: userName,
        email,
        provider: "google",
        profileImage: picture || "",
        isVerified: true,
        status: "pending",
      });
      await user.save();

      return res.status(201).json({
        message: "Account created! Your account is pending admin approval.",
        pendingApproval: true,
        user: { id: user._id, name: user.name, email: user.email, status: user.status },
      });
    }

    // Existing user — check approval status
    if (user.status === "pending") {
      return res.status(403).json({
        message: "Your account is pending approval by an administrator.",
        pendingApproval: true,
      });
    }
    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Your account has been rejected. Please contact the church office.",
      });
    }

    // Approved — update profile image if missing, issue JWT
    if (picture && !user.profileImage) {
      user.profileImage = picture;
      await user.save();
    }
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    if (error.message?.includes("expired")) {
      return res.status(401).json({ message: "Token expired. Please try again." });
    }
    res.status(500).json({ message: "Google login failed.", error: error.message });
  }
};