# Item Tracker

A web-based inventory tracking system that allows users to manage stock levels, track price information, view historical data, and monitor total inventory value.

## Project Structure

```
├── backend/          # Node.js + Express + TypeScript backend
├── frontend/         # React + TypeScript + Vite frontend
└── PROJECT_PLAN.md   # Detailed development plan
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

## Development Progress

### Phase 1: Project Setup & Infrastructure ✅
- [x] Project structure created
- [x] Backend initialized with Express + TypeScript
- [x] Frontend initialized with React + Vite + TypeScript
- [x] Tailwind CSS configured
- [x] Database schema designed
- [x] ESLint and Prettier configured

### Phase 2: Authentication System (In Progress)
- [ ] User registration
- [ ] Email verification
- [ ] Login system
- [ ] Google OAuth
- [ ] Password reset

### Upcoming Phases
- Phase 3: User Profile Management
- Phase 4: Item Management
- Phase 5: History Tracking
- Phase 6: Testing & Bug Fixes
- Phase 7: AWS Deployment

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

## Features

- User authentication (email/password + Google OAuth)
- Email verification
- Item management (add, edit, delete)
- Quantity tracking with +/- buttons
- Multi-currency support (GEL and USD)
- Image upload for items
- Price calculations (per item and total)
- Historical quantity tracking (1 year)
- Search and filtering
- Pagination

## License

ISC

## Author

Davit Ramishvili
