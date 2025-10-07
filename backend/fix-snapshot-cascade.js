const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSnapshotCascade() {
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

    // Step 1: Find the foreign key constraint name
    console.log('🔍 Finding foreign key constraints...');
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'item_snapshots'
        AND REFERENCED_TABLE_NAME = 'items'
        AND REFERENCED_COLUMN_NAME = 'id'
    `, [process.env.DB_NAME || 'item_tracker']);

    if (constraints.length === 0) {
      console.log('⚠️  No foreign key constraint found');
      return;
    }

    const fkName = constraints[0].CONSTRAINT_NAME;
    console.log(`✅ Found constraint: ${fkName}\n`);

    // Step 2: Drop the old foreign key
    console.log('🗑️  Dropping old foreign key with CASCADE...');
    await connection.query(`
      ALTER TABLE item_snapshots
      DROP FOREIGN KEY ${fkName}
    `);
    console.log('✅ Old foreign key dropped\n');

    // Step 3: Add new foreign key WITHOUT CASCADE
    console.log('➕ Adding new foreign key without CASCADE...');
    await connection.query(`
      ALTER TABLE item_snapshots
      ADD CONSTRAINT ${fkName}
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE NO ACTION
    `);
    console.log('✅ New foreign key added\n');

    // Step 4: Verify the change
    console.log('🔍 Verifying foreign key configuration...');
    const [fkInfo] = await connection.query(`
      SELECT
        CONSTRAINT_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = ?
        AND TABLE_NAME = 'item_snapshots'
        AND REFERENCED_TABLE_NAME = 'items'
    `, [process.env.DB_NAME || 'item_tracker']);

    console.table(fkInfo);

    console.log('\n✅ ✅ ✅ FOREIGN KEY FIXED SUCCESSFULLY! ✅ ✅ ✅');
    console.log('Snapshots will now persist even when items are deleted.\n');

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

fixSnapshotCascade();
