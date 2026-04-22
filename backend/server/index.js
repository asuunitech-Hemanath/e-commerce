// server/index.js – FIXED VERSION

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const morgan   = require("morgan");
const session  = require("express-session");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// ✅ CORS (FIXED FOR LOCAL + NGROK)
app.use(cors({
  origin: "*", // allow all (quick fix)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.options("*", cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan("dev"));

// ── Session (FIXED) ───────────────────────────────────────────────────────────

app.use(session({
  secret: process.env.SESSION_SECRET || "myshop-dev-secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,      // ❌ was true → now fixed
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/auth",       require("./routes/auth"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/cart",       require("./routes/cart"));
app.use("/api/orders",     require("./routes/orders"));
app.use("/api/contact",    require("./routes/contact"));
app.use("/api/wishlist",   require("./routes/wishlist"));

// ── Health-check ──────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ── Test route ────────────────────────────────────────────────────────────────

app.get("/test", (req, res) => {
  console.log("Test API hit");
  res.send("Working");
});

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
module.exports = (err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
};
// ── Start server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT ||  5002;

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});

