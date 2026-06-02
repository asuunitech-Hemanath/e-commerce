-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  rating TINYINT DEFAULT 4,
  badge ENUM('New','Sale','Hot') DEFAULT NULL,
  image_url VARCHAR(300),
  description TEXT,
  stock INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  UNIQUE KEY unique_cart (user_id, product_id)
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  UNIQUE KEY unique_wish (user_id, product_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80),
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  city VARCHAR(80),
  country VARCHAR(80),
  zip VARCHAR(20),

  notes TEXT,
  payment_method VARCHAR(30) DEFAULT 'card',

  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2) DEFAULT 25.00,
  total DECIMAL(10,2),

  status ENUM('pending','processing','shipped','delivered','cancelled')
         DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  name VARCHAR(200),
  price DECIMAL(10,2),
  qty INT,

  FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE SET NULL
);

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REVIEWS (NEW - IMPORTANT)
-- ============================================================
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

-- ============================================================
-- INDEXES (PERFORMANCE)
-- ============================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);

DESCRIBE orders;


SELECT * FROM users;


CREATE TABLE product_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url TEXT NOT NULL,
  type ENUM('image','video') DEFAULT 'image',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

SHOW CREATE TABLE products;

ALTER TABLE products
DROP FOREIGN KEY products_ibfk_1;

select * from users;

CREATE INDEX idx_products_category_created
ON products(category_id, created_at DESC);

CREATE INDEX idx_product_media_product
ON product_media(product_id);

CREATE INDEX idx_categories_slug
ON categories(slug);

CREATE INDEX idx_orders_user_created
ON orders(user_id, created_at DESC);

CREATE INDEX idx_orders_status_created
ON orders(status, created_at DESC);

CREATE INDEX idx_cart_user
ON cart_items(user_id);


SHOW INDEX FROM product_media;

ALTER TABLE products
ADD CONSTRAINT fk_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE RESTRICT;

DELETE FROM categories WHERE id = 1;

ALTER TABLE products ADD COLUMN brand VARCHAR(255);

select * from orders;

ALTER TABLE products 
ADD COLUMN deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_at DATETIME NULL;

SELECT * FROM products WHERE deleted = false;

DESCRIBE products;

ALTER TABLE products
ADD COLUMN specifications JSON NULL;

SELECT* FROM product_media;
SELECT id, name FROM products;
ALTER TABLE orders ADD COLUMN user_id INT;

SHOW INDEX FROM users;

UPDATE products
SET category_id = 26
WHERE id = 99;

CREATE INDEX idx_products_name
ON products(name);