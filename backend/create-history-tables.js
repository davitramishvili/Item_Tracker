const mysql = require('mysql2/promise');
require('dotenv').config();

async function createHistoryTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'item_tracker'
  });

  try {
    // Create item_history table for tracking individual changes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS item_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        user_id INT NOT NULL,
        quantity_before INT NOT NULL,
        quantity_after INT NOT NULL,
        change_amount INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_item_id (item_id),
        INDEX idx_changed_at (changed_at)
      )
    `);
    console.log('✅ item_history table created successfully');

    // Create item_snapshots table for daily snapshots
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS item_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price_per_unit DECIMAL(10, 2),
        currency ENUM('GEL', 'USD'),
        category VARCHAR(100),
        snapshot_date DATE NOT NULL,
        snapshot_type ENUM('auto', 'manual') DEFAULT 'auto',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_item_snapshot (item_id, snapshot_date),
        INDEX idx_snapshot_date (snapshot_date),
        INDEX idx_item_id (item_id)
      )
    `);
    console.log('✅ item_snapshots table created successfully');

    console.log('\n✅ All history tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating history tables:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createHistoryTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
