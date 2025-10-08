const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSaleGroupsTable() {
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

    // Create sale_groups table
    console.log('📋 Creating sale_groups table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sale_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        buyer_name VARCHAR(255) DEFAULT NULL,
        buyer_phone VARCHAR(50) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        sale_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_sale_date (user_id, sale_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Sale_groups table created successfully\n');

    // Add sale_group_id to sales table if it doesn't exist
    console.log('📋 Adding sale_group_id to sales table...');

    // Check if column exists
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sale_group_id'",
      [process.env.DB_NAME || 'item_tracker']
    );

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE sales
        ADD COLUMN sale_group_id INT DEFAULT NULL AFTER user_id,
        ADD COLUMN returned_at TIMESTAMP NULL DEFAULT NULL AFTER status,
        ADD FOREIGN KEY (sale_group_id) REFERENCES sale_groups(id) ON DELETE CASCADE,
        ADD INDEX idx_sale_group (sale_group_id)
      `);
      console.log('✅ Added sale_group_id, returned_at columns and indexes to sales table\n');
    } else {
      console.log('ℹ️  sale_group_id column already exists\n');
    }

    // Verify table structure
    console.log('📋 Verifying sale_groups table structure...');
    const [groupColumns] = await connection.query('DESCRIBE sale_groups');
    console.table(groupColumns);

    console.log('\n📋 Verifying updated sales table structure...');
    const [salesColumns] = await connection.query('DESCRIBE sales');
    console.table(salesColumns);

    console.log('\n✅ ✅ ✅ SALE GROUPS TABLE CREATED SUCCESSFULLY! ✅ ✅ ✅\n');

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

createSaleGroupsTable();
