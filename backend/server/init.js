// init.js – run schema.sql
const fs = require("fs");
const db = require("./db");

async function init() {
  try {
    const sql = fs.readFileSync("./server/schema.sql", "utf8");
    const statements = sql.split(";").map(s => s.trim()).filter(s => s);
    for (const stmt of statements) {
      if (stmt) {
        await db.query(stmt);
      }
    }
    console.log("Database initialized");
  } catch (err) {
    console.error("Init error:", err);
  } finally {
    process.exit();
  }
}

init();