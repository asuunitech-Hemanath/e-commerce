// server/routes/contact.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// POST /api/contact
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: "name, email and message are required" });

    await db.query(
      "INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)",
      [name, email, subject || null, message]
    );
    res.status(201).json({ message: "Message received. We'll get back to you soon!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

// GET /api/contact  – admin: list messages
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
