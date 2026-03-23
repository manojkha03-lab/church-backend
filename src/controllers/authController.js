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

// ================= FIREBASE LOGIN (Google / Email / Phone — unified) =================
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required." });
    }

    const decoded = await verifyFirebaseToken(idToken);
    const { uid, email, name: displayName, phone_number, picture, firebase } = decoded;
    const signInProvider = firebase?.sign_in_provider || "unknown";

    // Determine provider tag
    const providerMap = { "google.com": "google", "phone": "phone", "password": "email" };
    const provider = providerMap[signInProvider] || "email";

    // Try to find existing user by Firebase UID first
    let user = await User.findOne({ firebaseUid: uid });

    // Fallback: find by email or phone
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user && phone_number) {
      const mobile = phone_number.replace(/^\+91/, "");
      user = await User.findOne({ mobile });
    }

    if (!user) {
      // Create new user
      let userName = displayName || (email ? email.split("@")[0] : `User_${uid.slice(0, 6)}`);
      const nameExists = await User.findOne({ name: userName });
      if (nameExists) {
        userName = `${userName}_${Date.now().toString(36).slice(-4)}`;
      }

      user = new User({
        name: userName,
        email: email || "",
        mobile: phone_number ? phone_number.replace(/^\+91/, "") : null,
        firebaseUid: uid,
        provider,
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

    // Link Firebase UID if not already linked
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      if (picture && !user.profileImage) user.profileImage = picture;
      if (email && !user.email) user.email = email;
      await user.save();
    }

    // Check approval status
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
    console.error("Firebase login error:", error);
    if (error.code === "auth/id-token-expired" || error.message?.includes("expired")) {
      return res.status(401).json({ message: "Token expired. Please try again." });
    }
    res.status(500).json({ message: "Authentication failed.", error: error.message });
  }
};