const express = require("express");
const router = express.Router();

const db = require("../db");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const mapProduct = require("../mappers/productMapper");
const convertProductInput =require("../converters/productConverter");

const upload = require("../middleware/upload");
const uploadToR2 = require("../config/uploadToR2");
const { deleteFromR2 } = require("../config/r2");

// ─────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────

const BASE_SELECT = `
  SELECT 
    p.id,
    p.name,
    p.brand,
    c.name AS category,
    p.category_id,
    CAST(p.price AS DECIMAL(10,2)) AS price,
    CAST(p.old_price AS DECIMAL(10,2)) AS oldPrice,
    p.rating,
    p.badge,
    p.img,
    p.description,
    p.stock,
    p.specifications
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

// ─────────────────────────────────────────────
// GET ALL PRODUCTS
// ─────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort,
      badge,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const limitValue = Math.min(Number(limit), 50);
    const offsetValue = Math.max(Number(offset), 0);

    let sql = BASE_SELECT + " WHERE 1=1";
    const args = [];

    if (category) {
      sql += " AND c.slug = ?";
      args.push(category);
    }

    if (minPrice) {
      sql += " AND p.price >= ?";
      args.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += " AND p.price <= ?";
      args.push(Number(maxPrice));
    }

    if (badge) {
      sql += " AND p.badge = ?";
      args.push(badge);
    }

    if (search) {
      sql += " AND p.name LIKE ?";
      args.push(`%${search}%`);
    }

    const orderMap = {
      asc: "p.price ASC",
      desc: "p.price DESC",
      rating: "p.rating DESC",
      newest: "p.created_at DESC",
    };

    sql += ` ORDER BY ${orderMap[sort] || "p.id ASC"}`;
    sql += " LIMIT ? OFFSET ?";

    args.push(limitValue, offsetValue);

    const [rows] = await db.query(sql, args);

    // ── MEDIA OPTIMIZATION ──
    const productIds = rows.map((p) => p.id);

    let mediaMap = {};

    if (productIds.length > 0) {
      const [allMedia] = await db.query(
        `
        SELECT id, product_id, url, type, is_primary
        FROM product_media
        WHERE product_id IN (?)
        ORDER BY is_primary DESC, id ASC
        `,
        [productIds]
      );

      mediaMap = allMedia.reduce((acc, m) => {
        if (!acc[m.product_id]) acc[m.product_id] = [];
        acc[m.product_id].push(m);
        return acc;
      }, {});
    }

    const formattedRows = rows.map((p) => ({
      ...p,
      media: mediaMap[p.id] || [],
    }));

    // ── COUNT ──
    let countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE 1=1
    `;

    const countArgs = [];

    if (category) {
      countSql += " AND c.slug = ?";
      countArgs.push(category);
    }

    if (minPrice) {
      countSql += " AND p.price >= ?";
      countArgs.push(Number(minPrice));
    }

    if (maxPrice) {
      countSql += " AND p.price <= ?";
      countArgs.push(Number(maxPrice));
    }

    if (badge) {
      countSql += " AND p.badge = ?";
      countArgs.push(badge);
    }

    if (search) {
      countSql += " AND p.name LIKE ?";
      countArgs.push(`%${search}%`);
    }

    const [[{ total }]] = await db.query(countSql, countArgs);

    res.json({
      data: formattedRows.map(mapProduct),
      total,
      limit: limitValue,
      offset: offsetValue,
    });
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch products",
      details: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET SINGLE PRODUCT
// ─────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const [productRows] = await db.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!productRows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [mediaRows] = await db.query(
      `
      SELECT id, url, type, is_primary
      FROM product_media
      WHERE product_id = ?
      ORDER BY is_primary DESC
      `,
      [req.params.id]
    );

    res.json(
  mapProduct({
    ...productRows[0],
    media: mediaRows,
  })
);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─────────────────────────────────────────────
// ADD PRODUCT
// ─────────────────────────────────────────────

router.post("/", auth, admin, upload.array("images", 5), async (req, res) => {
  try {
    const {
  name,
  brand,
  category_id,
  price,
  old_price,
  rating,
  badge,
  description,
  stock,
  specifications,
} = convertProductInput(req.body);

    if (!req.files?.length) {
      return res.status(400).json({ error: "Images required" });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const url = await uploadToR2(file);
      uploadedImages.push(url);
    }

    const [result] = await db.query(
      `
      INSERT INTO products
      (name, brand, category_id, price, old_price, rating, badge, img, description, stock, specifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        brand || null,
        category_id || null,
        price,
        old_price || null,
        rating || 4,
        badge || null,
        uploadedImages[0],
        description || null,
        stock || 0,
        specifications || null,
      ]
    );

    const productId = result.insertId;

    for (let i = 0; i < uploadedImages.length; i++) {
      await db.query(
        `
        INSERT INTO product_media
        (product_id, url, type, is_primary)
        VALUES (?, ?, 'image', ?)
        `,
        [productId, uploadedImages[i], i === 0 ? 1 : 0]
      );
    }

    res.status(201).json({
      success: true,
      id: productId,
      images: uploadedImages,
    });
  } catch (err) {
    console.error("PRODUCT UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────

router.put("/:id", auth, admin, upload.array("images", 5), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT img FROM products WHERE id = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    let img = rows[0].img;

    if (req.files?.length) {
      img = await uploadToR2(req.files[0]);
    }

    const {
      name,
      category_id,
      price,
      old_price,
      rating,
      badge,
      description,
      stock,
    } = req.body;

    await db.query(
      `
      UPDATE products SET
        name=?,
        category_id=?,
        price=?,
        old_price=?,
        rating=?,
        badge=?,
        img=?,
        description=?,
        stock=?
      WHERE id=?
      `,
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
        req.params.id,
      ]
    );

    res.json({ message: "Product updated", image: img });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ─────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────

router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const [media] = await db.query(
      "SELECT url FROM product_media WHERE product_id = ?",
      [id]
    );

   for (const m of media) {
  try {
    if (m.url) {
      const key = m.url.split(".r2.dev/")[1];

      if (key) {
        await deleteFromR2(key);
      }
    }
  } catch (err) {
    console.error(
      "Failed to delete image from R2:",
      err.message
    );
  }
}

    await db.query("DELETE FROM product_media WHERE product_id = ?", [id]);
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;