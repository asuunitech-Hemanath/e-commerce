const { S3Client } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto",
  endpoint: "https://a8e0470745f847c796503a8041aea1de.r2.cloudflarestorage.com", // ✅ remove bucket name
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = r2;