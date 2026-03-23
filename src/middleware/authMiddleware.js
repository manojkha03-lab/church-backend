const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "mysecretkey";

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Access denied" });
  }
  return next();
};

exports.protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT error:", error);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

exports.requireAdmin = requireRole("admin");
exports.requireMember = requireRole("member");

// Backward-compatible aliases used in existing routes
exports.adminOnly = exports.requireAdmin;
exports.memberOnly = exports.requireMember;
