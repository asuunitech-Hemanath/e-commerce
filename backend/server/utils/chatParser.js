const db = require("../db");

// simple in-memory cache (prevents DB hit every request)
let cachedCategories = null;
let cachedBrands = null;
let budgetCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCategories() {
  if (cachedCategories && Date.now() - lastCacheTime < CACHE_DURATION) {
    return cachedCategories;
  }

  const [rows] = await db.query(`
    SELECT id, name, aliases
    FROM categories
  `);

  cachedCategories = rows;
  lastCacheTime = Date.now();
  return rows;
}

// Fetch all unique brands from products table
async function getBrands() {
  if (cachedBrands && Date.now() - lastCacheTime < CACHE_DURATION) {
    return cachedBrands;
  }

  const [rows] = await db.query(`
    SELECT DISTINCT LOWER(brand) as brand
    FROM products
    WHERE brand IS NOT NULL AND brand != ''
    ORDER BY brand ASC
  `);

  cachedBrands = rows.map(row => row.brand).filter(b => b);
  return cachedBrands;
}

// Calculate budget dynamically based on average price per category
async function calculateBudgetMap() {
  if (budgetCache && Date.now() - lastCacheTime < CACHE_DURATION) {
    return budgetCache;
  }

  const [rows] = await db.query(`
    SELECT 
      c.name,
      ROUND(AVG(p.price) * 1.5) as suggested_budget
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.deleted = false
    GROUP BY c.id, c.name
  `);

  budgetCache = {};
  rows.forEach(row => {
    if (row.name) {
      budgetCache[row.name.toLowerCase()] = row.suggested_budget || 10000;
    }
  });

  // Fallback defaults if no data
  if (Object.keys(budgetCache).length === 0) {
    budgetCache = {
      smartphone: 20000,
      laptops: 50000,
      headphones: 5000,
      tvs: 30000,
      watches: 10000,
      cameras: 25000,
      speakers: 5000,
      shoes: 3000,
      shirts: 1000,
      tablets: 20000,
      electronics: 10000,
      accessories: 2000,
    };
  }

  lastCacheTime = Date.now();
  return budgetCache;
}

module.exports = async function extractFilters(message) {
  const text = (message || "").toLowerCase().trim();

  const filters = {};
  let detectedCategoryName = null;
  let detectedCategory = null;

  // ---------------- CATEGORY MAP ----------------

  const categories = await getCategories();
  const categoryMap = {};

  for (const category of categories) {
    const name = String(category.name).toLowerCase().trim();

    categoryMap[name] = {
      id: category.id,
      name: category.name,
    };

    if (category.aliases) {
      // Handle new comma-delimited format with leading/trailing commas
      const aliasString = String(category.aliases);
      const aliases = aliasString.split(",");

      for (const alias of aliases) {
        const clean = alias.toLowerCase().trim();
        if (clean) {
          categoryMap[clean] = {
            id: category.id,
            name: category.name,
          };
        }
      }
    }
  }

  // ---------------- FIND CATEGORY ----------------

  const words = text.match(/\b[\w-]+\b/g) || [];
  let searchText = text;

  for (const word of words) {
    const match = categoryMap[word.toLowerCase()];
    if (match) {
      filters.category_id = match.id;
      detectedCategoryName = match.name;
      detectedCategory = word;
      // Remove the detected category word from search text
      searchText = searchText.replace(new RegExp(`\\b${word}\\b`, "gi"), "").trim();
      break;
    }
  }

  // ---------------- BRANDS ----------------
  // Dynamic brand detection from database

  const brands = await getBrands();
  
  // Check all brands from database
  for (const brand of brands) {
    if (searchText.includes(brand)) {
      filters.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
      searchText = searchText.replace(new RegExp(`\\b${brand}\\b`, "gi"), "").trim();
      break;
    }
  }

  // ---------------- PRICE FILTERS ----------------
  // NOTE: Check keywords FIRST before exact numbers to avoid conflicts

  // "between" keyword (check first as it has two prices)
  const betweenMatch = searchText.match(/between\s*(\d+)\s*(?:to|and|-)\s*(\d+)/i);
  if (betweenMatch) {
    filters.minPrice = Number(betweenMatch[1]);
    filters.maxPrice = Number(betweenMatch[2]);
    searchText = searchText.replace(betweenMatch[0], "").trim();
  }

  // "above" or "over" keyword (check before exact numbers)
  const aboveMatch = searchText.match(/(?:above|over|more than|minimum)\s*(?:₹|rs\.?)?\s*(\d+)/i);
  if (aboveMatch) {
    filters.minPrice = Number(aboveMatch[1]);
    searchText = searchText.replace(aboveMatch[0], "").trim();
  }

  // "under" or "below" keyword (check before exact numbers)
  const underMatch = searchText.match(/(?:under|below|within|upto|up to)\s*(?:₹|rs\.?)?\s*(\d+)/i);
  if (underMatch) {
    filters.maxPrice = Number(underMatch[1]);
    searchText = searchText.replace(underMatch[0], "").trim();
  }

  // Exact numbers ONLY if no keywords matched (e.g., "300" or "₹300")
  if (!filters.maxPrice && !filters.minPrice) {
    const exactPriceMatch = searchText.match(/(?:₹|rs\.?)?\s*(\d+)(?!\d)/);
    if (exactPriceMatch) {
      filters.maxPrice = Number(exactPriceMatch[1]);
      searchText = searchText.replace(exactPriceMatch[0], "").trim();
    }
  }

  // Budget-related keywords (assign default budget if category is found)
  if (detectedCategory && (searchText.includes("budget") || searchText.includes("affordable") || searchText.includes("cheap") || searchText.includes("in budget"))) {
    if (!filters.maxPrice && !filters.minPrice) {
      // Get dynamic budget map
      const budgetMap = await calculateBudgetMap();
      filters.maxPrice = budgetMap[detectedCategoryName.toLowerCase()] || 10000;
    }
    searchText = searchText.replace(/(?:budget|affordable|cheap|in budget)/gi, "").trim();
  }

  // Only keep search if there's remaining text after extracting category/brand/price
  if (searchText) {
    filters.search = searchText;
  }

  // attach readable category name for response
  if (detectedCategoryName) {
    filters.category_name = detectedCategoryName;
  }

  return filters;
};