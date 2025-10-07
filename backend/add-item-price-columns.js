const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPriceColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'item_tracker'
    });

    console.log('✅ Connected to database');

    // Check current columns
    const [currentColumns] = await connection.query('DESCRIBE items');
    const columnNames = currentColumns.map(col => col.Field);

    console.log('Current columns:', columnNames.join(', '));

    // Add price_per_unit column if it doesn't exist
    if (!columnNames.includes('price_per_unit')) {
      await connection.query('ALTER TABLE items ADD COLUMN price_per_unit DECIMAL(10, 2) AFTER quantity');
      console.log('✅ Added price_per_unit column');
    }

    // Add currency column if it doesn't exist
    if (!columnNames.includes('currency')) {
      await connection.query("ALTER TABLE items ADD COLUMN currency ENUM('GEL', 'USD', 'EUR') DEFAULT 'GEL' AFTER price_per_unit");
      console.log('✅ Added currency column');
    }

    // Show updated table structure
    const [rows] = await connection.query('DESCRIBE items');
    console.log('\n📋 Updated table structure:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

addPriceColumns();
