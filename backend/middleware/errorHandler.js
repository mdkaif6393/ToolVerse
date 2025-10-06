// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Default error
  let error = {
    message: 'Internal server error',
    status: 500,
    code: 'INTERNAL_ERROR'
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      details: err.details || err.message
    };
  } else if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401,
      code: 'INVALID_TOKEN'
    };
  } else if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401,
      code: 'TOKEN_EXPIRED'
    };
  } else if (err.code === '23505') { // PostgreSQL unique violation
    error = {
      message: 'Resource already exists',
      status: 409,
      code: 'DUPLICATE_RESOURCE'
    };
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    error = {
      message: 'Referenced resource not found',
      status: 400,
      code: 'INVALID_REFERENCE'
    };
  } else if (err.code === '23502') { // PostgreSQL not null violation
    error = {
      message: 'Required field missing',
      status: 400,
      code: 'MISSING_REQUIRED_FIELD'
    };
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large',
      status: 413,
      code: 'FILE_TOO_LARGE'
    };
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      status: 400,
      code: 'UNEXPECTED_FILE'
    };
  } else if (err.message && err.message.includes('Invalid file type')) {
    error = {
      message: err.message,
      status: 400,
      code: 'INVALID_FILE_TYPE'
    };
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Something went wrong. Please try again later.';
  }
  
  res.status(error.status).json({
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.message 
    })
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/tools',
      'POST /api/tools',
      'GET /api/tools/:id',
      'PUT /api/tools/:id',
      'DELETE /api/tools/:id',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'PUT /api/auth/profile',
      'POST /api/auth/change-password',
      'GET /api/analytics/overview',
      'GET /api/files/:id'
    ]
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
