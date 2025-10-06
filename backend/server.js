const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');
const toolsRoutes = require('./routes/tools');
const analyticsRoutes = require('./routes/analytics');
const businessAnalyticsRoutes = require('./routes/businessAnalytics');
const filesRoutes = require('./routes/files');
const authRoutes = require('./routes/auth');
const executionRoutes = require('./routes/execution');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { DashboardWebSocketServer, DatabaseChangeListener } = require('./services/websocketServer');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:8080',
  'http://localhost:8081'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

connectDB().then(() => {
  console.log('✅ Database connected successfully');
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', authenticateToken, toolsRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/business-analytics', authenticateToken, businessAnalyticsRoutes);
app.use('/api/files', authenticateToken, filesRoutes);
app.use('/api/execution', authenticateToken, executionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Crafta Suite Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tools: '/api/tools',
      analytics: '/api/analytics',
      files: '/api/files',
      execution: '/api/execution'
    },
    documentation: 'https://github.com/crafta-suite/backend-api'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/api', '/health']
  });
});

// Error handling middleware
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
🚀 Crafta Suite Backend Server Started!
📍 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
📚 API Docs: http://localhost:${PORT}/api
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔒 CORS Origins: ${allowedOrigins.join(', ')}
  `);
});

// Initialize WebSocket server for real-time updates
const wsServer = new DashboardWebSocketServer(8080);
wsServer.start();

// Initialize database change listener
const dbListener = new DatabaseChangeListener(wsServer);
dbListener.startListening();

// Make WebSocket server available to routes
app.locals.wsServer = wsServer;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
