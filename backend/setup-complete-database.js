const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupCompleteDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'item_tracker'
    });

    console.log('✅ Connected to database\n');

    // ==================== USERS TABLE ====================
    console.log('📋 Setting up USERS table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(200),
        google_id VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_verification_token (verification_token),
        INDEX idx_reset_password_token (reset_password_token)
      )
    `);
    console.log('✅ Users table ready\n');

    // ==================== ITEMS TABLE ====================
    console.log('📋 Setting up ITEMS table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INT DEFAULT 1,
        price_per_unit DECIMAL(10, 2),
        currency ENUM('GEL', 'USD', 'EUR') DEFAULT 'GEL',
        category VARCHAR(100),
        image_url VARCHAR(500),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_category (category)
      )
    `);
    console.log('✅ Items table ready\n');

    // ==================== ITEM HISTORY TABLE ====================
    console.log('📋 Setting up ITEM_HISTORY table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS item_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        user_id INT NOT NULL,
        quantity_before INT NOT NULL,
        quantity_after INT NOT NULL,
        change_amount INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_item_id (item_id),
        INDEX idx_changed_at (changed_at)
      )
    `);
    console.log('✅ Item history table ready\n');

    // ==================== ITEM SNAPSHOTS TABLE ====================
    console.log('📋 Setting up ITEM_SNAPSHOTS table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS item_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price_per_unit DECIMAL(10, 2),
        currency ENUM('GEL', 'USD', 'EUR'),
        category VARCHAR(100),
        snapshot_date DATE NOT NULL,
        snapshot_type ENUM('auto', 'manual') DEFAULT 'auto',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_item_snapshot (item_id, snapshot_date),
        INDEX idx_snapshot_date (snapshot_date),
        INDEX idx_item_id (item_id)
      )
    `);
    console.log('✅ Item snapshots table ready\n');

    // ==================== VERIFICATION ====================
    console.log('🔍 Verifying all tables...\n');

    const [tables] = await connection.query('SHOW TABLES');
    console.log('📊 Tables in database:');
    console.table(tables);

    console.log('\n📋 USERS table structure:');
    const [usersDesc] = await connection.query('DESCRIBE users');
    console.table(usersDesc);

    console.log('\n📋 ITEMS table structure:');
    const [itemsDesc] = await connection.query('DESCRIBE items');
    console.table(itemsDesc);

    console.log('\n📋 ITEM_HISTORY table structure:');
    const [historyDesc] = await connection.query('DESCRIBE item_history');
    console.table(historyDesc);

    console.log('\n📋 ITEM_SNAPSHOTS table structure:');
    const [snapshotsDesc] = await connection.query('DESCRIBE item_snapshots');
    console.table(snapshotsDesc);

    console.log('\n✅ ✅ ✅ ALL TABLES SET UP SUCCESSFULLY! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

setupCompleteDatabase();
