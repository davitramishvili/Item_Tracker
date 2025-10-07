const mysql = require('mysql2/promise');
require('dotenv').config();

async function createItemNamesTable() {
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

    // Create item_names table
    console.log('📋 Creating ITEM_NAMES table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS item_names (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_name (user_id, name),
        INDEX idx_user_id (user_id)
      )
    `);
    console.log('✅ Item names table created successfully\n');

    // Verify table structure
    console.log('📋 ITEM_NAMES table structure:');
    const [desc] = await connection.query('DESCRIBE item_names');
    console.table(desc);

    console.log('\n✅ ✅ ✅ ITEM_NAMES TABLE SET UP SUCCESSFULLY! ✅ ✅ ✅\n');

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

createItemNamesTable();
