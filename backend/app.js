const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { toolSecurityMiddleware } = require('./middleware/toolSecurity');
const toolExecutionRouter = require('./routes/toolExecution');
const ToolOrchestrator = require('./services/toolOrchestrator');
const { DashboardWebSocketServer, DatabaseChangeListener } = require('./services/websocketServer');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Tool Orchestrator
const orchestrator = new ToolOrchestrator();

// Initialize WebSocket Server
const wsServer = new DashboardWebSocketServer(8080);
const dbListener = new DatabaseChangeListener(wsServer);

// Global middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security middleware
app.use(toolSecurityMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  const metrics = orchestrator.getSystemMetrics();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics
  });
});

// API routes
app.use('/api/tools', require('./tools/allTools'));
app.use('/api/execution', toolExecutionRouter);

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// SaaS Dashboard API routes
app.use('/api/audit-logs', require('./routes/auditLogs').router);
app.use('/api/analytics', require('./routes/analytics').router);
app.use('/api/clients', require('./routes/clients').router);
app.use('/api/projects', require('./routes/projects').router);
app.use('/api/invoices', require('./routes/invoices').router);
app.use('/api/profile', require('./routes/profile').router);
app.use('/api/settings', require('./routes/settings').router);
app.use('/api/dashboard', require('./routes/dashboard'));

// Advanced orchestrator endpoints
app.get('/api/orchestrator/metrics', (req, res) => {
  const metrics = orchestrator.getSystemMetrics();
  res.json(metrics);
});

app.get('/api/orchestrator/sessions', (req, res) => {
  const sessions = Array.from(orchestrator.activeSessions.keys()).map(sessionId => 
    orchestrator.getSessionStatus(sessionId)
  ).filter(Boolean);
  
  res.json({ sessions });
});

app.post('/api/orchestrator/execute', async (req, res) => {
  try {
    const { toolData, options } = req.body;
    const sessionId = require('crypto').randomUUID();
    
    const result = await orchestrator.executeToolInContainer(sessionId, toolData, options);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orchestrator/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const status = orchestrator.getSessionStatus(sessionId);
  
  if (!status) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(status);
});

app.post('/api/orchestrator/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await orchestrator.stopExecution(sessionId);
    res.json({ message: 'Execution stopped', sessionId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket endpoint info
app.get('/api/websocket/info', (req, res) => {
  res.json({
    websocketUrl: `ws://localhost:8080`,
    protocols: ['dashboard-updates'],
    events: [
      'dashboard_update',
      'project_update',
      'client_update',
      'productivity_update',
      'connection_established'
    ],
    stats: wsServer.getStats()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      maxSize: '50MB'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Too many files',
      maxFiles: 20
    });
  }
  
  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: err.retryAfter
    });
  }
  
  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // Cleanup orchestrator
  await orchestrator.cleanup();
  
  // Stop WebSocket server
  wsServer.stop();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  await orchestrator.cleanup();
  wsServer.stop();
  
  process.exit(0);
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
🚀 Super Powerful Tool Backend Started!

📊 Server Info:
   • Port: ${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • WebSocket: ws://localhost:8080
   
🔒 Security Features:
   • Advanced rate limiting
   • Security scanning
   • Docker isolation
   • Resource monitoring
   
🛠️ Capabilities:
   • Multi-language execution (Node.js, Python, Go)
   • Real-time monitoring
   • AI-powered analysis
   • Container orchestration
   • WebSocket communication
   • Real-time dashboard updates
   
📈 Endpoints:
   • Health: GET /health
   • Tools: /api/tools/*
   • Auth: /api/auth/*
   • Dashboard: /api/dashboard/*
   • Orchestrator: /api/orchestrator/*
   • WebSocket Info: GET /api/websocket/info
  `);

  // Start WebSocket server
  wsServer.start();
  
  // Start database change listener
  await dbListener.startListening();
});

module.exports = { app, orchestrator };
