const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/r2");

const uploadToR2 = async (file) => {
  const fileName = `products/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2.send(command);

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};

module.exports = uploadToR2;