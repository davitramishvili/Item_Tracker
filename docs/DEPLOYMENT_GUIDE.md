# AWS Deployment Guide - Item Tracker (100% FREE TIER)

Deploy your Item Tracker application on AWS completely **FREE** for the first 12 months.

## What You'll Get
- ✅ EC2 t2.micro server (750 hours/month free)
- ✅ MySQL database on EC2 (included, no extra cost)
- ✅ 30 GB storage (free)
- ✅ S3 for images (5GB free)
- ✅ Public IP address
- ✅ SSL/HTTPS (optional, using free Let's Encrypt)

## Total Cost
- **First 12 months:** $0
- **After 12 months:** ~$10-15/month (if kept running 24/7)

---

## Phase 1: Launch EC2 Instance

### Step 1.1: Create EC2 Instance
1. Log into **AWS Console** → Go to **EC2** Dashboard
2. Click **Launch Instance** (orange button)

3. **Name and tags:**
   - Name: `item-tracker-server`

4. **Application and OS Images (AMI):**
   - Quick Start → **Ubuntu**
   - Select: **Ubuntu Server 22.04 LTS**
   - Architecture: **64-bit (x86)**
   - ✅ Make sure it says "**Free tier eligible**"

5. **Instance type:**
   - Select: **t2.micro**
   - Shows: 1 vCPU, 1 GiB Memory
   - ✅ Make sure it says "**Free tier eligible**"

6. **Key pair (login):**
   - Click **Create new key pair**
   - Key pair name: `item-tracker-key`
   - Key pair type: **RSA**
   - Private key file format:
     - **`.pem`** (if you're using Mac, Linux, or Windows PowerShell)
     - **`.ppk`** (if you're using PuTTY on Windows)
   - Click **Create key pair**
   - 🔴 **IMPORTANT:** File downloads automatically - **SAVE IT SAFELY!** You can't download it again!

7. **Network settings:**
   - Click **Edit** button
   - Auto-assign public IP: **Enable**
   - Firewall (Security groups): **Create security group**
   - Security group name: `item-tracker-sg`
   - Description: `Allow HTTP, HTTPS, and SSH`

   **Inbound security group rules:** (click Add security group rule for each)

   | Type | Port | Source | Description |
   |------|------|--------|-------------|
   | SSH | 22 | My IP | SSH access from your computer |
   | HTTP | 80 | Anywhere (0.0.0.0/0) | Web traffic |
   | HTTPS | 443 | Anywhere (0.0.0.0/0) | Secure web traffic |

8. **Configure storage:**
   - Size: **30 GiB** (maximum for free tier)
   - Volume type: **gp2**
   - ✅ Delete on termination: Checked

9. **Advanced details:** Leave as default

10. **Summary** (right panel):
    - Number of instances: **1**
    - ✅ Verify "Free tier eligible" appears

11. Click **Launch instance** (orange button)

12. Click **View all instances**
    - Wait 2-3 minutes until "Instance state" shows **Running**
    - Status check shows **2/2 checks passed**

### Step 1.2: Note Your Public IP
1. Click on your instance in the list
2. In the details below, find and **copy** the **Public IPv4 address**
   - Example: `54.123.45.67`
   - 📝 **Save this** - you'll need it throughout the guide

---

## Phase 2: Connect to Your Server

### Step 2.1: Connect via SSH

**Windows (PowerShell):**
```powershell
# Navigate to where you saved the key
cd Downloads

# Connect (replace with YOUR public IP)
ssh -i item-tracker-key.pem ubuntu@54.123.45.67
```

**Mac/Linux:**
```bash
# Set correct permissions
chmod 400 ~/Downloads/item-tracker-key.pem

# Connect (replace with YOUR public IP)
ssh -i ~/Downloads/item-tracker-key.pem ubuntu@54.123.45.67
```

**Windows (PuTTY):**
1. Open PuTTY
2. Host Name: `ubuntu@YOUR-PUBLIC-IP`
3. Port: `22`
4. Connection → SSH → Auth → Credentials → Browse
5. Select your `.ppk` file
6. Click **Open**

**First connection:**
- You'll see: "Are you sure you want to continue connecting?"
- Type: `yes` and press Enter
- You should now see: `ubuntu@ip-xxx:~$`

✅ You're now connected to your AWS server!

---

## Phase 3: Install MySQL Database

Run these commands on your EC2 server:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install MySQL Server
sudo apt install -y mysql-server

# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Step 3.1: Secure MySQL
```bash
# Run security script
sudo mysql_secure_installation
```

Answer the prompts:
1. **VALIDATE PASSWORD COMPONENT?** → `n` (No)
2. **Remove anonymous users?** → `y` (Yes)
3. **Disallow root login remotely?** → `y` (Yes)
4. **Remove test database?** → `y` (Yes)
5. **Reload privilege tables?** → `y` (Yes)

**Note:** MySQL 8.0+ uses `auth_socket` authentication by default for root, so you won't be prompted to set a root password. This is more secure for local access as it authenticates based on your system user.

### Step 3.2: Create Database and User
```bash
# Login to MySQL (no password needed with auth_socket)
sudo mysql
```

Now run these SQL commands (copy-paste all at once):

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS item_tracker;

-- Create application user (change password!)
CREATE USER 'itemtracker'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';

-- Grant all privileges
GRANT ALL PRIVILEGES ON item_tracker.* TO 'itemtracker'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show databases to verify
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

**Optional:** If you prefer to use root with password authentication:
```sql
-- Login first with: sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_root_password';
FLUSH PRIVILEGES;
EXIT;
```

You should see `item_tracker` in the database list.

✅ Database is ready!

---

## Phase 4: Install Node.js and Dependencies

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install PM2 (keeps your app running)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Configure PM2 to start on boot
```bash
pm2 startup
# Copy and run the command it outputs (starts with sudo)
```

✅ All tools installed!

---

## Phase 5: Clone and Configure Backend

### Step 5.1: Clone Repository
```bash
# Go to home directory
cd ~

# Clone your repository (replace with your GitHub URL)
git clone https://github.com/YOUR-USERNAME/Item_Tracker.git
cd Item_Tracker

# Checkout development branch
git checkout development
```

### Step 5.2: Set Up Backend Environment
```bash
cd backend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Paste this configuration** (update the values):

```env
# Server
NODE_ENV=production
PORT=5000

# Database (localhost since MySQL is on same server)
DB_HOST=localhost
DB_PORT=3306
DB_USER=itemtracker
DB_PASSWORD=YourStrongPassword123!
DB_NAME=item_tracker

# JWT Secret (generate random string - change this!)
JWT_SECRET=put-your-super-secret-random-string-here-min-32-chars

# AWS S3 (we'll set this up later - leave empty for now)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 5.3: Create Database Tables
```bash
# Copy .env.production to .env so scripts can read it
cp .env.production .env

# Run migration scripts in order (users must be first due to foreign keys)
node create-users-table.js
node create-items-table.js
node create-history-tables.js
```

You should see success messages for each.

### Step 5.4: Build and Start Backend
```bash
# Build TypeScript to JavaScript
npm run build

# Start backend with PM2
pm2 start dist/server.js --name item-tracker-api

# Save PM2 configuration
pm2 save

# Check if it's running
pm2 list
```

You should see `item-tracker-api` with status `online`.

### Step 5.5: Test Backend
```bash
# Test the API
curl http://localhost:5000/health
```

Should return: `{"status":"ok"}`

✅ Backend is running!

---

## Phase 6: Build and Deploy Frontend

### Step 6.1: Configure Frontend
```bash
cd ~/Item_Tracker/frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Paste** (replace with YOUR EC2 public IP):

```env
VITE_API_URL=http://54.123.45.67/api
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Step 6.2: Build Frontend
```bash
# Build for production
npm run build

# This creates a 'dist' folder with static files
ls dist  # Verify files were created
```

### Step 6.3: Deploy to Nginx
```bash
# Remove default nginx page
sudo rm -rf /var/www/html/*

# Copy your built files
sudo cp -r dist/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html
```

✅ Frontend is deployed!

---

## Phase 7: Configure Nginx

### Step 7.1: Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/item-tracker
```

**Paste this entire configuration** (replace YOUR-PUBLIC-IP):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name YOUR-PUBLIC-IP;  # Replace with your EC2 public IP

    # Frontend - React app
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Proxy to Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Step 7.2: Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/item-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
# Should say: "syntax is ok" and "test is successful"

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
# Should show "active (running)"
```

Press `q` to exit status view.

✅ Nginx is configured!

---

## Phase 8: Test Your Application! 🎉

### Step 8.1: Open in Browser
1. Open your web browser
2. Go to: `http://YOUR-PUBLIC-IP`
   - Replace with your actual EC2 public IP
   - Example: `http://54.123.45.67`

3. You should see your Item Tracker login page!

### Step 8.2: Test Registration
1. Click "Register" or "Sign up"
2. Create a new account
3. Check backend logs: `pm2 logs item-tracker-api`
4. You should see the verification link in the logs (email not configured yet)
5. Copy the verification link and paste in browser
6. Login with your credentials
7. Try adding items!

✅ **Your app is LIVE!**

---

## Phase 9: Set Up S3 for Image Upload (Optional)

### Step 9.1: Create S3 Bucket
1. AWS Console → **S3**
2. Click **Create bucket**
3. Bucket name: `item-tracker-images-YOURNAME` (must be globally unique)
4. Region: **Same as your EC2** (e.g., us-east-1)
5. **Uncheck** "Block all public access"
6. Check the warning acknowledgment
7. Enable **Bucket Versioning**
8. Click **Create bucket**

### Step 9.2: Configure CORS
1. Click your bucket → **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

5. Click **Save changes**

### Step 9.3: Create IAM User for S3
1. AWS Console → **IAM** → **Users**
2. Click **Create user**
3. User name: `item-tracker-s3`
4. Click **Next**
5. **Attach policies directly**
6. Search and select: **AmazonS3FullAccess**
7. Click **Next** → **Create user**
8. Click on the user → **Security credentials** tab
9. **Create access key**
10. Use case: **Application running on AWS compute service**
11. Click **Next** → **Create access key**
12. **📝 COPY BOTH:**
    - Access key ID
    - Secret access key
    - (You can't see the secret again!)

### Step 9.4: Update Backend Configuration
```bash
# On your EC2 server
cd ~/Item_Tracker/backend
nano .env.production
```

Update these lines:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE
S3_BUCKET_NAME=item-tracker-images-YOURNAME
```

Save and restart backend:
```bash
pm2 restart item-tracker-api
```

✅ Image upload is ready!

---

## Phase 10: Maintenance Commands

### Check Backend Status
```bash
# View all PM2 processes
pm2 list

# View backend logs (Ctrl+C to exit)
pm2 logs item-tracker-api

# Restart backend
pm2 restart item-tracker-api

# Stop backend
pm2 stop item-tracker-api

# Monitor CPU/Memory
pm2 monit
```

### Update Application
```bash
cd ~/Item_Tracker

# Pull latest code
git pull origin development

# Update backend
cd backend
npm install
npm run build
pm2 restart item-tracker-api

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload (apply config changes)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
# Create backup
sudo mysqldump -u itemtracker -p item_tracker > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u itemtracker -p item_tracker < backup_20241007.sql
```

---

## Troubleshooting

### Can't connect to EC2
- Check security group allows your IP on port 22
- Verify instance is running
- Check you're using correct key file
- Try: `ssh -v -i key.pem ubuntu@IP` for verbose output

### Backend not starting
```bash
# Check PM2 logs
pm2 logs item-tracker-api --lines 50

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart
pm2 restart item-tracker-api
```

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify API URL in `.env.production` matches your public IP
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Database connection errors
```bash
# Test MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u itemtracker -p item_tracker

# Check credentials in .env.production
cat backend/.env.production
```

### API calls failing (404 or CORS)
- Verify Nginx is running: `sudo systemctl status nginx`
- Check Nginx config: `sudo nginx -t`
- Verify backend is running: `pm2 list`
- Check backend logs: `pm2 logs`

---

## Optional: Add SSL/HTTPS (Free with Let's Encrypt)

### Prerequisites
- You need a **domain name** pointed to your EC2 IP
- Example: `itemtracker.com` → `54.123.45.67`

### Steps
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes
```

Update frontend `.env.production`:
```bash
cd ~/Item_Tracker/frontend
nano .env.production
```

Change to:
```env
VITE_API_URL=https://yourdomain.com/api
```

Rebuild and deploy:
```bash
npm run build
sudo cp -r dist/* /var/www/html/
```

Certificate auto-renews. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## Security Best Practices

✅ **Already done:**
- SSH restricted to your IP
- MySQL only accessible locally
- PM2 keeps app running
- Nginx serves as reverse proxy

🔒 **Additional recommendations:**
1. **Change default SSH port** (from 22 to something else)
2. **Set up automated backups** (database snapshots)
3. **Enable CloudWatch monitoring** (AWS service)
4. **Use environment variables** (never commit .env files!)
5. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
6. **Monitor PM2 logs regularly**
7. **Set up email notifications** (AWS SES) for important events

---

## Cost Management

### Free Tier Limits (12 months)
- ✅ EC2: 750 hours/month of t2.micro (enough for 24/7)
- ✅ EBS: 30 GB storage
- ✅ S3: 5 GB storage, 20,000 GET requests
- ✅ Data transfer: 100 GB/month outbound

### After Free Tier
- EC2 t2.micro: ~$8-10/month (if running 24/7)
- EBS storage: ~$3/month (30 GB)
- S3: ~$0.50-2/month
- **Total: ~$11-15/month**

### Save Money
- **Stop instance when not using:** EC2 → Instances → Stop
- **Restart when needed:** EC2 → Instances → Start
- Free tier hours only count when running
- Storage costs continue even when stopped (but minimal)

---

## What's Next?

1. ✅ Set up email verification (AWS SES)
2. ✅ Add domain name and SSL
3. ✅ Set up automated backups
4. ✅ Configure CloudWatch monitoring
5. ✅ Set up CI/CD (auto-deploy on git push)

---

## Summary

**You now have:**
- ✅ Full-stack app running on AWS
- ✅ MySQL database with your data
- ✅ Professional deployment with Nginx
- ✅ Process management with PM2
- ✅ Image upload ready (if S3 configured)
- ✅ Scalable architecture
- ✅ 100% FREE for first 12 months!

**Your app is accessible at:** `http://YOUR-PUBLIC-IP`

**Congratulations! You've successfully deployed to AWS! 🎉**

---

Need help? Check the troubleshooting section or review the commands in the Maintenance section.
