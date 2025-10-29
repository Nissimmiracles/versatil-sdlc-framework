/**
 * Express API Server for ML Workflow Automation
 * Main entry point for REST API
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { prisma } from '../database/client.js';

// Routes
import workflowRoutes from './routes/workflows.js';
import datasetRoutes from './routes/datasets.js';
import modelRoutes from './routes/models.js';
import trainingRoutes from './routes/training.js';
import predictionRoutes from './routes/predictions.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// ============================================================================
// General Middleware
// ============================================================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Custom request logging
app.use(requestLogger);

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'VERSATIL ML Workflow API',
    version: '1.0.0',
    endpoints: {
      workflows: '/api/workflows',
      datasets: '/api/datasets',
      models: '/api/models',
      training: '/api/training',
      predictions: '/api/predictions',
    },
  });
});

// Protected routes (require authentication)
app.use('/api/workflows', authMiddleware, workflowRoutes);
app.use('/api/datasets', authMiddleware, datasetRoutes);
app.use('/api/models', authMiddleware, modelRoutes);
app.use('/api/training', authMiddleware, trainingRoutes);
app.use('/api/predictions', authMiddleware, predictionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
