// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const productMediaRoutes = require("./routes/productMedia");
const initDb = require("./utils/initDb");
const productSearchRoutes = require("./routes/productSearch");
const environment = require("./config/environment");
const app = express();

// ── SECURITY ─────────────────────────────────────────

app.use(helmet());

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
});

app.use(limiter);

// ── CORS FIX ─────────────────────────────────────────

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  environment.FRONTEND_URL,
  "https://starlit-squirrel-52dc09.netlify.app",
  "https://agent-69fd9dfc700c0cba--cerulean-meringue-47bacd.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin ||allowedOrigins.includes(origin) ||
  origin.endsWith(".netlify.app")
) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.options("*", (req, res) => {
  res.sendStatus(200);
});
// ── BODY PARSER ──────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── LOGGER ───────────────────────────────────────────

app.use(morgan("dev"));

// ── SESSION ──────────────────────────────────────────

app.use(
  session({
    secret: process.env.SESSION_SECRET || "myshop-dev-secret",

    resave: false,

    saveUninitialized: true,

    cookie: {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
},
  })
);

// ── ROUTES ───────────────────────────────────────────
app.use("/api/products/search", productSearchRoutes);
app.use("/api/products", productMediaRoutes);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/chat", require("./routes/chat"));

app.get("/api/users", async (req, res) => {
  try {
    res.json([
      { id: 1, name: "Naveen", email: "naveen@gmail.com" },
      { id: 2, name: "Arun", email: "arun@gmail.com" },
      { id: 3, name: "Admin", email: "admin@gmail.com" },
    ]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

// ── HEALTH CHECK ─────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
  });
});


// ── TEST ROUTE ───────────────────────────────────────

app.get("/test", (req, res) => {
  console.log("Test API hit");
  res.send("Working");
});

// ── 404 HANDLER ──────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ── ERROR HANDLER ────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// ── START SERVER ─────────────────────────────────────

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);

await initDb();  

});