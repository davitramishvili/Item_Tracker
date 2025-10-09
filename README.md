# Item Tracker

A full-stack web-based inventory tracking system with sales management that allows users to manage stock levels, track price information, create sales (single and multi-item), view historical snapshots, and monitor total inventory value.

## Project Structure

```
├── backend/          # Node.js + Express + TypeScript backend
├── frontend/         # React + TypeScript + Vite frontend
└── docs/            # Documentation (see Deployment section below)
```

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- MySQL
- JWT Authentication
- Google OAuth 2.0
- AWS S3 (image storage)
- AWS SES (email service)

### Frontend
- React 18+ with TypeScript
- Vite
- React Router v6
- Axios
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0 installed and running
- AWS account (for S3 and SES)
- Google OAuth credentials

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - Database credentials
   - JWT secret
   - Google OAuth credentials
   - AWS credentials

5. Run database migrations:
```bash
npm run migrate
```

6. Start development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - API URL (backend URL)
   - Google Client ID

5. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` (or the port Vite assigns)

## Current Status

### ✅ Completed Features
- **Authentication System**
  - User registration with email verification
  - Login system (email/password)
  - Google OAuth 2.0 integration
  - Password reset functionality
  - JWT-based authentication

- **Item Management**
  - Add, edit, delete items
  - Quantity tracking with +/- buttons
  - Multi-currency support (GEL and USD)
  - Image upload for items (AWS S3)
  - Price calculations (per item and total)
  - Search, filtering, and sorting
  - Pagination

- **Sales Management**
  - Single-item sales
  - Multi-item sales (multiple items in one transaction)
  - Buyer information tracking
  - Sale history with grouped display
  - Edit, return, and delete individual sales
  - Mixed currency support in multi-item sales

- **Historical Tracking**
  - Daily automated snapshots (1:00 AM Asia/Tbilisi timezone)
  - Item quantity history for 1 year
  - Date-based quantity lookup
  - Automated snapshot cleanup

- **User Profile**
  - Profile viewing and editing
  - Email change with re-verification
  - Password change
  - Account deletion

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run migrate` - Run database migrations

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Setup

The application uses MySQL. Create the database and tables using the migration scripts:

```bash
cd backend
node create-users-table.js
node create-items-table.js
node create-history-tables.js
node create-sales-table.js
node create-sale-groups-table.js
```

If you have existing sales, run the migration:
```bash
node migrate-existing-sales.js
```

## AWS Deployment

The application is designed to run on AWS with the following services:
- **EC2**: Host the backend and frontend
- **RDS/MySQL on EC2**: Database
- **S3**: Image storage
- **SES**: Email service (verification, password reset)

### Deployment Guides
Comprehensive deployment documentation is available:
- **Full AWS Deployment Guide** - Step-by-step instructions for deploying on AWS Free Tier
- **Snapshot Scheduler Deployment** - Guide for deploying the daily snapshot feature
- Both guides are available in the project documentation files

### Key Features for Production
- Automated daily snapshots at 1:00 AM (configurable timezone)
- PM2 process management
- Nginx reverse proxy
- SSL/HTTPS support with Let's Encrypt
- Database backups
- Monitoring with CloudWatch

## Internationalization

The application supports multiple languages:
- English (en)
- Georgian (ka)

Translation files are located in `frontend/src/locales/`

## License

ISC

## Author

Davit Ramishvili
