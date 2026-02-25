const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUsernameColumn() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'item_tracker'
    });

    console.log('✅ Connected to database');

    // Add username column after id
    const addColumnSQL = `
      ALTER TABLE users
      ADD COLUMN username VARCHAR(100) NOT NULL UNIQUE AFTER id,
      ADD INDEX idx_username (username)
    `;

    await connection.query(addColumnSQL);
    console.log('✅ Username column added successfully!');

    // Show updated table structure
    const [rows] = await connection.query('DESCRIBE users');
    console.log('\n📋 Updated table structure:');
    console.table(rows);

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Username column already exists');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

addUsernameColumn();
