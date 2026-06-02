// server/routes/cart.js

const express = require("express");
const router = express.Router();

const db = require("../db");
const auth = require("../middleware/authMiddleware");

const mapCartItem = require("../mappers/cartMapper");

// ─────────────────────────────────────────────
// BASE QUERY
// ─────────────────────────────────────────────

const CART_SELECT = `
  SELECT
    ci.id,
    ci.user_id,
    ci.product_id,
    ci.qty,

    p.name,
    p.img,
    p.price,

    (p.price * ci.qty) AS line_total

  FROM cart_items ci

  JOIN products p
    ON p.id = ci.product_id

  WHERE ci.user_id = ?
`;

// ─────────────────────────────────────────────
// GET CART
// ─────────────────────────────────────────────

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId required",
      });
    }

    const [items] = await db.query(
      CART_SELECT,
      [userId]
    );

    res.json(items.map(mapCartItem));

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch cart",
    });
  }
});

// ─────────────────────────────────────────────
// ADD TO CART
// ─────────────────────────────────────────────

router.post("/", auth, async (req, res) => {
  try {
    const {
      userId,
      product_id,
      qty = 1,
    } = req.body;

    if (!userId || !product_id) {
      return res.status(400).json({
        error: "Missing data",
      });
    }

    await db.query(
      `
      INSERT INTO cart_items
      (
        user_id,
        product_id,
        qty
      )
      VALUES (?, ?, ?)

      ON DUPLICATE KEY UPDATE
      qty = qty + VALUES(qty)
      `,
      [userId, product_id, qty]
    );

    const [items] = await db.query(
      CART_SELECT,
      [userId]
    );

    res.status(201).json(
      items.map(mapCartItem)
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to add to cart",
    });
  }
});

// ─────────────────────────────────────────────
// UPDATE CART QTY
// ─────────────────────────────────────────────

router.put("/:productId", auth, async (req, res) => {
  try {
    const {
      userId,
      qty,
    } = req.body;

    if (!userId || !qty) {
      return res.status(400).json({
        error: "Missing data",
      });
    }

    const [result] = await db.query(
      `
      UPDATE cart_items
      SET qty = ?
      WHERE user_id = ?
      AND product_id = ?
      `,
      [
        qty,
        userId,
        req.params.productId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Item not found",
      });
    }

    const [items] = await db.query(
      CART_SELECT,
      [userId]
    );

    res.json(
      items.map(mapCartItem)
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update cart",
    });
  }
});

// ─────────────────────────────────────────────
// DELETE SINGLE ITEM
// ─────────────────────────────────────────────

router.delete("/:productId", auth, async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId required",
      });
    }

    await db.query(
      `
      DELETE FROM cart_items
      WHERE user_id = ?
      AND product_id = ?
      `,
      [
        userId,
        req.params.productId,
      ]
    );

    const [items] = await db.query(
      CART_SELECT,
      [userId]
    );

    res.json(
      items.map(mapCartItem)
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to remove item",
    });
  }
});

// ─────────────────────────────────────────────
// CLEAR CART
// ─────────────────────────────────────────────

router.delete("/", auth, async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId required",
      });
    }

    await db.query(
      `
      DELETE FROM cart_items
      WHERE user_id = ?
      `,
      [userId]
    );

    res.json([]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to clear cart",
    });
  }
});

module.exports = router;