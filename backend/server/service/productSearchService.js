const db = require("../db");

async function searchProducts(filters = {}, options = {}) {
  const limit = Math.min(Number(options.limit) || 20, 100);
  const offset = Math.max(Number(options.offset) || 0, 0);

  let sql = `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.price,
      p.img,
      p.category_id,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.deleted = false
  `;

  const args = [];

  // CATEGORY
  if (filters.category_id) {
    sql += ` AND p.category_id = ?`;
    args.push(filters.category_id);
  }

  // SEARCH - Use FULLTEXT and aliases for flexible matching
  if (filters.search) {
    sql += `
      AND (
        MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE)
        OR p.name LIKE ?
        OR p.brand LIKE ?
        OR c.aliases LIKE ?
      )
    `;
    args.push(filters.search, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  // BRAND
  if (filters.brand) {
    sql += ` AND LOWER(p.brand) = LOWER(?)`;
    args.push(filters.brand);
  }

  // MIN PRICE
  if (filters.minPrice !== undefined) {
    sql += ` AND p.price >= ?`;
    args.push(filters.minPrice);
  }

  // MAX PRICE
  if (filters.maxPrice !== undefined) {
    sql += ` AND p.price <= ?`;
    args.push(filters.maxPrice);
  }

  sql += ` ORDER BY p.price ASC, p.id DESC LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const [products] = await db.query(sql, args);

  return products;
}

module.exports = searchProducts;