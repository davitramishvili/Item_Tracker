const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumns() {
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
    const [currentColumns] = await connection.query('DESCRIBE users');
    const columnNames = currentColumns.map(col => col.Field);

    console.log('Current columns:', columnNames.join(', '));

    // Rename password to password_hash if it exists
    if (columnNames.includes('password') && !columnNames.includes('password_hash')) {
      await connection.query('ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL');
      console.log('✅ Renamed password to password_hash');
    }

    // Add full_name column if it doesn't exist
    if (!columnNames.includes('full_name')) {
      await connection.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(200) AFTER password_hash');
      console.log('✅ Added full_name column');
    }

    // Add google_id column if it doesn't exist
    if (!columnNames.includes('google_id')) {
      await connection.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER full_name');
      console.log('✅ Added google_id column');
    }

    // Show updated table structure
    const [rows] = await connection.query('DESCRIBE users');
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

addMissingColumns();
