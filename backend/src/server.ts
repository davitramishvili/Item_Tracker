import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import itemRoutes from './routes/itemRoutes';
import historyRoutes from './routes/historyRoutes';
import itemNameRoutes from './routes/itemNameRoutes';
import saleRoutes from './routes/saleRoutes';
import { SnapshotScheduler } from './services/snapshotScheduler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/item-names', itemNameRoutes);
app.use('/api/sales', saleRoutes);
// app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Start the snapshot scheduler
  SnapshotScheduler.start();
});

export default app;
