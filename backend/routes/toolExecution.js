const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const crypto = require('crypto');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { 
  rateLimits, 
  securityScanner, 
  fileValidator, 
  resourceMonitor, 
  sandboxEnvironment,
  auditLogger 
} = require('../middleware/toolSecurity');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    const validation = fileValidator.validateFile(file);
    if (validation.valid) {
      cb(null, true);
    } else {
      cb(new Error(validation.errors.join(', ')), false);
    }
  }
});

// Active sessions storage
const activeSessions = new Map();

// Tool execution engines
const executionEngines = {
  // Node.js execution
  nodejs: {
    detect: (files) => files.some(f => f.name.endsWith('.js') || f.name === 'package.json'),
    
    execute: async (sessionId, files, options = {}) => {
      const sessionDir = `/tmp/sandbox/${sessionId}`;
      await fs.mkdir(sessionDir, { recursive: true });
      
      // Write files to session directory
      for (const file of files) {
        const filePath = path.join(sessionDir, file.name);
        await fs.writeFile(filePath, file.content);
      }
      
      // Check for package.json and install dependencies
      const packageJsonPath = path.join(sessionDir, 'package.json');
      let installProcess;
      
      try {
        await fs.access(packageJsonPath);
        auditLogger.log('npm_install_start', { sessionId });
        
        installProcess = spawn('npm', ['install', '--production', '--no-audit'], {
          cwd: sessionDir,
          env: sandboxEnvironment.createRestrictedEnv(),
          timeout: 2 * 60 * 1000 // 2 minutes
        });
        
        await new Promise((resolve, reject) => {
          installProcess.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`npm install failed with code ${code}`));
          });
        });
      } catch (error) {
        // No package.json or install failed, continue without dependencies
        auditLogger.log('npm_install_skip', { sessionId, reason: error.message });
      }
      
      // Find entry point
      const entryPoint = files.find(f => 
        f.name === 'index.js' || 
        f.name === 'app.js' || 
        f.name === 'server.js' ||
        f.name === 'main.js'
      )?.name || files.find(f => f.name.endsWith('.js'))?.name;
      
      if (!entryPoint) {
        throw new Error('No JavaScript entry point found');
      }
      
      // Execute the tool
      const execOptions = sandboxEnvironment.createSecureOptions(sessionId);
      const process = spawn('node', [entryPoint], execOptions);
      
      return {
        process,
        entryPoint,
        sessionDir,
        type: 'nodejs'
      };
    }
  },

  // Python execution
  python: {
    detect: (files) => files.some(f => f.name.endsWith('.py') || f.name === 'requirements.txt'),
    
    execute: async (sessionId, files, options = {}) => {
      const sessionDir = `/tmp/sandbox/${sessionId}`;
      await fs.mkdir(sessionDir, { recursive: true });
      
      // Write files
      for (const file of files) {
        const filePath = path.join(sessionDir, file.name);
        await fs.writeFile(filePath, file.content);
      }
      
      // Install requirements if present
      const requirementsPath = path.join(sessionDir, 'requirements.txt');
      try {
        await fs.access(requirementsPath);
        auditLogger.log('pip_install_start', { sessionId });
        
        const installProcess = spawn('pip', ['install', '-r', 'requirements.txt', '--user'], {
          cwd: sessionDir,
          env: sandboxEnvironment.createRestrictedEnv(),
          timeout: 3 * 60 * 1000 // 3 minutes
        });
        
        await new Promise((resolve, reject) => {
          installProcess.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`pip install failed with code ${code}`));
          });
        });
      } catch (error) {
        auditLogger.log('pip_install_skip', { sessionId, reason: error.message });
      }
      
      // Find entry point
      const entryPoint = files.find(f => 
        f.name === 'main.py' || 
        f.name === 'app.py' || 
        f.name === 'server.py'
      )?.name || files.find(f => f.name.endsWith('.py'))?.name;
      
      if (!entryPoint) {
        throw new Error('No Python entry point found');
      }
      
      const execOptions = sandboxEnvironment.createSecureOptions(sessionId);
      const process = spawn('python3', [entryPoint], execOptions);
      
      return {
        process,
        entryPoint,
        sessionDir,
        type: 'python'
      };
    }
  },

  // Static web app execution
  static: {
    detect: (files) => files.some(f => f.name.endsWith('.html')),
    
    execute: async (sessionId, files, options = {}) => {
      const sessionDir = `/tmp/sandbox/${sessionId}`;
      await fs.mkdir(sessionDir, { recursive: true });
      
      // Write files
      for (const file of files) {
        const filePath = path.join(sessionDir, file.name);
        await fs.writeFile(filePath, file.content);
      }
      
      // Start simple HTTP server
      const port = 3000 + Math.floor(Math.random() * 1000);
      const execOptions = sandboxEnvironment.createSecureOptions(sessionId);
      
      const process = spawn('python3', ['-m', 'http.server', port.toString()], execOptions);
      
      return {
        process,
        entryPoint: 'index.html',
        sessionDir,
        port,
        type: 'static'
      };
    }
  },

  // Go execution
  go: {
    detect: (files) => files.some(f => f.name.endsWith('.go') || f.name === 'go.mod'),
    
    execute: async (sessionId, files, options = {}) => {
      const sessionDir = `/tmp/sandbox/${sessionId}`;
      await fs.mkdir(sessionDir, { recursive: true });
      
      // Write files
      for (const file of files) {
        const filePath = path.join(sessionDir, file.name);
        await fs.writeFile(filePath, file.content);
      }
      
      // Build the Go application
      const execOptions = sandboxEnvironment.createSecureOptions(sessionId);
      const buildProcess = spawn('go', ['build', '-o', 'app'], execOptions);
      
      await new Promise((resolve, reject) => {
        buildProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Go build failed with code ${code}`));
        });
      });
      
      // Execute the built binary
      const process = spawn('./app', [], execOptions);
      
      return {
        process,
        entryPoint: 'main.go',
        sessionDir,
        type: 'go'
      };
    }
  }
};

// Advanced tool analyzer
const toolAnalyzer = {
  analyze: async (files) => {
    const analysis = {
      languages: [],
      frameworks: [],
      dependencies: [],
      entryPoints: [],
      configFiles: [],
      testFiles: [],
      buildTools: [],
      riskScore: 0,
      securityIssues: [],
      recommendations: []
    };
    
    for (const file of files) {
      // Language detection
      const ext = path.extname(file.name).toLowerCase();
      const langMap = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.go': 'Go',
        '.rs': 'Rust',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
        '.cs': 'C#',
        '.scala': 'Scala'
      };
      
      if (langMap[ext] && !analysis.languages.includes(langMap[ext])) {
        analysis.languages.push(langMap[ext]);
      }
      
      // Framework detection
      if (file.name === 'package.json') {
        try {
          const packageData = JSON.parse(file.content);
          const deps = { ...packageData.dependencies, ...packageData.devDependencies };
          
          Object.keys(deps).forEach(dep => {
            if (dep.includes('react')) analysis.frameworks.push('React');
            if (dep.includes('vue')) analysis.frameworks.push('Vue.js');
            if (dep.includes('angular')) analysis.frameworks.push('Angular');
            if (dep.includes('express')) analysis.frameworks.push('Express.js');
            if (dep.includes('next')) analysis.frameworks.push('Next.js');
            if (dep.includes('nuxt')) analysis.frameworks.push('Nuxt.js');
          });
          
          analysis.dependencies = Object.keys(deps);
        } catch (error) {
          // Invalid JSON
        }
      }
      
      // Entry point detection
      const entryPoints = ['index.js', 'app.js', 'main.py', 'server.js', 'main.go', 'index.html'];
      if (entryPoints.includes(file.name)) {
        analysis.entryPoints.push(file.name);
      }
      
      // Config file detection
      const configFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml'];
      if (configFiles.includes(file.name)) {
        analysis.configFiles.push(file.name);
      }
      
      // Security scanning
      const securityScan = securityScanner.scanCode(file.content, file.name);
      if (!securityScan.safe) {
        analysis.securityIssues.push(...securityScan.issues);
        analysis.riskScore = Math.max(analysis.riskScore, securityScan.riskScore);
      }
    }
    
    // Remove duplicates
    analysis.frameworks = [...new Set(analysis.frameworks)];
    
    // Generate recommendations
    if (analysis.riskScore > 50) {
      analysis.recommendations.push('High security risk detected. Review code before execution.');
    }
    if (analysis.entryPoints.length === 0) {
      analysis.recommendations.push('No clear entry point found. Specify main file.');
    }
    if (analysis.dependencies.length > 50) {
      analysis.recommendations.push('Large number of dependencies. Consider optimization.');
    }
    
    return analysis;
  }
};

// Routes

// Create new tool execution session
router.post('/create', rateLimits.toolCreation, upload.array('files', 20), async (req, res) => {
  try {
    const { toolName, description, category } = req.body;
    const files = req.files || [];
    
    if (!toolName || files.length === 0) {
      return res.status(400).json({
        error: 'Tool name and files are required'
      });
    }
    
    // Convert files to analysis format
    const analysisFiles = files.map(file => ({
      name: file.originalname,
      content: file.buffer.toString('utf8'),
      size: file.size,
      mimetype: file.mimetype
    }));
    
    // Analyze the tool
    const analysis = await toolAnalyzer.analyze(analysisFiles);
    
    // Check security
    if (analysis.riskScore > 80) {
      auditLogger.log('tool_creation_blocked', {
        toolName,
        riskScore: analysis.riskScore,
        issues: analysis.securityIssues.length
      });
      
      return res.status(403).json({
        error: 'Tool blocked due to high security risk',
        riskScore: analysis.riskScore,
        issues: analysis.securityIssues
      });
    }
    
    const sessionId = crypto.randomUUID();
    
    // Store session data
    activeSessions.set(sessionId, {
      id: sessionId,
      toolName,
      description,
      category,
      files: analysisFiles,
      analysis,
      status: 'created',
      createdAt: new Date(),
      lastActivity: new Date()
    });
    
    auditLogger.log('tool_created', {
      sessionId,
      toolName,
      filesCount: files.length,
      riskScore: analysis.riskScore
    });
    
    res.json({
      sessionId,
      analysis,
      status: 'created',
      message: 'Tool created successfully'
    });
    
  } catch (error) {
    auditLogger.log('tool_creation_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Execute tool
router.post('/execute/:sessionId', rateLimits.toolExecution, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status === 'running') {
      return res.status(409).json({ error: 'Tool already running' });
    }
    
    // Determine execution engine
    let engine = null;
    for (const [name, eng] of Object.entries(executionEngines)) {
      if (eng.detect(session.files)) {
        engine = eng;
        break;
      }
    }
    
    if (!engine) {
      return res.status(400).json({ error: 'No suitable execution engine found' });
    }
    
    auditLogger.log('tool_execution_start', {
      sessionId,
      toolName: session.toolName,
      engine: engine.constructor.name
    });
    
    // Execute the tool
    const execution = await engine.execute(sessionId, session.files);
    
    // Monitor resources
    const monitor = resourceMonitor.monitorSession(sessionId, execution.process);
    
    // Update session
    session.status = 'running';
    session.execution = execution;
    session.monitor = monitor;
    session.lastActivity = new Date();
    
    // Set up process event handlers
    execution.process.stdout.on('data', (data) => {
      if (!session.logs) session.logs = [];
      session.logs.push({
        type: 'stdout',
        data: data.toString(),
        timestamp: new Date()
      });
    });
    
    execution.process.stderr.on('data', (data) => {
      if (!session.logs) session.logs = [];
      session.logs.push({
        type: 'stderr',
        data: data.toString(),
        timestamp: new Date()
      });
    });
    
    execution.process.on('close', (code) => {
      session.status = code === 0 ? 'completed' : 'failed';
      session.exitCode = code;
      session.completedAt = new Date();
      
      auditLogger.log('tool_execution_end', {
        sessionId,
        exitCode: code,
        duration: Date.now() - session.createdAt.getTime()
      });
      
      resourceMonitor.cleanupSession(sessionId);
    });
    
    res.json({
      sessionId,
      status: 'running',
      port: execution.port,
      entryPoint: execution.entryPoint,
      message: 'Tool execution started'
    });
    
  } catch (error) {
    auditLogger.log('tool_execution_error', {
      sessionId: req.params.sessionId,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// Get session status and logs
router.get('/status/:sessionId', rateLimits.apiCalls, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const monitor = resourceMonitor.getSessionStats(sessionId);
    
    res.json({
      sessionId,
      status: session.status,
      toolName: session.toolName,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      completedAt: session.completedAt,
      exitCode: session.exitCode,
      logs: session.logs || [],
      monitor: monitor ? {
        maxMemory: monitor.maxMemory,
        cpuTime: monitor.cpuTime,
        status: monitor.status
      } : null,
      analysis: session.analysis
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop tool execution
router.post('/stop/:sessionId', rateLimits.apiCalls, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.execution && session.execution.process) {
      resourceMonitor.terminateSession(sessionId, 'User requested stop');
      session.status = 'stopped';
      session.stoppedAt = new Date();
      
      auditLogger.log('tool_execution_stopped', {
        sessionId,
        toolName: session.toolName
      });
    }
    
    res.json({
      sessionId,
      status: 'stopped',
      message: 'Tool execution stopped'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tool interface/output
router.get('/interface/:sessionId', rateLimits.apiCalls, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'running' && session.status !== 'completed') {
      return res.status(400).json({ error: 'Tool not running' });
    }
    
    // For static tools, serve the files
    if (session.execution.type === 'static') {
      const indexPath = path.join(session.execution.sessionDir, 'index.html');
      try {
        const content = await fs.readFile(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(content);
      } catch (error) {
        res.status(404).json({ error: 'Interface not found' });
      }
    } else {
      // For other tools, return connection info
      res.json({
        sessionId,
        type: session.execution.type,
        port: session.execution.port,
        entryPoint: session.execution.entryPoint,
        status: session.status
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all sessions
router.get('/sessions', rateLimits.apiCalls, (req, res) => {
  try {
    const sessions = Array.from(activeSessions.values()).map(session => ({
      sessionId: session.id,
      toolName: session.toolName,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      riskScore: session.analysis.riskScore
    }));
    
    res.json({ sessions });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit', rateLimits.apiCalls, (req, res) => {
  try {
    const { event, since, until } = req.query;
    const logs = auditLogger.getLogs({ event, since, until });
    
    res.json({ logs });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup old sessions (run periodically)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity.getTime() > maxAge) {
      if (session.execution && session.execution.process) {
        resourceMonitor.terminateSession(sessionId, 'Session expired');
      }
      activeSessions.delete(sessionId);
      
      // Cleanup session directory
      if (session.execution && session.execution.sessionDir) {
        fs.rmdir(session.execution.sessionDir, { recursive: true }).catch(() => {});
      }
      
      auditLogger.log('session_cleanup', { sessionId });
    }
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;
