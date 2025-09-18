/**
 * Basic Express Server Template
 * VERSATIL SDLC Framework - Marcus-Backend Template
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Marcus-Backend Security & Middleware Setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agent: 'Marcus-Backend',
    framework: 'VERSATIL SDLC'
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'VERSATIL SDLC Framework API',
    version: '1.0.0',
    agents: {
      'maria-qa': 'Quality Assurance Lead',
      'james-frontend': 'Frontend Specialist',
      'marcus-backend': 'Backend Expert',
      'sarah-pm': 'Project Manager',
      'alex-ba': 'Business Analyst',
      'dr-ai-ml': 'AI/ML Specialist'
    }
  });
});

// Sample CRUD endpoints for demonstration
app.get('/api/items', (req, res) => {
  // Marcus-Backend: Simulated database query
  const items = [
    { id: 1, name: 'Sample Item 1', status: 'active' },
    { id: 2, name: 'Sample Item 2', status: 'inactive' },
    { id: 3, name: 'Sample Item 3', status: 'active' }
  ];

  res.json({
    success: true,
    data: items,
    total: items.length
  });
});

app.post('/api/items', (req, res) => {
  const { name, status = 'active' } = req.body;

  // Marcus-Backend: Input validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Name is required'
    });
  }

  // Simulated item creation
  const newItem = {
    id: Date.now(),
    name: name.trim(),
    status,
    created_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: newItem,
    message: 'Item created successfully'
  });
});

app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  // Marcus-Backend: Parameter validation
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid item ID'
    });
  }

  // Simulated item update
  const updatedItem = {
    id: parseInt(id),
    name: name || 'Updated Item',
    status: status || 'active',
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: updatedItem,
    message: 'Item updated successfully'
  });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid item ID'
    });
  }

  res.json({
    success: true,
    message: `Item ${id} deleted successfully`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Marcus-Backend: Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 Marcus-Backend: Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API status: http://localhost:${PORT}/api/status`);
  console.log('🤖 VERSATIL SDLC Framework - Backend Agent Active');
});

process.on('SIGTERM', () => {
  console.log('🛑 Marcus-Backend: Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Marcus-Backend: Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Marcus-Backend: Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Marcus-Backend: Server closed');
    process.exit(0);
  });
});

module.exports = app;