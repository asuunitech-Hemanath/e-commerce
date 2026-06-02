// server/routes/productMedia.js

const express = require("express");
const router = express.Router();
const db = require("../db");

const upload = require("../middleware/upload");
const uploadToR2 = require("../config/uploadToR2");

// GET all media for a product
router.get("/:id/media", async (req, res) => {
  const productId = req.params.id;

  try {
    const [media] = await db.query(
      `SELECT id, url, type, is_primary 
       FROM product_media 
       WHERE product_id = ? 
       ORDER BY is_primary DESC, id ASC`,
      [productId]
    );

    res.json(media);
  } catch (err) {
    console.error("Fetch media error:", err);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

// UPLOAD multiple product images
router.post("/:id/media", upload.array("images", 5), async (req, res) => {
  const productId = req.params.id;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Images required" });
    }

    const uploadedMedia = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const imageUrl = await uploadToR2(file);

      const isPrimary = i === 0 ? 1 : 0;

      const [result] = await db.query(
        `INSERT INTO product_media 
         (product_id, url, type, is_primary) 
         VALUES (?, ?, ?, ?)`,
        [productId, imageUrl, "image", isPrimary]
      );

      uploadedMedia.push({
        id: result.insertId,
        url: imageUrl,
        type: "image",
        is_primary: isPrimary,
      });
    }

    res.status(201).json({
      message: "Product media uploaded successfully",
      media: uploadedMedia,
    });
  } catch (err) {
    console.error("Upload media error:", err);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// UPDATE media
router.put("/media/:mediaId", async (req, res) => {
  const mediaId = req.params.mediaId;
  const { url, type, is_primary } = req.body;

  try {
    await db.query(
      "UPDATE product_media SET url=?, type=?, is_primary=? WHERE id=?",
      [url, type || "image", is_primary ? 1 : 0, mediaId]
    );

    res.json({ message: "Media updated" });
  } catch (err) {
    console.error("Update media error:", err);
    res.status(500).json({ error: "Failed to update media" });
  }
});

// DELETE media
router.delete("/media/:mediaId", async (req, res) => {
  const mediaId = req.params.mediaId;

  try {
    await db.query("DELETE FROM product_media WHERE id=?", [mediaId]);

    res.json({ message: "Media deleted" });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: "Failed to delete media" });
  }
});

module.exports = router;