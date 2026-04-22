// server/routes/categories.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/categories
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/:slug/products
router.get("/:slug/products", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, c.name AS category, p.price, p.old_price AS oldPrice,
              p.rating, p.badge, p.img, p.description, p.stock
       FROM   products p
       JOIN   categories c ON c.id = p.category_id
       WHERE  c.slug = ?
       ORDER  BY p.id`,
      [req.params.slug]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});

// POST /api/categories  – admin
router.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "name and slug required" });
    const [result] = await db.query("INSERT INTO categories (name, slug) VALUES (?,?)", [name, slug]);
    res.status(201).json({ id: result.insertId, name, slug, count: 0 });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Category already exists" });
    res.status(500).json({ error: "Failed to create category" });
  }
});

module.exports = router;
