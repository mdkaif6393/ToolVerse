const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const crypto = require('crypto');

// Advanced rate limiting with different tiers
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Different rate limits for different operations
const rateLimits = {
  toolExecution: createRateLimit(15 * 60 * 1000, 10, 'Too many tool executions. Try again in 15 minutes.'),
  toolCreation: createRateLimit(60 * 60 * 1000, 5, 'Too many tools created. Try again in 1 hour.'),
  fileUpload: createRateLimit(10 * 60 * 1000, 20, 'Too many file uploads. Try again in 10 minutes.'),
  apiCalls: createRateLimit(60 * 1000, 100, 'Too many API calls. Try again in 1 minute.')
};

// Advanced security scanner
const securityScanner = {
  // Dangerous patterns to detect
  dangerousPatterns: [
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /shell_exec\s*\(/gi,
    /passthru\s*\(/gi,
    /file_get_contents\s*\(/gi,
    /file_put_contents\s*\(/gi,
    /fopen\s*\(/gi,
    /fwrite\s*\(/gi,
    /require\s*\(/gi,
    /include\s*\(/gi,
    /import\s+os/gi,
    /import\s+subprocess/gi,
    /import\s+sys/gi,
    /process\.env/gi,
    /child_process/gi,
    /fs\.readFile/gi,
    /fs\.writeFile/gi,
    /document\.cookie/gi,
    /localStorage/gi,
    /sessionStorage/gi,
    /XMLHttpRequest/gi,
    /fetch\s*\(/gi,
    /window\.location/gi,
    /location\.href/gi,
    /innerHTML\s*=/gi,
    /outerHTML\s*=/gi,
    /document\.write/gi,
    /\.\.\/\.\.\//gi, // Path traversal
    /\$\{.*\}/gi, // Template injection
    /<script/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi // Event handlers
  ],

  // Scan code for security issues
  scanCode: (code, filename = 'unknown') => {
    const issues = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      this.dangerousPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.source,
            severity: this.getSeverity(pattern),
            file: filename
          });
        }
      });
    });

    return {
      safe: issues.length === 0,
      issues,
      riskScore: this.calculateRiskScore(issues)
    };
  },

  // Calculate risk score based on issues
  calculateRiskScore: (issues) => {
    let score = 0;
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score += 10; break;
        case 'high': score += 7; break;
        case 'medium': score += 4; break;
        case 'low': score += 2; break;
      }
    });
    return Math.min(score, 100);
  },

  // Get severity level for pattern
  getSeverity: (pattern) => {
    const critical = [/eval\s*\(/gi, /exec\s*\(/gi, /system\s*\(/gi, /shell_exec\s*\(/gi];
    const high = [/file_get_contents\s*\(/gi, /file_put_contents\s*\(/gi, /require\s*\(/gi, /import\s+os/gi];
    const medium = [/process\.env/gi, /child_process/gi, /fs\.readFile/gi, /innerHTML\s*=/gi];
    
    if (critical.some(p => p.source === pattern.source)) return 'critical';
    if (high.some(p => p.source === pattern.source)) return 'high';
    if (medium.some(p => p.source === pattern.source)) return 'medium';
    return 'low';
  }
};

// File validation
const fileValidator = {
  // Allowed file types with size limits (in bytes)
  allowedTypes: {
    'application/javascript': 5 * 1024 * 1024, // 5MB
    'text/javascript': 5 * 1024 * 1024,
    'application/typescript': 5 * 1024 * 1024,
    'text/typescript': 5 * 1024 * 1024,
    'text/html': 2 * 1024 * 1024, // 2MB
    'text/css': 1 * 1024 * 1024, // 1MB
    'application/json': 1 * 1024 * 1024,
    'text/plain': 1 * 1024 * 1024,
    'application/pdf': 10 * 1024 * 1024, // 10MB
    'image/jpeg': 5 * 1024 * 1024,
    'image/png': 5 * 1024 * 1024,
    'image/gif': 2 * 1024 * 1024,
    'image/webp': 5 * 1024 * 1024,
    'application/zip': 50 * 1024 * 1024, // 50MB
    'text/x-python': 5 * 1024 * 1024,
    'application/x-python-code': 5 * 1024 * 1024
  },

  // Validate file
  validateFile: (file) => {
    const errors = [];
    
    // Check file type
    if (!this.allowedTypes[file.mimetype]) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }
    
    // Check file size
    const maxSize = this.allowedTypes[file.mimetype];
    if (file.size > maxSize) {
      errors.push(`File size ${file.size} exceeds limit of ${maxSize} bytes`);
    }
    
    // Check filename for suspicious patterns
    if (this.hasSuspiciousFilename(file.originalname)) {
      errors.push('Suspicious filename detected');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Check for suspicious filenames
  hasSuspiciousFilename: (filename) => {
    const suspiciousPatterns = [
      /\.\./,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
      /\.(exe|bat|cmd|scr|pif|com)$/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }
};

// Resource monitoring
const resourceMonitor = {
  // Resource limits
  limits: {
    maxMemory: 512 * 1024 * 1024, // 512MB
    maxCpuTime: 5 * 60 * 1000, // 5 minutes
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxProcesses: 5,
    maxNetworkConnections: 10
  },

  // Active sessions tracking
  activeSessions: new Map(),

  // Monitor session resources
  monitorSession: (sessionId, process) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    const monitor = {
      sessionId,
      process,
      startTime,
      startMemory,
      maxMemory: 0,
      cpuTime: 0,
      networkConnections: 0,
      status: 'running'
    };
    
    this.activeSessions.set(sessionId, monitor);
    
    // Set up monitoring interval
    const interval = setInterval(() => {
      if (!this.activeSessions.has(sessionId)) {
        clearInterval(interval);
        return;
      }
      
      const current = this.activeSessions.get(sessionId);
      const memory = process.memoryUsage();
      const cpuTime = Date.now() - startTime;
      
      current.maxMemory = Math.max(current.maxMemory, memory.heapUsed);
      current.cpuTime = cpuTime;
      
      // Check limits
      if (current.maxMemory > this.limits.maxMemory) {
        this.terminateSession(sessionId, 'Memory limit exceeded');
      }
      
      if (current.cpuTime > this.limits.maxCpuTime) {
        this.terminateSession(sessionId, 'CPU time limit exceeded');
      }
    }, 1000);
    
    return monitor;
  },

  // Terminate session
  terminateSession: (sessionId, reason) => {
    const session = this.activeSessions.get(sessionId);
    if (session && session.process) {
      session.process.kill('SIGTERM');
      session.status = 'terminated';
      session.terminationReason = reason;
      
      setTimeout(() => {
        if (session.process && !session.process.killed) {
          session.process.kill('SIGKILL');
        }
      }, 5000);
    }
  },

  // Get session stats
  getSessionStats: (sessionId) => {
    return this.activeSessions.get(sessionId);
  },

  // Cleanup session
  cleanupSession: (sessionId) => {
    this.activeSessions.delete(sessionId);
  }
};

// Sandbox environment
const sandboxEnvironment = {
  // Create restricted environment variables
  createRestrictedEnv: () => ({
    NODE_ENV: 'sandbox',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: '/tmp/sandbox',
    USER: 'sandbox',
    SHELL: '/bin/sh',
    LANG: 'en_US.UTF-8',
    // Remove dangerous env vars
    PWD: '/tmp/sandbox',
    OLDPWD: undefined,
    SUDO_USER: undefined,
    SUDO_UID: undefined,
    SUDO_GID: undefined
  }),

  // Create secure execution options
  createSecureOptions: (sessionId) => ({
    cwd: `/tmp/sandbox/${sessionId}`,
    env: this.createRestrictedEnv(),
    timeout: 5 * 60 * 1000, // 5 minutes
    maxBuffer: 10 * 1024 * 1024, // 10MB
    uid: 1000, // Non-root user
    gid: 1000,
    detached: false,
    stdio: ['pipe', 'pipe', 'pipe']
  })
};

// Audit logging
const auditLogger = {
  logs: [],
  
  log: (event, data) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      id: crypto.randomUUID()
    };
    
    this.logs.push(logEntry);
    console.log(`[AUDIT] ${event}:`, data);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  },
  
  getLogs: (filter) => {
    if (!filter) return this.logs;
    
    return this.logs.filter(log => {
      if (filter.event && log.event !== filter.event) return false;
      if (filter.since && new Date(log.timestamp) < new Date(filter.since)) return false;
      if (filter.until && new Date(log.timestamp) > new Date(filter.until)) return false;
      return true;
    });
  }
};

// Main security middleware
const toolSecurityMiddleware = (req, res, next) => {
  // Apply helmet for basic security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })(req, res, () => {
    // Log request
    auditLogger.log('request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  });
};

module.exports = {
  rateLimits,
  securityScanner,
  fileValidator,
  resourceMonitor,
  sandboxEnvironment,
  auditLogger,
  toolSecurityMiddleware
};
