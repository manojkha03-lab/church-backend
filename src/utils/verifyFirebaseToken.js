const jwt = require("jsonwebtoken");
const https = require("https");

let cachedKeys = null;
let cacheExpiry = 0;

function fetchGoogleKeys() {
  return new Promise((resolve, reject) => {
    https
      .get(
        "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              cachedKeys = JSON.parse(data);
              const maxAge = res.headers["cache-control"]?.match(/max-age=(\d+)/)?.[1];
              cacheExpiry = Date.now() + (maxAge ? parseInt(maxAge, 10) * 1000 : 3600000);
              resolve(cachedKeys);
            } catch (e) {
              reject(e);
            }
          });
          res.on("error", reject);
        }
      )
      .on("error", reject);
  });
}

async function verifyFirebaseToken(idToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID env var is not set");

  // Decode header to get key ID
  const [headerB64] = idToken.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());

  // Fetch or use cached Google public keys
  if (!cachedKeys || Date.now() >= cacheExpiry) {
    await fetchGoogleKeys();
  }

  const cert = cachedKeys[header.kid];
  if (!cert) throw new Error("Token signed with unknown key");

  // Verify signature, expiry, audience, and issuer
  const decoded = jwt.verify(idToken, cert, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  return decoded;
}

module.exports = verifyFirebaseToken;
