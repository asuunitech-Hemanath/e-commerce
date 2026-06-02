const express = require("express");

const router = express.Router();

const searchProducts = require("../service/productSearchService");

// GET /api/products/search?q=iphone
router.get("/", async (req, res) => {
  try {

    const filters = {
      search: req.query.q || "",
    };

    const products = await searchProducts(filters, {
      limit: req.query.limit,
      offset: req.query.offset,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
});

module.exports = router;