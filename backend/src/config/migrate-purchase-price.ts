import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runPurchasePriceMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'item_tracker',
      multipleStatements: true
    });

    console.log('📦 Connected to MySQL database');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../../add_purchase_price_migration.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('🚀 Running purchase price migration...');
    await connection.query(migration);

    console.log('✅ Purchase price migration completed successfully!');
    console.log('📊 Added columns:');
    console.log('   - purchase_price (DECIMAL(10,2), default 0)');
    console.log('   - purchase_currency (ENUM, default USD)');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
runPurchasePriceMigration();
