// In-memory OTP store with expiry and attempt limiting
// For production, replace with Redis or a DB collection

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// Map key: mobile number, value: { otp, expiresAt, attempts }
const otpMap = new Map();

/**
 * Generate and store a 6-digit OTP for the given mobile number.
 * Overwrites any existing OTP for that number.
 */
exports.generateOTP = (mobile) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpMap.set(mobile, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY,
    attempts: 0,
  });
  return otp;
};

/**
 * Verify the OTP for a given mobile number.
 * Returns { valid: boolean, message: string }
 */
exports.verifyOTP = (mobile, otp) => {
  const entry = otpMap.get(mobile);

  if (!entry) {
    return { valid: false, message: "No OTP found. Please request a new one." };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(mobile);
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpMap.delete(mobile);
    return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
  }

  if (entry.otp !== otp) {
    entry.attempts += 1;
    return { valid: false, message: `Invalid OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
  }

  // OTP is valid — remove it so it can't be reused
  otpMap.delete(mobile);
  return { valid: true, message: "OTP verified successfully." };
};

// Cleanup expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpMap) {
    if (now > entry.expiresAt) otpMap.delete(key);
  }
}, 10 * 60 * 1000);
