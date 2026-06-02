const express = require("express");
const router = express.Router();

const db = require("../db");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const convertOrderInput = require("../converters/orderConverter");
const mapOrder = require("../mappers/orderMapper");

// ─────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────

router.post("/", auth, async (req, res) => {
  let conn;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const userId = req.user.id;

    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      country,
      zip,
      notes,
      payment_method,
    } = convertOrderInput(req.body);

    // ─────────────────────────────
    // VALIDATION (FIXED WITH ROLLBACK)
    // ─────────────────────────────

    if (
      !first_name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !country ||
      !zip
    ) {
      await conn.rollback();
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const zipRegex = /^[0-9]{6}$/;

    if (!nameRegex.test(first_name)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid first name" });
    }

    if (last_name && !nameRegex.test(last_name)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid last name" });
    }

    if (!emailRegex.test(email)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid email" });
    }

    if (!phoneRegex.test(phone)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid phone" });
    }

    if (!zipRegex.test(zip)) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid zip" });
    }

    // ─────────────────────────────
    // FETCH CART
    // ─────────────────────────────

    const [cartItems] = await conn.query(
      `
      SELECT ci.product_id, p.name, CAST(p.price AS DECIMAL(10,2)) AS price, ci.qty
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
      `,
      [userId]
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ─────────────────────────────
    // TOTALS
    // ─────────────────────────────

    const subtotal = parseFloat(cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.price) || 0) * (item.qty || 0),
      0
    ).toFixed(2));

    const shipping = 25;
    const total = parseFloat((subtotal + shipping).toFixed(2));

    // ─────────────────────────────
    // INSERT ORDER
    // ─────────────────────────────

    const [orderResult] = await conn.query(
      `
      INSERT INTO orders (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        country,
        zip,
        notes,
        payment_method,
        subtotal,
        shipping,
        total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        first_name,
        last_name || null,
        email,
        phone,
        address,
        city,
        country,
        zip,
        notes || null,
        payment_method,
        subtotal,
        shipping,
        total,
      ]
    );

    const orderId = orderResult.insertId;

    // ─────────────────────────────
    // ORDER ITEMS
    // ─────────────────────────────

    for (const item of cartItems) {
      await conn.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          name,
          price,
          qty
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, item.product_id, item.name, item.price, item.qty]
      );
    }

    // ─────────────────────────────
    // CLEAR CART
    // ─────────────────────────────

    await conn.query(
      `DELETE FROM cart_items WHERE user_id = ?`,
      [userId]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      subtotal,
      shipping,
      total,
    });

  } catch (err) {
    if (conn) await conn.rollback();

    console.error(err);

    res.status(500).json({
      error: "Failed to place order",
    });

  } finally {
    if (conn) conn.release();
  }
});

// ─────────────────────────────────────────────
// GET ORDERS (UNCHANGED but SAFE)
// ─────────────────────────────────────────────

router.get("/", auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [orders] = await db.query(
      `
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const orderIds = orders.map(o => o.id);

    let itemsMap = {};

    if (orderIds.length > 0) {
      const [allItems] = await db.query(
        `
        SELECT *
        FROM order_items
        WHERE order_id IN (?)
        `,
        [orderIds]
      );

      itemsMap = allItems.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
    }

    const formatted = orders.map(order => ({
      ...order,
      items: itemsMap[order.id] || []
    }));

    res.json({
      data: formatted.map(mapOrder),
      limit,
      offset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─────────────────────────────────────────────
// UPDATE STATUS (OK)
// ─────────────────────────────────────────────

router.patch("/:id/status", auth, admin, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await db.query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;