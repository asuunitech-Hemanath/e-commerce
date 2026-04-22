-- ============================================================
-- MyShop Database Schema
-- Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS myshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE myshop;

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(191) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('customer','admin') DEFAULT 'customer',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── CATEGORIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE,
  slug  VARCHAR(100) NOT NULL UNIQUE,
  count INT DEFAULT 0
);

-- ── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  category_id  INT,
  price        DECIMAL(10,2) NOT NULL,
  old_price    DECIMAL(10,2),
  rating       TINYINT DEFAULT 4,
  badge        VARCHAR(20),
  img          VARCHAR(300),
  description  TEXT,
  stock        INT DEFAULT 100,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ── CART ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  VARCHAR(128) NOT NULL,
  product_id  INT NOT NULL,
  qty         INT DEFAULT 1,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart (session_id, product_id)
);

-- ── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  session_id     VARCHAR(128),
  first_name     VARCHAR(80) NOT NULL,
  last_name      VARCHAR(80),
  email          VARCHAR(191) NOT NULL,
  phone          VARCHAR(30),
  address        TEXT,
  city           VARCHAR(80),
  country        VARCHAR(80),
  zip            VARCHAR(20),
  notes          TEXT,
  payment_method VARCHAR(30) DEFAULT 'card',
  subtotal       DECIMAL(10,2),
  shipping       DECIMAL(10,2) DEFAULT 25.00,
  total          DECIMAL(10,2),
  status         ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── ORDER ITEMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT,
  name       VARCHAR(200),
  price      DECIMAL(10,2),
  qty        INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ── CONTACT MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(191) NOT NULL,
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── WISHLIST ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  VARCHAR(128) NOT NULL,
  product_id  INT NOT NULL,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (session_id, product_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT IGNORE INTO categories (name, slug, count) VALUES
  ('Smartphones',    'smartphones',    5),
  ('Laptops',        'laptops',        2),
  ('Watches',        'watches',        3),
  ('Tablets',        'tablets',        8),
  ('Speakers',       'speakers',       4),
  ('Cameras',        'cameras',        3),
  ('Headphones',     'headphones',     5),
  ('TVs',            'tvs',            5),
  ('Accessories',    'accessories',    3),
  ('Electronics',    'electronics',    3);

INSERT IGNORE INTO products (name, category_id, price, old_price, rating, badge, img, description, stock) VALUES
  ('All Brand Smartphones', 1, 1099.00, 1250.00, 4, NULL,   '/img/product-1.png', 'Latest smartphones from top brands.',   50),
  ('All Brand Laptops',     2, 1900.00, 2500.00, 4, 'New',  '/img/product-2.jpg', 'High-performance laptops.',             30),
  ('Smart Watches',         3,  799.00,  899.00, 4, 'Sale', '/img/product-4.jpg', 'Feature-rich smartwatches.',            80),
  ('iPad',                  4, 1099.00, 1299.00, 5, NULL,   '/img/product-5.png', 'Apple iPad latest generation.',         40),
  ('Soundbar',              5,  800.00, 1300.00, 4, NULL,   '/img/product-5.webp', 'Immersive soundbar experience.',        25),
  ('Indoor Camera',         6,  200.00,  350.00, 4, 'New',  '/img/product-6.png', 'HD indoor security camera.',            60),
  ('Polaroid Instant Camera',6,  90.00,  150.00, 4, 'Sale', '/img/product-7.png', 'Polaroid Now Gen 2 instant camera.',    35),
  ('Overhead Headphones',   7,  399.00,  550.00, 5, NULL,   '/img/product-8.png', 'Premium over-ear headphones.',          45),
  ('Smart TV',              8, 1250.00, 1050.00, 5, NULL,   '/img/product-9.png', '4K Ultra HD Smart TV.',                 20),
  ('DSLR Camera',           6,  950.00, 1300.00, 5, NULL,   '/img/product-10.png', 'Professional DSLR camera.',             15),
  ('All Types Accessories', 9,  800.00, 1500.00, 5, NULL,   '/img/product-11.png', 'All kinds of accessories.',            100),
  ('Drones',               10, 1999.00, 2499.00, 5, NULL,   '/img/product-12.png', 'Advanced consumer drones.',             12);

UPDATE products SET img='public/img/product.jpg' WHERE id=4;

DELETE FROM products WHERE id > 12;