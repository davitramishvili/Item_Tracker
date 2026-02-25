# Leri Item Tracker

A personal inventory and sales management app built for tracking stock levels, recording sales, and keeping an eye on profit margins across currencies.

---

## What It Does

- **Inventory management** — Add items with quantities, prices (GEL or USD), and categories. Move items through statuses: Need to Order → On the Way → In Stock.
- **Sales tracking** — Record single or multi-item sales with buyer info. View history by date range. Edit, return, or delete sales.
- **Profit analysis** — The sales dashboard shows revenue, cost, and profit. Costs are calculated from the purchase price recorded at time of sale.
- **Historical snapshots** — Daily automated snapshots capture your inventory state so you can look back at any past date.
- **Multi-language** — UI is available in English and Georgian (ქართული).

---

## Tech Stack

**Backend:** Node.js + Express + TypeScript, MySQL, JWT auth, Google OAuth
**Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, i18next
**Infrastructure:** AWS EC2, S3 (image storage), SES (email)

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0
- (Optional) AWS account for S3/SES features

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DB credentials, JWT_SECRET, etc.
npm run migrate        # sets up the database tables
npm run dev            # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev            # starts on http://localhost:3000
```

Run both in separate terminals and open `http://localhost:3000`.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (usually `localhost`) |
| `DB_PORT` | MySQL port (usually `3306`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `FRONTEND_URL` | URL of the frontend (for CORS) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name for image uploads |
| `EMAIL_FROM` | Sender address for emails (SES) |

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:5000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## Useful Commands

### Backend
```bash
npm run dev          # development server with hot reload
npm run build        # compile TypeScript → JavaScript
npm start            # run compiled production build
npm run migrate      # run database migrations
npm test             # run unit tests
npm run test:coverage  # run tests with coverage report
```

### Frontend
```bash
npm run dev       # development server
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
```

---

## Deployment (AWS)

The app runs on an EC2 instance (Ubuntu 22.04) with:
- Nginx as the reverse proxy / static file server for the frontend
- PM2 to keep the backend process running
- MySQL on the same instance

To deploy after pushing to the `development` branch, SSH in and run:

```bash
cd ~/Item_Tracker/ && git pull origin development \
  && cd backend && npm install && npm run build \
  && cd ../frontend && npm install && npm run build \
  && sudo rm -rf /var/www/html/* && sudo cp -r dist/* /var/www/html/ \
  && sudo systemctl reload nginx \
  && cd ../backend && pm2 restart item-tracker-api \
  && pm2 logs item-tracker-api --lines 30
```

See `docs/DEPLOYMENT_GUIDE.md` for the full setup guide including SSL, domain config, and CloudWatch.

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.ts          # entry point
│   │   ├── config/            # DB connection, migrations, schema
│   │   ├── controllers/       # request handlers
│   │   ├── models/            # DB query logic
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # business logic (auth, email, snapshots)
│   │   ├── middlewares/       # JWT auth middleware
│   │   └── utils/             # JWT helpers, password hashing, validation
│   └── tests/                 # unit tests (Jest + ts-jest)
│
├── frontend/
│   └── src/
│       ├── pages/             # page components (Dashboard, Sales, History, etc.)
│       ├── components/        # shared UI components
│       ├── services/          # API service layer (Axios)
│       ├── context/           # React contexts (Auth, Theme)
│       └── locales/           # i18n translation files (en, ka)
│
├── docs/                      # deployment guides
├── CLAUDE_PROJECT_GUIDE.md    # developer reference (for Claude/AI assistance)
└── PROGRESS_TRACKER.md        # session-to-session task tracking
```

---

## Languages

Switch between English and Georgian using the language button in the top navigation bar. Translation files live in `frontend/src/locales/`.

---

## Author

Davit Ramishvili
