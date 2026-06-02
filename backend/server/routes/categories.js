// server/routes/categories.js

const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");


// ─────────────────────────────────────────────────────────────
// GET /api/categories  → list with product count
// ─────────────────────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.name, c.slug,
             COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});


// ─────────────────────────────────────────────────────────────
// GET /api/categories/:slug/products
// ─────────────────────────────────────────────────────────────
router.get("/:slug/products", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, c.name AS category, p.price,
              p.old_price AS oldPrice, p.rating, p.badge,
              p.img, p.description, p.stock
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug = ?
       ORDER BY p.id`,
      [req.params.slug]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category products" });
  }
});


// ─────────────────────────────────────────────────────────────
// POST /api/categories  → create (ADMIN)
// ─────────────────────────────────────────────────────────────
router.post("/", auth, admin, async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug required" });
    }

    const [result] = await db.query(
      "INSERT INTO categories (name, slug) VALUES (?, ?)",
      [name, slug]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      slug,
      productCount: 0
    });

  } catch (err) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Category already exists" });
    }

    res.status(500).json({ error: "Failed to create category" });
  }
});


// ─────────────────────────────────────────────────────────────
// PUT /api/categories/:id  → update (ADMIN)
// ─────────────────────────────────────────────────────────────
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { name, slug } = req.body;
    const id = req.params.id;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug required" });
    }

    const [result] = await db.query(
      "UPDATE categories SET name = ?, slug = ? WHERE id = ?",
      [name, slug, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});


// ─────────────────────────────────────────────────────────────
// DELETE /api/categories/:id  → delete (ADMIN, SAFE)
// ─────────────────────────────────────────────────────────────
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const id = req.params.id;

    // 🔍 Check if products exist
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM products WHERE category_id = ?",
      [id]
    );

    if (rows[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete category: products are linked"
      });
    }

    const [result] = await db.query(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});


module.exports = router;