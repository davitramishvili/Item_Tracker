require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function fixCascadeDelete() {
  let connection;

  try {
    console.log('✅ Connecting to database...\n');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    console.log('📋 Removing CASCADE DELETE from foreign keys...\n');

    // 1. Fix sales table - item_id should SET NULL when item deleted
    console.log('1️⃣  Fixing sales table...');

    // First, make item_id nullable
    await connection.query(`
      ALTER TABLE sales
      MODIFY COLUMN item_id INT NULL
    `);
    console.log('   ✅ Made item_id nullable');

    // Drop existing foreign key
    await connection.query(`
      ALTER TABLE sales
      DROP FOREIGN KEY sales_ibfk_2
    `);
    console.log('   ✅ Dropped old foreign key on item_id');

    // Add new foreign key without CASCADE
    await connection.query(`
      ALTER TABLE sales
      ADD CONSTRAINT sales_ibfk_2
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    `);
    console.log('   ✅ Added new foreign key with SET NULL\n');

    // 2. Fix item_snapshots table
    console.log('2️⃣  Fixing item_snapshots table...');

    // Make item_id nullable
    await connection.query(`
      ALTER TABLE item_snapshots
      MODIFY COLUMN item_id INT NULL
    `);
    console.log('   ✅ Made item_id nullable');

    // Drop existing foreign key
    await connection.query(`
      ALTER TABLE item_snapshots
      DROP FOREIGN KEY item_snapshots_ibfk_1
    `);
    console.log('   ✅ Dropped old foreign key on item_id');

    // Add new foreign key without CASCADE
    await connection.query(`
      ALTER TABLE item_snapshots
      ADD CONSTRAINT item_snapshots_ibfk_1
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    `);
    console.log('   ✅ Added new foreign key with SET NULL\n');

    // 3. Fix item_history table
    console.log('3️⃣  Fixing item_history table...');

    // Make item_id nullable
    await connection.query(`
      ALTER TABLE item_history
      MODIFY COLUMN item_id INT NULL
    `);
    console.log('   ✅ Made item_id nullable');

    // Drop existing foreign key
    await connection.query(`
      ALTER TABLE item_history
      DROP FOREIGN KEY item_history_ibfk_1
    `);
    console.log('   ✅ Dropped old foreign key on item_id');

    // Add new foreign key without CASCADE
    await connection.query(`
      ALTER TABLE item_history
      ADD CONSTRAINT item_history_ibfk_1
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    `);
    console.log('   ✅ Added new foreign key with SET NULL\n');

    // 4. Verify changes
    console.log('📋 Verifying foreign key constraints...\n');

    const [salesFK] = await connection.query(`
      SELECT
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        DELETE_RULE
      FROM information_schema.KEY_COLUMN_USAGE
      JOIN information_schema.REFERENTIAL_CONSTRAINTS USING (CONSTRAINT_NAME, CONSTRAINT_SCHEMA)
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME = 'items'
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `, [process.env.DB_NAME]);

    console.table(salesFK);

    console.log('\n✅ ✅ ✅ CASCADE DELETE FIXED SUCCESSFULLY! ✅ ✅ ✅\n');
    console.log('Now when items are deleted:');
    console.log('  ✅ Sales records are preserved (item_id set to NULL)');
    console.log('  ✅ Snapshots are preserved (item_id set to NULL)');
    console.log('  ✅ History is preserved (item_id set to NULL)');
    console.log('  ✅ Historical data remains intact!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);

    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('\n⚠️  The foreign key name might be different.');
      console.log('Run this query to find the correct constraint name:');
      console.log(`
        SELECT
          CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
          AND REFERENCED_TABLE_NAME = 'items';
      `);
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

// Run the script
fixCascadeDelete();
