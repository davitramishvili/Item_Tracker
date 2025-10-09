# AWS Deployment Guide - Daily Snapshot Scheduler

## What's Been Added

The application now includes an **automated daily snapshot scheduler** that runs at 1:00 AM every day (Asia/Tbilisi timezone).

### New Files:
- `backend/src/services/snapshotScheduler.ts` - Scheduler service using node-cron
- Updated `backend/src/server.ts` - Starts scheduler on server initialization
- Updated `backend/package.json` - Added `node-cron` dependency

---

## AWS Deployment Steps

### 1. **Update Your AWS EC2 Instance**

SSH into your AWS EC2 instance:
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

Navigate to your project directory:
```bash
cd /path/to/your/project/backend
```

### 2. **Pull Latest Changes**

```bash
git pull origin main  # or your branch name
```

### 3. **Install New Dependencies**

```bash
npm install
```

This will install `node-cron` and its types.

### 4. **Rebuild TypeScript**

```bash
npm run build
```

### 5. **Restart Your Application**

#### If using PM2 (recommended):
```bash
pm2 restart backend
pm2 logs backend  # Verify scheduler started
```

You should see: `✅ Snapshot scheduler started - Daily snapshots at 1:00 AM (Asia/Tbilisi)`

#### If using systemd:
```bash
sudo systemctl restart your-app-service
sudo systemctl status your-app-service
```

#### If running directly:
```bash
# Stop the current process (Ctrl+C if in foreground)
npm start
```

---

## Configuration

### Timezone Configuration

The scheduler is currently set to **Asia/Tbilisi** (GMT+4). To change it:

1. Edit `backend/src/services/snapshotScheduler.ts`
2. Find line with `timezone: 'Asia/Tbilisi'`
3. Change to your desired timezone (e.g., `'America/New_York'`, `'Europe/London'`, `'UTC'`)

### Schedule Time Configuration

To change the snapshot time from 1:00 AM:

1. Edit `backend/src/services/snapshotScheduler.ts`
2. Find line with `cron.schedule('0 1 * * *', ...)`
3. Modify cron pattern:
   - `'0 1 * * *'` = 1:00 AM daily
   - `'0 2 * * *'` = 2:00 AM daily
   - `'30 3 * * *'` = 3:30 AM daily
   - `'0 0 * * *'` = Midnight daily

**Cron Format:** `minute hour day month weekday`

---

## Verification

### Check Scheduler is Running

After deployment, check your application logs:

```bash
pm2 logs backend
# or
sudo journalctl -u your-app-service -f
```

You should see:
```
✅ Snapshot scheduler started - Daily snapshots at 1:00 AM (Asia/Tbilisi)
```

### Wait for First Snapshot

At 1:00 AM, you should see:
```
🕐 Running scheduled daily snapshots at 1:00 AM...
📸 Creating snapshots for X users...
✅ Daily snapshots completed in X.XXs
   📊 Users: X successful, 0 failed
   📸 Total snapshots: X
```

### Manually Test the Scheduler

To test without waiting until 1:00 AM, you can add a test endpoint:

1. Create `backend/src/routes/testRoutes.ts`:
```typescript
import express from 'express';
import { SnapshotScheduler } from '../services/snapshotScheduler';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

// Test endpoint - remove after testing
router.post('/trigger-snapshot', authenticate, async (req, res) => {
  try {
    await SnapshotScheduler.triggerManual();
    res.json({ message: 'Snapshot job triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger snapshot' });
  }
});

export default router;
```

2. Add to `server.ts`:
```typescript
import testRoutes from './routes/testRoutes';
app.use('/api/test', testRoutes);
```

3. Call the endpoint:
```bash
curl -X POST http://your-server/api/test/trigger-snapshot \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**IMPORTANT:** Remove this test endpoint after verification for security.

---

## Important AWS Considerations

### 1. **Server Timezone**

Make sure your EC2 instance timezone matches your expectation:

```bash
# Check current timezone
timedatectl

# Change if needed (example for Tbilisi)
sudo timedatectl set-timezone Asia/Tbilisi
```

### 2. **Process Management**

The scheduler requires the Node.js process to be **running continuously**. Use a process manager:

#### Recommended: PM2
```bash
npm install -g pm2
pm2 start dist/server.js --name backend
pm2 startup  # Auto-start on reboot
pm2 save
```

#### Alternative: systemd service
Create `/etc/systemd/system/item-tracker.service`:
```ini
[Unit]
Description=Item Tracker Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable item-tracker
sudo systemctl start item-tracker
```

### 3. **Database Considerations**

- Snapshots will create records for ALL users daily
- Monitor database size growth over time
- Consider adding a cleanup job for old snapshots (e.g., delete snapshots older than 1 year)

### 4. **Logging**

Monitor logs to ensure snapshots run successfully:
```bash
# PM2
pm2 logs backend --lines 200

# systemd
sudo journalctl -u item-tracker -f

# Direct logs (if configured)
tail -f /var/log/item-tracker.log
```

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout <previous-commit-hash>

# Rebuild
npm install
npm run build

# Restart
pm2 restart backend
```

---

## Testing Checklist

- [ ] Dependencies installed (`node-cron` in package.json)
- [ ] TypeScript compiled successfully
- [ ] Server starts without errors
- [ ] Scheduler startup message appears in logs
- [ ] Manual trigger test works (optional)
- [ ] Wait for 1:00 AM or check logs next day
- [ ] Verify snapshots created in database
- [ ] Check `item_snapshots` table has new records with `snapshot_type = 'auto'`

---

## Database Verification Query

Check if auto snapshots are being created:

```sql
-- Check today's auto snapshots
SELECT
  snapshot_date,
  COUNT(*) as total_snapshots,
  snapshot_type
FROM item_snapshots
WHERE snapshot_date = CURDATE()
  AND snapshot_type = 'auto'
GROUP BY snapshot_date, snapshot_type;

-- Check recent snapshots
SELECT *
FROM item_snapshots
WHERE snapshot_type = 'auto'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Support

If the scheduler doesn't run:
1. Check server timezone matches expected
2. Verify process is running continuously (not restarting)
3. Check application logs for errors
4. Ensure database connection is stable
5. Verify `node-cron` is installed: `npm list node-cron`
