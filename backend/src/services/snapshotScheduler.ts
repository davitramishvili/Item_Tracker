import cron from 'node-cron';
import { HistoryModel } from '../models/History';
import { promisePool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class SnapshotScheduler {
  private static isRunning = false;

  // Schedule daily snapshots at 1:00 AM
  static start(): void {
    // Cron format: minute hour day month weekday
    // '0 1 * * *' means: At 01:00 (1 AM) every day
    cron.schedule('0 1 * * *', async () => {
      console.log('🕐 Running scheduled daily snapshots at 1:00 AM...');
      await this.createSnapshotsForAllUsers();
    }, {
      timezone: 'Asia/Tbilisi' // Adjust timezone as needed (GMT+4)
    });

    console.log('✅ Snapshot scheduler started - Daily snapshots at 1:00 AM (Asia/Tbilisi)');
  }

  // Create snapshots for all users
  static async createSnapshotsForAllUsers(): Promise<void> {
    if (this.isRunning) {
      console.log('⏸️  Snapshot job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Get all active users
      const [users] = await promisePool.execute<RowDataPacket[]>(
        'SELECT id FROM users'
      );

      let totalSnapshots = 0;
      let successfulUsers = 0;
      let failedUsers = 0;

      console.log(`📸 Creating snapshots for ${users.length} users...`);

      for (const user of users) {
        try {
          const count = await HistoryModel.createUserSnapshots(user.id, 'auto');
          totalSnapshots += count;
          successfulUsers++;
        } catch (error) {
          console.error(`❌ Failed to create snapshot for user ${user.id}:`, error);
          failedUsers++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Daily snapshots completed in ${duration}s`);
      console.log(`   📊 Users: ${successfulUsers} successful, ${failedUsers} failed`);
      console.log(`   📸 Total snapshots: ${totalSnapshots}`);
    } catch (error) {
      console.error('❌ Error in scheduled snapshot job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Manual trigger for testing
  static async triggerManual(): Promise<void> {
    console.log('🔧 Manually triggering snapshot job...');
    await this.createSnapshotsForAllUsers();
  }
}
