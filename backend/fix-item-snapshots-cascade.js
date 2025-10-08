const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixForeignKeyConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'item_tracker'
  });

  try {
    console.log('🔧 Fixing foreign key constraint for item_snapshots...');

    // Drop existing foreign key constraint
    await connection.execute(`
      ALTER TABLE item_snapshots
      DROP FOREIGN KEY item_snapshots_ibfk_1
    `);
    console.log('✅ Dropped old foreign key constraint');

    // Add new foreign key with CASCADE
    await connection.execute(`
      ALTER TABLE item_snapshots
      ADD CONSTRAINT item_snapshots_ibfk_1
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    `);
    console.log('✅ Added new foreign key with CASCADE');

    console.log('\n✅ Foreign key constraint fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing foreign key:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixForeignKeyConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
