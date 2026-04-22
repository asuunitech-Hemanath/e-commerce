// server/routes/orders.js (FIXED for user_id)
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// POST /api/orders  – place order from current cart
router.post("/",async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const {
      userId,   // ✅ IMPORTANT
      first_name, last_name, email, phone,
      address, city, country, zip, notes,
      payment_method = "card",
    } = req.body;

    if (!userId || !first_name || !email) {
      return res.status(400).json({ error: "userId, first_name and email are required" });
    }

    // ✅ Fetch cart using user_id
    const [cartItems] = await conn.query(
      `SELECT ci.product_id, p.name, p.price, ci.qty
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.qty, 0);
    const shipping = 25;
    const total    = subtotal + shipping;

    // ✅ Insert order (user_id instead of session_id)
    const [orderResult] = await conn.query(
      `INSERT INTO orders
       (user_id, first_name, last_name, email, phone, address, city, country, zip,
        notes, payment_method, subtotal, shipping, total)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId,
        first_name,
        last_name || null,
        email,
        phone || null,
        address || null,
        city || null,
        country || null,
        zip || null,
        notes || null,
        payment_method,
        subtotal,
        shipping,
        total
      ]
    );

    const orderId = orderResult.insertId;

    // ✅ Insert order items
    for (const item of cartItems) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?,?,?,?,?)",
        [orderId, item.product_id, item.name, item.price, item.qty]
      );
    }

    // ✅ Clear cart using user_id
    await conn.query(
      "DELETE FROM cart_items WHERE user_id = ?",
      [userId]
    );

    await conn.commit();

    res.status(201).json({
      message: "Order placed successfully ✅",
      order_id: orderId,
      total,
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  } finally {
    conn.release();
  }
});


// GET /api/orders/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const [[order]] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [req.params.id]
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [req.params.id]
    );

    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});


// GET /api/orders
router.get("/", auth, async (_req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT
        o.id,
        o.user_id,
        o.first_name,
        o.last_name,
        o.email,
        o.phone,
        o.address,
        o.city,
        o.country,
        o.zip,
        o.notes,
        o.payment_method,
        o.subtotal,
        o.shipping,
        o.total,
        o.status,
        o.created_at,
        u.name AS customer_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// PATCH /api/orders/:id/status
router.patch("/:id/status", auth,async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending","processing","shipped","delivered","cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowed.join(", ")}`
      });
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;