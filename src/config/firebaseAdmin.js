const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    // Minimal init — sufficient for verifyIdToken (uses Google public keys)
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
}

module.exports = admin;
