# AWS Deployment Guide - Item Tracker

This guide walks you through deploying the Item Tracker application on AWS from scratch.

## Prerequisites
- AWS Account
- Your application code ready (backend + frontend)
- Domain name (optional, but recommended)

---

## Phase 1: Set Up RDS MySQL Database

### 1.1 Create RDS Instance
1. Go to **AWS Console** → **RDS**
2. Click **Create database**
3. Choose **Standard create**
4. **Engine options:**
   - Engine type: **MySQL**
   - Version: **MySQL 8.0.x** (latest)
5. **Templates:**
   - Choose: **Free tier** (for testing) or **Production** (for live)
6. **Settings:**
   - DB instance identifier: `item-tracker-db`
   - Master username: `admin`
   - Master password: `[CREATE-STRONG-PASSWORD]` (save this!)
7. **Instance configuration:**
   - Free tier: db.t3.micro (or db.t2.micro)
   - Production: db.t3.small or larger
8. **Storage:**
   - Allocated storage: 20 GB (minimum)
   - Storage autoscaling: Enable (max 100 GB)
9. **Connectivity:**
   - **IMPORTANT:** Public access: **Yes** (we'll secure with security groups)
   - VPC: Default VPC
   - Security group: Create new → `item-tracker-db-sg`
10. **Additional configuration:**
    - Initial database name: `item_tracker`
    - Backup retention: 7 days
    - Enable automated backups
11. Click **Create database**
12. **Wait 5-10 minutes** for database to be created

### 1.2 Configure Database Security Group
1. Go to **RDS** → **Databases** → Click your database
2. In the **Connectivity & security** tab, click the security group
3. Edit **Inbound rules**:
   - Click **Edit inbound rules**
   - Add rule:
     - Type: **MySQL/Aurora**
     - Protocol: TCP
     - Port: 3306
     - Source: **My IP** (for now, we'll update this later with EC2 security group)
   - Click **Save rules**

### 1.3 Note Database Endpoint
1. In RDS console, click your database
2. Copy the **Endpoint** (looks like: `item-tracker-db.xxxxx.us-east-1.rds.amazonaws.com`)
3. **Save this** - you'll need it for backend configuration

---

## Phase 2: Set Up EC2 Instance

### 2.1 Launch EC2 Instance
1. Go to **AWS Console** → **EC2**
2. Click **Launch Instance**
3. **Name:** `item-tracker-server`
4. **Application and OS Images:**
   - **Ubuntu Server 22.04 LTS** (free tier eligible)
5. **Instance type:**
   - Free tier: **t2.micro**
   - Production: **t3.small** or **t3.medium**
6. **Key pair:**
   - Click **Create new key pair**
   - Name: `item-tracker-key`
   - Type: RSA
   - Format: `.pem` (for SSH) or `.ppk` (for PuTTY)
   - Click **Create key pair** and **DOWNLOAD THE FILE** (you can't download it again!)
7. **Network settings:**
   - Click **Edit**
   - VPC: Default VPC
   - Auto-assign public IP: **Enable**
   - Firewall (Security groups): **Create new security group**
   - Security group name: `item-tracker-server-sg`
   - Add these rules:
     - SSH (port 22) - Source: My IP
     - HTTP (port 80) - Source: Anywhere (0.0.0.0/0)
     - HTTPS (port 443) - Source: Anywhere (0.0.0.0/0)
     - Custom TCP (port 5000) - Source: Anywhere (0.0.0.0/0) - for backend API
8. **Configure storage:**
   - 20 GB gp3 (or gp2)
9. Click **Launch instance**
10. **Wait 2-3 minutes** for instance to be running

### 2.2 Connect to EC2 Instance

**Using SSH (Mac/Linux/Windows with WSL):**
```bash
# Move key to safe location
chmod 400 item-tracker-key.pem

# Connect to instance (replace with your instance public IP)
ssh -i item-tracker-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

**Using PuTTY (Windows):**
1. Convert .pem to .ppk using PuTTYgen
2. Use PuTTY to connect with the .ppk key

### 2.3 Update RDS Security Group
Now that we have EC2 instance, update RDS to allow connections from EC2:
1. Go to **EC2** → **Security Groups** → Find `item-tracker-server-sg`
2. Copy the **Security Group ID** (looks like sg-xxxxx)
3. Go to **RDS Security Groups** → `item-tracker-db-sg`
4. Edit inbound rules:
   - Add new rule:
     - Type: MySQL/Aurora
     - Source: **Custom** → Select `item-tracker-server-sg` security group
   - This allows EC2 to connect to RDS

---

## Phase 3: Set Up EC2 Server Environment

### 3.1 Install Node.js and npm
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3.2 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Set PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs
```

### 3.3 Install Nginx (Web Server)
```bash
sudo apt install -y nginx

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify it's running
sudo systemctl status nginx
```

### 3.4 Install Git
```bash
sudo apt install -y git

# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.5 Install MySQL Client (for testing DB connection)
```bash
sudo apt install -y mysql-client
```

---

## Phase 4: Set Up S3 for Image Storage

### 4.1 Create S3 Bucket
1. Go to **AWS Console** → **S3**
2. Click **Create bucket**
3. **Bucket name:** `item-tracker-images-[YOUR-UNIQUE-ID]` (must be globally unique)
4. **Region:** Same as your EC2 instance (e.g., us-east-1)
5. **Block Public Access:** Uncheck all (we need public access for images)
6. **Bucket Versioning:** Enable (recommended)
7. Click **Create bucket**

### 4.2 Configure CORS for S3 Bucket
1. Go to your bucket → **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit** and paste:
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
4. Click **Save changes**

### 4.3 Create IAM User for S3 Access
1. Go to **IAM** → **Users** → **Create user**
2. User name: `item-tracker-s3-user`
3. Click **Next**
4. **Permissions:** Attach policies directly
5. Search and select: **AmazonS3FullAccess**
6. Click **Next** → **Create user**
7. Click on the user → **Security credentials** tab
8. Click **Create access key**
9. Use case: **Application running on AWS compute service**
10. Click **Next** → **Create access key**
11. **IMPORTANT:** Copy **Access Key ID** and **Secret Access Key** (you can't see the secret again!)

---

## Phase 5: Deploy Backend Application

### 5.1 Clone Repository on EC2
```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR-USERNAME/Item_Tracker.git
cd Item_Tracker

# Switch to development branch (or main)
git checkout development
```

### 5.2 Set Up Backend Environment
```bash
cd backend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

Paste this configuration (update with your values):
```env
# Server
NODE_ENV=production
PORT=5000

# Database (replace with your RDS endpoint)
DB_HOST=item-tracker-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YOUR_RDS_PASSWORD
DB_NAME=item_tracker

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# AWS S3 (use the keys from IAM user)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
S3_BUCKET_NAME=item-tracker-images-YOUR-UNIQUE-ID

# Email (we'll set up later)
# For now, verification emails will be logged to console
```

Save: `Ctrl + X`, then `Y`, then `Enter`

### 5.3 Create Database Tables
```bash
# Test database connection
mysql -h item-tracker-db.xxxxx.us-east-1.rds.amazonaws.com -u admin -p

# Enter your RDS password
# If connected successfully, exit:
exit

# Run migration scripts
node create-users-table.js
node create-items-table.js
node create-history-tables.js
```

### 5.4 Build and Start Backend
```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name item-tracker-api

# Save PM2 configuration
pm2 save

# Check logs
pm2 logs item-tracker-api
```

### 5.5 Test Backend API
```bash
# Test from EC2
curl http://localhost:5000/health

# Should return: {"status":"ok"}
```

---

## Phase 6: Deploy Frontend Application

### 6.1 Build Frontend on EC2
```bash
cd ~/Item_Tracker/frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

Paste:
```env
VITE_API_URL=http://YOUR-EC2-PUBLIC-IP:5000/api
```

Save and exit.

```bash
# Build for production
npm run build

# This creates a 'dist' folder with static files
```

### 6.2 Copy Frontend to Nginx Directory
```bash
# Remove default nginx page
sudo rm -rf /var/www/html/*

# Copy built files to nginx directory
sudo cp -r dist/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
```

---

## Phase 7: Configure Nginx

### 7.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/item-tracker
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name YOUR-EC2-PUBLIC-IP;  # Or your domain name

    # Frontend (React app)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }

    # Backend API proxy
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
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit.

### 7.2 Enable Site and Restart Nginx
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/item-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Phase 8: Test Your Application

### 8.1 Access Your Application
1. Open browser and go to: `http://YOUR-EC2-PUBLIC-IP`
2. You should see your Item Tracker login page
3. Try registering a user
4. Check backend logs: `pm2 logs item-tracker-api`

### 8.2 Update Frontend API URL
If everything works but API calls fail, update frontend environment:
```bash
cd ~/Item_Tracker/frontend

# Edit .env.production to use public IP
nano .env.production
```

Change to:
```env
VITE_API_URL=http://YOUR-EC2-PUBLIC-IP/api
```

Rebuild:
```bash
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## Phase 9: Set Up SSL/HTTPS (Optional but Recommended)

### 9.1 Get a Domain Name
- Buy a domain from Route 53, GoDaddy, Namecheap, etc.
- Point A record to your EC2 public IP

### 9.2 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.3 Get SSL Certificate
```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose to redirect HTTP to HTTPS: **Yes**

### 9.4 Update Frontend Environment
```bash
cd ~/Item_Tracker/frontend
nano .env.production
```

Change to HTTPS:
```env
VITE_API_URL=https://yourdomain.com/api
```

Rebuild and deploy:
```bash
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## Phase 10: Maintenance & Monitoring

### 10.1 PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs item-tracker-api

# Restart backend
pm2 restart item-tracker-api

# Stop backend
pm2 stop item-tracker-api

# Monitor CPU/Memory
pm2 monit
```

### 10.2 Update Application
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

### 10.3 Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### 10.4 Database Backups
RDS automatically backs up daily. To create manual snapshot:
1. Go to **RDS** → **Databases**
2. Select your database
3. **Actions** → **Take snapshot**

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs item-tracker-api

# Check if port 5000 is in use
sudo lsof -i :5000

# Test database connection
mysql -h YOUR-RDS-ENDPOINT -u admin -p
```

### Frontend shows blank page
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify files are in correct location
ls -la /var/www/html/

# Check browser console for errors
```

### API calls failing (CORS errors)
- Make sure nginx is properly proxying `/api` to backend
- Check that `VITE_API_URL` is correct in frontend
- Verify backend is running: `pm2 list`

### Database connection errors
- Check RDS security group allows EC2 security group
- Verify database credentials in `.env.production`
- Test connection: `mysql -h YOUR-RDS-ENDPOINT -u admin -p`

---

## Cost Estimation (Monthly)

**Free Tier (First 12 months):**
- EC2 t2.micro: $0 (750 hours/month free)
- RDS db.t2.micro: $0 (750 hours/month free)
- S3: $0 (5GB storage, 20,000 GET requests free)
- **Total: ~$0/month**

**After Free Tier:**
- EC2 t3.small: ~$15/month
- RDS db.t3.micro: ~$15/month
- S3: ~$1-5/month (depending on usage)
- Data transfer: ~$5/month
- **Total: ~$36-40/month**

---

## Security Checklist

- ✅ Use strong passwords for RDS
- ✅ Restrict SSH access to your IP only
- ✅ Enable HTTPS with SSL certificate
- ✅ Use environment variables for secrets (never commit .env files)
- ✅ Keep EC2 instance updated: `sudo apt update && sudo apt upgrade`
- ✅ Enable RDS automated backups
- ✅ Use IAM roles instead of access keys when possible
- ✅ Monitor CloudWatch for unusual activity

---

## Next Steps

1. **Set up email service** (AWS SES) for verification emails
2. **Add monitoring** (CloudWatch, PM2 monitoring)
3. **Set up CI/CD** (GitHub Actions for auto-deployment)
4. **Add rate limiting** to API endpoints
5. **Configure CloudFront** for CDN (faster global access)

---

**Congratulations! Your Item Tracker application is now live on AWS! 🎉**
