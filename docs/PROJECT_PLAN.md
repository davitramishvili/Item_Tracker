# Item Tracker - Development Plan

## Project Overview
A web-based inventory tracking system that allows users to manage stock levels, track price information, view historical data, and monitor total inventory value across multiple items.

**Target Deployment:** AWS Server
**Tech Stack:** TypeScript (Frontend & Backend), Node.js, MySQL, AWS S3

---

## System Requirements

### User Authentication & Management
- User registration with email and password
- Email verification required before login
- Password requirements: minimum 8 characters
- Login options: email/username + password OR Google OAuth
- "Remember me" functionality
- Password reset/forgot password feature
- User profile page with:
  - Display: name, email
  - Edit capabilities: change email, change password
  - Account deletion option

### Item Management
**Item Properties:**
- Item name (required)
- Current quantity (required)
- Price per unit (required)
- Currency (GEL or USD - selected per item)
- Category/tags (optional)
- Description (optional)
- Images (multiple pictures per item)
- Calculated field: Total price (Quantity × Price per unit)

**Item Operations:**
- Add new items (one by one)
- Edit item details (all fields)
- Update quantity with quick +/- buttons or manual input
- Delete items
- Item names are NOT unique (same name can exist multiple times)

### History Tracking
- Track all quantity changes with timestamps
- Display as a simple log/list with dates
- Retain history for 1 year
- Show historical quantity for any past date (e.g., "quantity a week ago")

### Main Dashboard Features
- Display items as cards (grid layout)
- Show 10 items per page with pagination
- Search functionality across item names
- Sorting options:
  - By name (A-Z, Z-A)
  - By category
  - By quantity (high-low, low-high)
  - By price (high-low, low-high)
  - By date added (newest-oldest, oldest-newest)
- Display individual item totals (quantity × price)
- Display grand total (sum of all item totals across all items)
- Support multiple currencies (GEL and USD) displayed appropriately

---

## Technical Architecture

### Frontend
**Technology:** React with TypeScript
**Styling:** Tailwind CSS or Material-UI (TBD)
**State Management:** React Context API or Redux (TBD based on complexity)
**Routing:** React Router
**HTTP Client:** Axios

**Key Pages:**
1. Landing/Login Page
2. Registration Page
3. Email Verification Page
4. Forgot Password Page
5. Dashboard (Main Items View)
6. Item Details/Edit Page
7. Add New Item Page
8. User Profile Page
9. Item History View Page

### Backend
**Technology:** Node.js with Express.js (TypeScript)
**Architecture:** RESTful API
**Authentication:** JWT (JSON Web Tokens) + OAuth 2.0 (Google)
**Email Service:** AWS SES (Simple Email Service)
**File Upload:** Multer with AWS S3 storage

**API Structure:**
```
/api/auth
  - POST /register
  - POST /login
  - POST /logout
  - POST /verify-email
  - POST /forgot-password
  - POST /reset-password
  - POST /google-login

/api/users
  - GET /profile
  - PUT /profile
  - PUT /change-email
  - PUT /change-password
  - DELETE /account

/api/items
  - GET / (with pagination, search, filter, sort)
  - GET /:id
  - POST /
  - PUT /:id
  - DELETE /:id
  - POST /:id/images
  - DELETE /:id/images/:imageId

/api/history
  - GET /item/:id (get history for specific item)
  - POST / (create history entry - automated on quantity change)

/api/totals
  - GET / (calculate grand total across all items)
```

### Database
**Technology:** MySQL (AWS RDS)

**Database Schema:**

