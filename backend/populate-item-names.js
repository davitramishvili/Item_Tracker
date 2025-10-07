const mysql = require('mysql2/promise');
require('dotenv').config();

async function populateItemNames() {
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

    // Get all distinct item names per user from existing items
    console.log('📋 Getting existing item names...');
    const [existingNames] = await connection.query(`
      SELECT DISTINCT user_id, TRIM(name) as name
      FROM items
      ORDER BY user_id, name
    `);

    console.log(`Found ${existingNames.length} unique item names\n`);

    // Insert them into item_names table (using INSERT IGNORE to skip duplicates)
    if (existingNames.length > 0) {
      console.log('📋 Inserting item names into item_names table...');

      for (const item of existingNames) {
        try {
          await connection.query(`
            INSERT IGNORE INTO item_names (user_id, name)
            VALUES (?, ?)
          `, [item.user_id, item.name]);
        } catch (err) {
          console.log(`⚠️  Skipped duplicate: ${item.name} for user ${item.user_id}`);
        }
      }

      console.log('✅ Item names populated successfully\n');
    }

    // Verify results
    console.log('📋 Verifying item_names table...');
    const [count] = await connection.query('SELECT COUNT(*) as total FROM item_names');
    console.log(`Total item names in table: ${count[0].total}\n`);

    const [sample] = await connection.query('SELECT * FROM item_names LIMIT 10');
    console.log('Sample data:');
    console.table(sample);

    console.log('\n✅ ✅ ✅ ITEM NAMES POPULATED SUCCESSFULLY! ✅ ✅ ✅\n');

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

populateItemNames();
