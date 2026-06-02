const db = require("../db");

const initDb = async () => {
  try {
    console.log("🔄 Initializing database schema...");

    // =====================================================
    // USERS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer','admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =====================================================
    // CATEGORIES
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        aliases TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =====================================================
    // PRODUCTS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(255),
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        old_price DECIMAL(10,2),
        rating TINYINT DEFAULT 4,
        badge ENUM('New','Sale','Hot') DEFAULT NULL,
        img TEXT,
        description TEXT,
        stock INT DEFAULT 100,
        specifications JSON NULL,
        deleted BOOLEAN DEFAULT false,
        deleted_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id)
          REFERENCES categories(id)
          ON DELETE SET NULL
      )
    `);

    // =====================================================
    // PRODUCT MEDIA
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS product_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        url TEXT NOT NULL,
        type ENUM('image','video') DEFAULT 'image',
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE
      )
    `);

    // =====================================================
    // CART ITEMS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        qty INT DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE,

        UNIQUE KEY unique_cart (user_id, product_id)
      )
    `);

    // =====================================================
    // WISHLIST
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE,

        UNIQUE KEY unique_wish (user_id, product_id)
      )
    `);

    // =====================================================
    // ORDERS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
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

        status ENUM(
          'pending',
          'processing',
          'shipped',
          'delivered',
          'cancelled'
        ) DEFAULT 'pending',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    // =====================================================
    // ORDER ITEMS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
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
      )
    `);

    // =====================================================
    // CONTACT MESSAGES
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(191) NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =====================================================
    // REVIEWS
    // =====================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
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
      )
    `);

    // =====================================================
    // INDEXES
    // =====================================================

    const indexes = [
      `
      CREATE INDEX idx_products_category_created
      ON products(category_id, created_at DESC)
      `,

      `
      CREATE INDEX idx_product_media_product
      ON product_media(product_id)
      `,

      `
      CREATE INDEX idx_categories_slug
      ON categories(slug)
      `,

      `
      CREATE INDEX idx_orders_user_created
      ON orders(user_id, created_at DESC)
      `,

      `
      CREATE INDEX idx_orders_status_created
      ON orders(status, created_at DESC)
      `,

      `
      CREATE INDEX idx_users_role
      ON users(role)
      `,

      `
      CREATE INDEX idx_reviews_product_created
      ON reviews(product_id, created_at DESC)
      `,

      `
      CREATE INDEX idx_wishlist_user
      ON wishlist(user_id)
      `,

      `
      CREATE INDEX idx_order_items_order
      ON order_items(order_id)
      `,

      `
      CREATE INDEX idx_products_name
      ON products(name)
      `,

      `
      CREATE FULLTEXT INDEX ft_products_search
      ON products(name, description)
      `,
    ];

    for (const indexQuery of indexes) {
      try {
        await db.query(indexQuery);
      } catch (err) {
        // Ignore duplicate index errors
        if (err.code !== "ER_DUP_KEYNAME") {
          throw err;
        }
      }
    }

    console.log("✅ Database schema + indexes ready");

  } catch (err) {
    console.error("❌ DB Init Error:", err);
  }
};

module.exports = initDb;