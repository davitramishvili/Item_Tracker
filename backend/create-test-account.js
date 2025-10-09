require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

async function createTestAccount() {
  let connection;

  try {
    console.log('✅ Connecting to database...\n');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Configuration
    const SOURCE_USER_EMAIL = 'leri@leri.com'; // Change this to the actual email
    const TEST_EMAIL = 'test@test.com';
    const TEST_USERNAME = 'testuser';
    const TEST_PASSWORD = 'Test123!'; // Change this to desired password
    const TEST_FULL_NAME = 'Test User';

    // 1. Find source user (Leri)
    console.log('📋 Finding source user (Leri)...');
    const [sourceUsers] = await connection.execute(
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [SOURCE_USER_EMAIL]
    );

    if (sourceUsers.length === 0) {
      console.log('❌ Source user not found. Available users:');
      const [allUsers] = await connection.execute(
        'SELECT id, email, full_name FROM users'
      );
      console.table(allUsers);
      console.log('\n⚠️  Please update SOURCE_USER_EMAIL in the script with the correct email.');
      process.exit(1);
    }

    const sourceUserId = sourceUsers[0].id;
    console.log('✅ Found source user:', sourceUsers[0].email, '(ID:', sourceUserId, ')\n');

    // 2. Check if test user already exists
    console.log('📋 Checking if test user already exists...');
    const [existingUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ? OR username = ?',
      [TEST_EMAIL, TEST_USERNAME]
    );

    let testUserId;

    if (existingUsers.length > 0) {
      console.log('⚠️  Test user already exists:', existingUsers[0].email);
      console.log('Using existing test user (ID:', existingUsers[0].id, ')\n');
      testUserId = existingUsers[0].id;

      // Delete existing items for this test user
      console.log('📋 Cleaning up existing test user items...');
      const [deleteResult] = await connection.execute(
        'DELETE FROM items WHERE user_id = ?',
        [testUserId]
      );
      console.log('✅ Deleted', deleteResult.affectedRows, 'existing items\n');
    } else {
      // 3. Create test user
      console.log('📋 Creating test user...');
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

      const [result] = await connection.execute(
        `INSERT INTO users (email, username, password_hash, full_name, is_verified)
         VALUES (?, ?, ?, ?, ?)`,
        [TEST_EMAIL, TEST_USERNAME, hashedPassword, TEST_FULL_NAME, 1]
      );

      testUserId = result.insertId;
      console.log('✅ Created test user:', TEST_EMAIL, '(ID:', testUserId, ')');
      console.log('   Username:', TEST_USERNAME);
      console.log('   Password:', TEST_PASSWORD, '\n');
    }

    // 4. Get all items from source user
    console.log('📋 Fetching items from source user...');
    const [sourceItems] = await connection.execute(
      `SELECT name, quantity, price_per_unit, currency, category, description, created_at
       FROM items
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [sourceUserId]
    );

    if (sourceItems.length === 0) {
      console.log('⚠️  No items found for source user');
      process.exit(0);
    }

    console.log('✅ Found', sourceItems.length, 'items to copy\n');

    // 5. Copy items to test user
    console.log('📋 Copying items to test user...');
    let copiedCount = 0;

    for (const item of sourceItems) {
      await connection.execute(
        `INSERT INTO items (user_id, name, quantity, price_per_unit, currency, category, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testUserId,
          item.name,
          item.quantity,
          item.price_per_unit,
          item.currency,
          item.category,
          item.description,
          item.created_at
        ]
      );
      copiedCount++;
      process.stdout.write(`\r   Copied ${copiedCount}/${sourceItems.length} items...`);
    }

    console.log('\n✅ Successfully copied all items!\n');

    // 6. Verify
    console.log('📋 Verifying copied items...');
    const [testItems] = await connection.execute(
      'SELECT COUNT(*) as count FROM items WHERE user_id = ?',
      [testUserId]
    );

    console.log('✅ Test user now has', testItems[0].count, 'items\n');

    // 7. Summary
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│       ✅ TEST ACCOUNT CREATED SUCCESSFULLY      │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log('\n📊 Account Details:');
    console.log('   Email:    ', TEST_EMAIL);
    console.log('   Username: ', TEST_USERNAME);
    console.log('   Password: ', TEST_PASSWORD);
    console.log('   User ID:  ', testUserId);
    console.log('   Items:    ', testItems[0].count);
    console.log('\n🔐 Login Credentials:');
    console.log('   Email/Username:', TEST_EMAIL, 'or', TEST_USERNAME);
    console.log('   Password:      ', TEST_PASSWORD);
    console.log('\n⚠️  NOTE: Items have been copied but:');
    console.log('   - No item images copied (S3 images belong to original user)');
    console.log('   - No sales history copied');
    console.log('   - No snapshots copied');
    console.log('\n✅ You can now login and test features safely!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

// Run the script
createTestAccount();
