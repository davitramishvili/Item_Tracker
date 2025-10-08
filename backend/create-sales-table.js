const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSalesTable() {
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

    // Create sales table
    console.log('📋 Creating sales table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity_sold INT NOT NULL,
        sale_price DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        buyer_name VARCHAR(255) DEFAULT NULL,
        buyer_phone VARCHAR(50) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        sale_date DATE NOT NULL,
        status ENUM('active', 'returned') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        INDEX idx_user_sale_date (user_id, sale_date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Sales table created successfully\n');

    // Verify table structure
    console.log('📋 Verifying table structure...');
    const [columns] = await connection.query('DESCRIBE sales');
    console.table(columns);

    console.log('\n✅ ✅ ✅ SALES TABLE CREATED SUCCESSFULLY! ✅ ✅ ✅\n');

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

createSalesTable();
