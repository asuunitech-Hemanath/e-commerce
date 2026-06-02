const express = require("express");
const router = express.Router();

const extractFilters = require("../utils/chatParser");
const validateChat = require("../middleware/validateChat");
const searchProducts = require("../service/productSearchService");

// ---------------- TEST ----------------

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chat API working",
  });
});

// Helper function to format response message
function buildResponseMessage(filters, productCount) {
  let message = "";

  if (productCount === 0) {
    message = "Sorry, ";

    if (filters.category_name) {
      message += `we don't have any ${filters.category_name.toLowerCase()}s`;
    } else {
      message += "we don't have any products matching your search";
    }

    if (filters.maxPrice !== undefined) {
      message += ` under ₹${filters.maxPrice}`;
    }

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      message = message.replace(" under", " between");
      message += ` and ₹${filters.maxPrice}`;
    } else if (filters.minPrice !== undefined) {
      message += ` above ₹${filters.minPrice}`;
    }

    message += " in our store right now. 😔";

    return message;
  }

  // Success message
  message = `Great! We found ${productCount} product${productCount > 1 ? "s" : ""}`;

  if (filters.category_name) {
    message += ` in ${filters.category_name}`;
  }

  if (filters.maxPrice !== undefined && filters.minPrice !== undefined) {
    message += ` between ₹${filters.minPrice} and ₹${filters.maxPrice}`;
  } else if (filters.maxPrice !== undefined) {
    message += ` under ₹${filters.maxPrice}`;
  } else if (filters.minPrice !== undefined) {
    message += ` above ₹${filters.minPrice}`;
  }

  message += " for you. Check them out! 🛍️";

  return message;
}

// ---------------- CHAT ----------------

router.post("/", validateChat, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // ✅ FIXED: await missing bug
    const filters = await extractFilters(message);

    console.log("CHAT MESSAGE:", message);

    const products = await searchProducts(filters);

    if (!products.length) {
      const noProductMessage = buildResponseMessage(filters, 0);
      
      return res.json({
        success: false,
        userMessage: message,
        filters,
        reply: noProductMessage,
        products: [],
      });
    }

    // ---------------- SUCCESS RESPONSE ----------------

    const successMessage = buildResponseMessage(filters, products.length);

    return res.json({
      success: true,
      userMessage: message,
      filters,
      count: products.length,
      reply: successMessage,
      products,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Chat failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;