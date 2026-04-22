const express = require("express");
const router  = express.Router();
const db      = require("../db");

const WISH_SELECT = `
  SELECT w.product_id, p.name, p.img, p.price, p.old_price AS oldPrice, p.badge
  FROM wishlist w
  JOIN products p ON p.id = w.product_id
  WHERE w.user_id = ?
`;

// GET
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;

    const [rows] = await db.query(WISH_SELECT, [userId]);
    res.json(rows);
  } catch (err) {
    console.log("wishlist GET error:", err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// POST (toggle)
router.post("/", async (req, res) => {
  try {
        console.log("body:", req.body);


    const { userId, product_id } = req.body;

    if (!userId || !product_id) {
      return res.status(400).json({ error: "Missing data" });
    }

    const [[exists]] = await db.query(
      "SELECT id FROM wishlist WHERE user_id=? AND product_id=?",
      [userId, product_id]
    );

    if (exists) {
      await db.query(
        "DELETE FROM wishlist WHERE user_id=? AND product_id=?",
        [userId, product_id]
      );
    } else {
      await db.query(
        "INSERT INTO wishlist (user_id, product_id) VALUES (?,?)",
        [userId, product_id]
      );
    }

    const [rows] = await db.query(WISH_SELECT, [userId]);
    res.json({ added: !exists, items: rows });

  } catch (err) {
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

// DELETE
router.delete("/:productId", async (req, res) => {
  try {
    const userId = req.query.userId;

    await db.query(
      "DELETE FROM wishlist WHERE user_id=? AND product_id=?",
      [userId, req.params.productId]
    );

    const [rows] = await db.query(WISH_SELECT, [userId]);
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

module.exports = router;