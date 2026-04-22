// server/db.js  – MySQL connection pool
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "S@ndy400",
  database:           process.env.DB_NAME     || "myshop",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            "utf8mb4",
});

// Test connection on startup, but do not stop the server if MySQL is down.
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅  MySQL connected →", process.env.DB_NAME || "myshop");
    conn.release();
  } catch (err) {
    console.error("❌  MySQL connection failed:", err.message);
    console.error("   The API will still run, but database queries may fail until MySQL is available.");
  }
})();

module.exports = pool;
