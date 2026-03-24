const logger = require("../utils/logger");

// Global error handler middleware
exports.errorHandler = (err, req, res, next) => {
  if (err && err.name === "MulterError") {
    return res.status(400).json({
      error: err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large. Maximum size is 15MB."
        : "File upload error. Please try another image.",
      status: 400,
      path: req.path,
    });
  }

  if (err && /image uploads are allowed/i.test(err.message || "")) {
    return res.status(400).json({
      error: err.message,
      status: 400,
      path: req.path,
    });
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.path}`, {
    status,
    message,
    stack: err.stack,
    body: req.body,
  });

  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    status,
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
exports.notFoundHandler = (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
};