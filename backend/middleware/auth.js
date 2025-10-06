const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Check if user still exists in database
    const user = await db.getOne(
      'SELECT id, email, full_name, email_verified FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      email_verified: user.email_verified
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is admin (optional)
const requireAdmin = async (req, res, next) => {
  try {
    const user = await db.getOne(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

// Middleware to check if user owns a resource
const requireOwnership = (resourceTable, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      
      const resource = await db.getOne(
        `SELECT user_id FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      if (resource.user_id !== userId) {
        return res.status(403).json({ 
          error: 'Access denied. You do not own this resource.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ 
        error: 'Ownership check failed',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

// Middleware to check rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
    
    // Check current user's requests
    const userRequests = requests.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(userId, recentRequests);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - recentRequests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  userRateLimit
};
