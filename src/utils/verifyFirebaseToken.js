const admin = require("../config/firebaseAdmin");

async function verifyFirebaseToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

module.exports = verifyFirebaseToken;
