const { S3Client,DeleteObjectCommand } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto",
  endpoint: "https://a8e0470745f847c796503a8041aea1de.r2.cloudflarestorage.com", // ✅ remove bucket name
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const deleteFromR2 = async (key) => {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );

    console.log("Deleted from R2:", key);
  } catch (err) {
    console.error("R2 delete error:", err);
  }
};

module.exports = {
  r2,
  deleteFromR2,
};