**Users Table:**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for Google OAuth users
  full_name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_google_id (google_id)
);
```

**Items Table:**
```sql
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  currency ENUM('GEL', 'USD') NOT NULL,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name),
  INDEX idx_category (category)
);
```

**Item_Images Table:**
```sql
CREATE TABLE item_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_id (item_id)
);
```

**Item_History Table:**
```sql
CREATE TABLE item_history (
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
);
```

### AWS Infrastructure
- **EC2:** Host Node.js backend application
- **RDS (MySQL):** Database hosting
- **S3:** Store item images
- **SES:** Send verification and password reset emails
- **Route 53:** DNS management (optional)
- **CloudFront:** CDN for static assets (optional, for optimization)

---

## Development Phases

### Phase 1: Project Setup & Infrastructure (Week 1)
**Goal:** Set up development environment and project structure

1. **Initialize Project Structure**
   - Create monorepo structure or separate frontend/backend repos
   - Set up TypeScript configuration for both frontend and backend
   - Configure ESLint and Prettier
   - Set up Git workflow (feature branches, commit conventions)

2. **Backend Setup**
   - Initialize Node.js project with Express.js
   - Set up TypeScript compilation
   - Configure environment variables (.env)
   - Set up project folder structure:
     ```
     backend/
     ├── src/
     │   ├── config/        # DB, AWS, OAuth configs
     │   ├── controllers/   # Route handlers
     │   ├── middlewares/   # Auth, validation, error handling
     │   ├── models/        # Database models
     │   ├── routes/        # API routes
     │   ├── services/      # Business logic
     │   ├── utils/         # Helper functions
     │   └── server.ts      # Entry point
     ├── tests/
     └── package.json
     ```
   - Install dependencies:
     - express, cors, helmet, morgan
     - mysql2, bcrypt, jsonwebtoken
     - multer, aws-sdk
     - passport, passport-google-oauth20
     - nodemailer (or AWS SES SDK)
     - joi (validation)
     - dotenv

3. **Frontend Setup**
   - Initialize React project with TypeScript (Vite or Create React App)
   - Set up routing with React Router
   - Configure Tailwind CSS or Material-UI
   - Set up project folder structure:
     ```
     frontend/
     ├── src/
     │   ├── components/    # Reusable components
     │   ├── pages/         # Page components
     │   ├── services/      # API calls
     │   ├── hooks/         # Custom hooks
     │   ├── context/       # Context providers
     │   ├── types/         # TypeScript types/interfaces
     │   ├── utils/         # Helper functions
     │   └── App.tsx
     ├── public/
     └── package.json
     ```
   - Install dependencies:
     - react-router-dom
     - axios
     - tailwindcss or @mui/material
     - react-hook-form
     - react-query (optional, for data fetching)

4. **Database Setup**
   - Create MySQL database locally for development
   - Write migration scripts for all tables
   - Set up database connection pooling
   - Create seed data for testing

5. **AWS Setup (Development Environment)**
   - Create AWS account / Use existing
   - Set up S3 bucket for image storage
   - Configure IAM roles and permissions
   - Set up SES for email sending (sandbox mode initially)

**Deliverables:**
- ✅ Project repositories initialized with proper structure
- ✅ Development environment configured
- ✅ Database schema created and tested
- ✅ AWS services configured for development

---

### Phase 2: Authentication System (Week 2-3)
**Goal:** Implement complete user authentication and authorization

1. **Backend - User Model & Auth Service**
   - Create User model with MySQL queries
   - Implement password hashing with bcrypt
   - Create JWT token generation and verification utilities
   - Implement email verification token generation
   - Implement password reset token generation

2. **Backend - Auth Routes & Controllers**
   - POST /api/auth/register
     - Validate input (email format, password strength)
     - Check if user already exists
     - Hash password
     - Create user in database
     - Generate verification token
     - Send verification email
     - Return success message

   - POST /api/auth/verify-email
     - Validate token
     - Update user email_verified status
     - Return success message

   - POST /api/auth/login
     - Validate credentials
     - Check email verification status
     - Generate JWT token
     - Set HTTP-only cookie (if "remember me")
     - Return token and user data

   - POST /api/auth/logout
     - Clear cookies/tokens
     - Return success message

   - POST /api/auth/forgot-password
     - Validate email exists
     - Generate reset token
     - Send reset email
     - Return success message

   - POST /api/auth/reset-password
     - Validate reset token
     - Check token expiration
     - Hash new password
     - Update user password
     - Return success message

3. **Backend - Google OAuth Integration**
   - Configure Passport.js with Google Strategy
   - POST /api/auth/google-login
     - Handle Google OAuth callback
     - Create or find user by google_id
     - Generate JWT token
     - Return token and user data

4. **Backend - Auth Middleware**
   - Create authentication middleware (verify JWT)
   - Create authorization middleware (check user permissions)
   - Implement rate limiting for auth endpoints

5. **Frontend - Auth Pages**
   - Create Registration Page
     - Form with email, username, full name, password fields
     - Client-side validation
     - Display success message with email verification prompt

   - Create Login Page
     - Form with email/username and password
     - "Remember me" checkbox
     - "Forgot password?" link
     - "Login with Google" button
     - Redirect to dashboard on success

   - Create Email Verification Page
     - Display verification status
     - Resend verification email option

   - Create Forgot Password Page
     - Email input form
     - Display success message

   - Create Reset Password Page
     - New password form
     - Validate token on page load
     - Display success and redirect to login

6. **Frontend - Auth Service & Context**
   - Create axios interceptors for token injection
   - Implement auth context/state management
   - Create protected route wrapper
   - Handle token refresh logic
   - Implement auto-logout on token expiration

7. **Email Templates**
   - Design HTML email template for verification
   - Design HTML email template for password reset
   - Implement email sending service with AWS SES

**Deliverables:**
- ✅ Complete authentication system (email/password + Google OAuth)
- ✅ Email verification working
- ✅ Password reset flow functional
- ✅ Protected routes implemented
- ✅ User sessions managed with JWT

---

### Phase 3: User Profile Management (Week 3)
**Goal:** Allow users to view and edit their profile information

1. **Backend - User Routes & Controllers**
   - GET /api/users/profile
     - Return authenticated user's data (exclude password)

   - PUT /api/users/change-email
     - Validate new email
     - Check if email already exists
     - Generate new verification token
     - Update email (set email_verified to false)
     - Send verification email to new address

   - PUT /api/users/change-password
     - Verify current password
     - Validate new password
     - Hash and update password

   - DELETE /api/users/account
     - Verify password
     - Delete user and all associated data (cascade)
     - Return success message

2. **Frontend - User Profile Page**
   - Display user information (name, email, username)
   - Change email form with confirmation
   - Change password form (current + new password)
   - Delete account button with confirmation dialog
   - Success/error notifications

**Deliverables:**
- ✅ User profile viewing and editing functional
- ✅ Email change with re-verification working
- ✅ Password change working
- ✅ Account deletion working with data cleanup

---

### Phase 4: Item Management - Core CRUD (Week 4-5)
**Goal:** Implement full item creation, reading, updating, and deletion

1. **Backend - Item Model**
   - Create Item model with MySQL queries
   - Implement CRUD operations
   - Add user_id validation

2. **Backend - Item Routes & Controllers**
   - GET /api/items
     - Filter by user_id
     - Implement pagination (limit, offset)
     - Implement search (by name)
     - Implement sorting (name, category, quantity, price, date)
     - Return items with total count for pagination

   - GET /api/items/:id
     - Validate item belongs to authenticated user
     - Return item with images

   - POST /api/items
     - Validate input
     - Create item in database
     - Create initial history entry (quantity 0 → initial quantity)
     - Return created item

   - PUT /api/items/:id
     - Validate item belongs to authenticated user
     - Validate input
     - If quantity changed, create history entry
     - Update item in database
     - Return updated item

   - DELETE /api/items/:id
     - Validate item belongs to authenticated user
     - Delete item (cascade deletes images and history)
     - Return success message

3. **Backend - Image Upload**
   - Configure Multer for file uploads
   - Implement S3 upload utility
   - POST /api/items/:id/images
     - Validate item belongs to user
     - Validate file type (images only)
     - Upload to S3
     - Save image record in database
     - Return image data

   - DELETE /api/items/:id/images/:imageId
     - Validate item belongs to user
     - Delete from S3
     - Delete database record
     - Return success message

4. **Frontend - Dashboard/Main Page**
   - Create item card component
     - Display item name, quantity, price, currency
     - Display first image thumbnail
     - Display category tag
     - Show calculated total (quantity × price)
     - Quick +/- buttons for quantity
     - Edit and Delete buttons

   - Implement grid layout (responsive)
   - Add search bar
   - Add sorting dropdown
   - Add pagination controls
   - Display grand total at top/bottom
   - Loading states and error handling

5. **Frontend - Add Item Page**
   - Form with all item fields
   - Image upload with preview (multiple files)
   - Currency selector (GEL/USD)
   - Category input (text or dropdown if predefined)
   - Form validation
   - Submit and redirect to dashboard

6. **Frontend - Edit Item Page**
   - Pre-populate form with existing data
   - Display current images with delete option
   - Allow adding more images
   - Special handling for quantity changes:
     - Show current quantity
     - Provide +/- buttons or direct input
     - Highlight when quantity changes
   - Update and redirect to dashboard

7. **Frontend - Item Details Modal/Page**
   - Display all item information
   - Image gallery/carousel
   - Edit and Delete buttons
   - Link to view history

**Deliverables:**
- ✅ Full CRUD operations for items
- ✅ Image upload and storage working
- ✅ Dashboard displaying items with pagination
- ✅ Search and sorting functional
- ✅ Grand total calculation accurate
- ✅ Quick quantity adjustment working

---

### Phase 5: History Tracking System (Week 5-6)
**Goal:** Track and display all quantity changes over time

1. **Backend - History Model**
   - Create ItemHistory model with MySQL queries
   - Implement automatic history creation on quantity change

2. **Backend - History Routes & Controllers**
   - GET /api/history/item/:id
     - Validate item belongs to authenticated user
     - Return all history entries for item
     - Order by changed_at DESC
     - Support date range filtering

   - POST /api/history (internal use)
     - Create history entry when quantity changes
     - Calculate change_amount (positive or negative)

3. **Backend - Modify Item Update Logic**
   - When PUT /api/items/:id changes quantity:
     - Get current quantity (quantity_before)
     - Calculate change_amount
     - Create history entry
     - Update item quantity

4. **Backend - History Cleanup Job**
   - Create scheduled job (cron) to delete history older than 1 year
   - Run daily at midnight

5. **Frontend - Item History Page/Modal**
   - Display history entries in a timeline/list format
   - Show: date/time, quantity before, quantity after, change (+/-)
   - Filter by date range
   - Visual indicators (green for increase, red for decrease)
   - Link back to item details

6. **Frontend - Historical Data Query**
   - Add "View quantity on date" feature
   - Date picker to select past date
   - Calculate quantity on that date from history
   - Display result

**Deliverables:**
- ✅ Automatic history tracking on quantity changes
- ✅ History viewing page functional
- ✅ Date-based quantity lookup working
- ✅ Automatic cleanup of old history (1 year+)

---

### Phase 6: Testing & Bug Fixes (Week 7)
**Goal:** Ensure all features work correctly and fix any issues

1. **Backend Testing**
   - Write unit tests for:
     - Authentication services
     - Item CRUD operations
     - History tracking logic
     - Validation functions
   - Write integration tests for:
     - API endpoints
     - Database operations
   - Test edge cases:
     - Invalid tokens
     - Unauthorized access attempts
     - Duplicate items
     - Concurrent quantity updates
     - Image upload limits

2. **Frontend Testing**
   - Test user flows:
     - Registration → verification → login
     - Password reset
     - Item creation with images
     - Quantity updates
     - Search and filtering
     - Pagination
   - Test responsive design (mobile, tablet, desktop)
   - Test cross-browser compatibility
   - Test error handling and loading states

3. **Security Testing**
   - Test authentication bypass attempts
   - Test SQL injection prevention
   - Test XSS prevention
   - Test CSRF protection
   - Test file upload security
   - Test rate limiting

4. **Performance Testing**
   - Test with large datasets (1000+ items)
   - Test pagination performance
   - Test image loading optimization
   - Test database query performance
   - Optimize slow queries with indexes

5. **Bug Fixes**
   - Document all found issues
   - Prioritize critical bugs
   - Fix and re-test

**Deliverables:**
- ✅ Test suite with good coverage
- ✅ All critical bugs fixed
- ✅ Performance optimized
- ✅ Security vulnerabilities addressed

---

### Phase 7: AWS Deployment (Week 8)
**Goal:** Deploy application to AWS production environment

1. **Production AWS Setup**
   - Create production RDS MySQL instance
   - Configure production S3 bucket
   - Set up production SES (move out of sandbox)
   - Create EC2 instance for backend
   - Configure security groups and VPC
   - Set up SSL certificate (AWS ACM)

2. **Backend Deployment**
   - Build TypeScript to JavaScript
   - Set up PM2 or similar process manager
   - Configure nginx as reverse proxy
   - Set environment variables for production
   - Deploy to EC2
   - Set up monitoring and logging
   - Configure automatic restarts on failure

3. **Database Migration**
   - Run migration scripts on production RDS
   - Set up automated backups
   - Configure connection pooling

4. **Frontend Deployment**
   - Build React app for production
   - Options:
     - Host on S3 + CloudFront (static hosting)
     - Host on same EC2 with nginx
   - Configure environment variables (API URL)
   - Set up CDN if using CloudFront

5. **DNS Configuration**
   - Point domain to EC2/CloudFront (if using Route 53)
   - Configure SSL/HTTPS

6. **Post-Deployment Testing**
   - Test all features in production
   - Test email delivery
   - Test image uploads to production S3
   - Test database connectivity
   - Monitor for errors

7. **Monitoring & Maintenance**
   - Set up CloudWatch for logs and metrics
   - Configure alerts for errors/downtime
   - Set up automated backups
   - Document deployment process

**Deliverables:**
- ✅ Application live on AWS
- ✅ HTTPS enabled
- ✅ All features working in production
- ✅ Monitoring and backups configured
- ✅ Deployment documentation complete

---

## Additional Considerations

### Security Best Practices
- Store all sensitive data (passwords, tokens) encrypted
- Use HTTPS only in production
- Implement rate limiting on all endpoints
- Sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Set secure HTTP headers (helmet.js)
- Implement CORS properly
- Store JWT in HTTP-only cookies
- Set short token expiration times with refresh logic
- Never expose sensitive data in error messages

### Performance Optimization
- Implement caching (Redis) if needed
- Optimize images before upload (compress, resize)
- Use lazy loading for images
- Implement database indexing on frequently queried fields
- Use connection pooling for database
- Minimize API payload sizes
- Implement client-side caching

### Future Enhancements (Post-MVP)
- Track reasons for quantity changes
- Low stock alerts/notifications
- Export data to CSV/Excel
- Bulk import items from CSV
- Item categories management (predefined list)
- Multiple warehouses/locations
- Barcode scanning support
- Mobile app (React Native)
- Multi-currency conversion rates
- Analytics dashboard (charts, trends)
- Collaboration features (team accounts)

---

## Technology Stack Summary

**Frontend:**
- React 18+ with TypeScript
- React Router v6
- Axios
- Tailwind CSS / Material-UI
- React Hook Form
- Date-fns or Day.js (date formatting)

**Backend:**
- Node.js 18+ with TypeScript
- Express.js
- MySQL with mysql2
- JWT (jsonwebtoken)
- Bcrypt
- Passport.js (Google OAuth)
- Multer + AWS SDK (S3)
- AWS SES SDK (email)
- Joi (validation)

**Database:**
- MySQL 8.0

**Infrastructure:**
- AWS EC2 (compute)
- AWS RDS (MySQL database)
- AWS S3 (image storage)
- AWS SES (email service)
- AWS CloudWatch (monitoring)
- Nginx (reverse proxy)
- PM2 (process manager)

**Development Tools:**
- Git & GitHub
- ESLint + Prettier
- TypeScript
- Postman (API testing)
- Jest (testing)

---

## Project Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | Week 1 | Project setup & infrastructure |
| Phase 2 | Week 2-3 | Authentication system |
| Phase 3 | Week 3 | User profile management |
| Phase 4 | Week 4-5 | Item management CRUD |
| Phase 5 | Week 5-6 | History tracking |
| Phase 6 | Week 7 | Testing & bug fixes |
| Phase 7 | Week 8 | AWS deployment |

**Total Estimated Time:** 8 weeks

---

## Success Criteria

The project will be considered complete when:
- ✅ Users can register, verify email, and login (email/password + Google)
- ✅ Users can manage their profile and delete account
- ✅ Users can add items with all required information and images
- ✅ Users can edit item quantities using +/- buttons or direct input
- ✅ Users can view items in a paginated, searchable, sortable grid
- ✅ Users can see individual item totals and grand total
- ✅ Users can view 1 year of quantity change history
- ✅ Application is deployed on AWS and accessible via HTTPS
- ✅ All core features tested and working
- ✅ Security best practices implemented

---

## Next Steps

1. Review this plan and provide feedback/changes
2. Set up development environment
3. Begin Phase 1: Project Setup & Infrastructure
4. Regular check-ins at end of each phase
5. Adjust timeline as needed based on progress

---

**Document Version:** 1.0
**Last Updated:** October 6, 2025
**Project Start Date:** TBD
**Target Completion Date:** TBD
