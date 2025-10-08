const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateExistingSales() {
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

    // Get all existing sales that don't have a sale_group_id
    console.log('📋 Finding sales without sale groups...');
    const [sales] = await connection.query(`
      SELECT * FROM sales WHERE sale_group_id IS NULL ORDER BY id
    `);

    if (sales.length === 0) {
      console.log('ℹ️  No sales to migrate. All sales are already in groups.\n');
      return;
    }

    console.log(`📦 Found ${sales.length} sales to migrate\n`);

    let migratedCount = 0;
    let groupsCreated = 0;

    // Start transaction
    await connection.beginTransaction();

    try {
      for (const sale of sales) {
        // Create a sale_group for each existing sale
        const [groupResult] = await connection.query(`
          INSERT INTO sale_groups (user_id, buyer_name, buyer_phone, notes, sale_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          sale.user_id,
          sale.buyer_name,
          sale.buyer_phone,
          sale.notes,
          sale.sale_date,
          sale.created_at,
          sale.updated_at
        ]);

        const saleGroupId = groupResult.insertId;
        groupsCreated++;

        // Update the sale to reference the new group
        await connection.query(`
          UPDATE sales SET sale_group_id = ? WHERE id = ?
        `, [saleGroupId, sale.id]);

        migratedCount++;

        // Log progress every 10 sales
        if (migratedCount % 10 === 0) {
          console.log(`   Migrated ${migratedCount}/${sales.length} sales...`);
        }
      }

      // Commit transaction
      await connection.commit();

      console.log('\n✅ Migration completed successfully!');
      console.log(`   📊 Total sales migrated: ${migratedCount}`);
      console.log(`   📦 Sale groups created: ${groupsCreated}\n`);

      // Verify migration
      console.log('📋 Verifying migration...');
      const [remainingSales] = await connection.query(`
        SELECT COUNT(*) as count FROM sales WHERE sale_group_id IS NULL
      `);

      if (remainingSales[0].count === 0) {
        console.log('✅ All sales now have sale groups!\n');
      } else {
        console.log(`⚠️  Warning: ${remainingSales[0].count} sales still without groups\n`);
      }

      // Show summary
      const [summary] = await connection.query(`
        SELECT
          COUNT(DISTINCT sg.id) as total_groups,
          COUNT(s.id) as total_sales,
          AVG(items_per_group) as avg_items_per_group
        FROM sale_groups sg
        LEFT JOIN (
          SELECT sale_group_id, COUNT(*) as items_per_group
          FROM sales
          GROUP BY sale_group_id
        ) as counts ON sg.id = counts.sale_group_id
        LEFT JOIN sales s ON sg.id = s.sale_group_id
      `);

      console.log('📊 Database Summary:');
      console.table(summary);

    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    }

    console.log('\n✅ ✅ ✅ MIGRATION COMPLETED SUCCESSFULLY! ✅ ✅ ✅\n');

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

migrateExistingSales();
