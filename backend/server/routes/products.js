// server/routes/products.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const cloudinary=require("../config/cloudinary")
const uploadToR2 = require("../config/uploadtor2");
// ── Helper: build product query ───────────────────────────────────────────────
const BASE_SELECT = `
  SELECT p.id, p.name, c.name AS category, p.price,
         p.old_price AS oldPrice, p.rating, p.badge,
         p.img, p.description, p.stock
  FROM   products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

// GET /api/products  – list with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, badge, search, limit = 50, offset = 0 } = req.query;

    let sql    = BASE_SELECT + " WHERE 1=1";
    const args = [];

    if (category) { sql += " AND c.slug = ?";            args.push(category); }
    if (minPrice) { sql += " AND p.price >= ?";           args.push(Number(minPrice)); }
    if (maxPrice) { sql += " AND p.price <= ?";           args.push(Number(maxPrice)); }
    if (badge)    { sql += " AND p.badge = ?";            args.push(badge); }
    if (search)   { sql += " AND p.name LIKE ?";          args.push(`%${search}%`); }

    const orderMap = { asc: "p.price ASC", desc: "p.price DESC", rating: "p.rating DESC", newest: "p.created_at DESC" };
    sql += ` ORDER BY ${orderMap[sort] || "p.id ASC"}`;
    sql += " LIMIT ? OFFSET ?";
    args.push(Number(limit), Number(offset));

    const [rows] = await db.query(sql, args);

    // total count (for pagination)
    let countSql = "SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1";
    const countArgs = [];
    if (category) { countSql += " AND c.slug = ?"; countArgs.push(category); }
    if (minPrice) { countSql += " AND p.price >= ?"; countArgs.push(Number(minPrice)); }
    if (maxPrice) { countSql += " AND p.price <= ?"; countArgs.push(Number(maxPrice)); }
    if (badge)    { countSql += " AND p.badge = ?";  countArgs.push(badge); }
    if (search)   { countSql += " AND p.name LIKE ?"; countArgs.push(`%${search}%`); }
    const [[{ total }]] = await db.query(countSql, countArgs);

    res.json({ data: rows, total, limit: Number(limit), offset: Number(offset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/featured  – rating == 5 or badge not null
router.get("/featured", async (req, res) => {
  try {
    const [rows] = await db.query(
      BASE_SELECT + " WHERE p.rating = 5 OR p.badge IS NOT NULL ORDER BY p.rating DESC LIMIT 8"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const [[product]] = await db.query(BASE_SELECT + " WHERE p.id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products  – admin: create product
// CREATE PRODUCT WITH IMAGE
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, category_id, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "name and price required" });
    }

    let imageUrl = null;

    // upload image if exists
    if (req.file) {
      imageUrl = await uploadToR2(req.file);
    }

    const [result] = await db.query(
      "INSERT INTO products (name, category_id, price, img) VALUES (?, ?, ?, ?)",
      [name, category_id || null, price, imageUrl]
    );

    res.status(201).json({
      message: "Product created ✅",
      image: imageUrl,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// PUT /api/products/:id  – admin: update product
router.put("/:id", auth, admin, upload.single("image"), async (req, res) => {
  try {
    const { name, category_id, price, old_price, rating, badge, description, stock } = req.body;

    // 1️⃣ Get old product
    const [rows] = await db.query(
      "SELECT img FROM products WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    let img = rows[0].img; // old image

    // 2️⃣ If new image uploaded
    if (req.file) {

      // 🔥 delete old image from cloudinary
      if (img) {
        const parts = img.split("/");
        const fileName = parts[parts.length - 1].split(".")[0];

        await cloudinary.uploader.destroy(`products/${fileName}`);
      }

      // 🔥 upload new image
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });
      };

      const result = await streamUpload(req);
      img = result.secure_url;
    }

    // 3️⃣ Update DB
    await db.query(
      `UPDATE products SET 
        name=?, category_id=?, price=?, old_price=?, rating=?, badge=?, img=?, description=?, stock=?
       WHERE id=?`,
      [
        name,
        category_id || null,
        price,
        old_price || null,
        rating || 4,
        badge || null,
        img,
        description || null,
        stock || 100,
        req.params.id
      ]
    );

    res.json({ message: "Product updated", image: img });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE /api/products/:id  – admin: delete product
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
