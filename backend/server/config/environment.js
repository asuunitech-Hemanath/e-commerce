// server/config/environment.js
require("dotenv").config();

const config = {
  development: {
    NODE_ENV: "development",
    PORT: process.env.PORT || 5000,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5000",
  },
  staging: {
    NODE_ENV: "staging",
    PORT: process.env.PORT || 5000,
    FRONTEND_URL: process.env.FRONTEND_URL || "https://staging.yoursite.com",
    API_BASE_URL: process.env.API_BASE_URL || "https://staging-api.yoursite.com",
  },
  production: {
    NODE_ENV: "production",
    PORT: process.env.PORT || 5000,
    FRONTEND_URL: process.env.FRONTEND_URL || "https://yoursite.com",
    API_BASE_URL: process.env.API_BASE_URL || "https://api.yoursite.com",
  },
};

const env = process.env.NODE_ENV || "development";
module.exports = config[env];
