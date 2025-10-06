const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const { db } = require('../config/database');
const { 
  executionRateLimit, 
  validateToolSecurity, 
  createSecureEnvironment,
  applyResourceLimits,
  monitorResourceUsage 
} = require('../middleware/security');

const router = express.Router();

// Store active tool sessions
const activeSessions = new Map();

// ============================================================================
// TOOL EXECUTION ENDPOINTS
// ============================================================================

// POST /api/execution/start - Start tool execution
router.post('/start/:toolId', executionRateLimit, validateToolSecurity, async (req, res) => {
  try {
    const { toolId } = req.params;
    const userId = req.user.id;
    
    // Tool and files are already validated by security middleware
    const tool = req.tool;
    const toolFiles = req.toolFiles;
    const securityIssues = req.securityIssues;

    // Create execution session
    const sessionId = uuidv4();
    const sessionDir = path.join(__dirname, '../runtime', sessionId);
    
    // Create session directory
    await fs.mkdir(sessionDir, { recursive: true });

    // Write tool files to session directory
    for (const file of toolFiles) {
      const filePath = path.join(sessionDir, file.filename);
      
      if (file.content) {
        await fs.writeFile(filePath, file.content);
      } else {
        // For large files, copy from uploads directory
        const sourcePath = path.join(__dirname, '../uploads', file.file_path);
        await fs.copyFile(sourcePath, filePath);
      }
    }

    // Determine execution strategy based on tool type
    const executionConfig = await determineExecutionStrategy(tool, toolFiles, sessionDir);
    
    if (!executionConfig) {
      return res.status(400).json({
        error: 'Unable to determine execution strategy for this tool'
      });
    }

    // Start tool execution
    const session = await startToolExecution(sessionId, executionConfig, tool);
    
    // Store session
    activeSessions.set(sessionId, session);

    // Log execution start
    await db.insert('tool_analytics', {
      tool_id: toolId,
      user_id: userId,
      event_type: 'execution_start',
      event_data: JSON.stringify({
        session_id: sessionId,
        execution_type: executionConfig.type,
        timestamp: new Date().toISOString()
      })
    });

    res.json({
      success: true,
      sessionId,
      executionUrl: `${process.env.BASE_URL}/api/execution/interface/${sessionId}`,
      status: 'starting',
      message: 'Tool execution initiated successfully'
    });

  } catch (error) {
    console.error('Error starting tool execution:', error);
    res.status(500).json({
      error: 'Failed to start tool execution',
      details: error.message
    });
  }
});

// GET /api/execution/status/:sessionId - Get execution status
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json({
      sessionId,
      status: session.status,
      port: session.port,
      url: session.url,
      logs: session.logs.slice(-50), // Last 50 log entries
      startTime: session.startTime,
      uptime: Date.now() - session.startTime
    });

  } catch (error) {
    console.error('Error getting execution status:', error);
    res.status(500).json({
      error: 'Failed to get execution status'
    });
  }
});

// GET /api/execution/interface/:sessionId - Serve tool interface
router.get('/interface/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).send('Session not found');
    }

    if (session.status !== 'running') {
      return res.status(503).send(`
        <html>
          <head><title>Tool Starting...</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>🚀 Tool is starting...</h2>
            <p>Please wait while your tool initializes.</p>
            <div style="margin: 20px;">
              <div style="display: inline-block; width: 200px; height: 4px; background: #e0e0e0; border-radius: 2px;">
                <div style="width: 60%; height: 100%; background: #4CAF50; border-radius: 2px; animation: pulse 1s infinite;"></div>
              </div>
            </div>
            <script>
              setTimeout(() => window.location.reload(), 2000);
            </script>
            <style>
              @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            </style>
          </body>
        </html>
      `);
    }

    // Proxy to the running tool
    if (session.type === 'web' && session.port) {
      return res.redirect(`http://localhost:${session.port}`);
    }

    // For static tools, serve the generated interface
    if (session.interfaceHtml) {
      return res.send(session.interfaceHtml);
    }

    res.status(500).send('Tool interface not available');

  } catch (error) {
    console.error('Error serving tool interface:', error);
    res.status(500).send('Error loading tool interface');
  }
});

// POST /api/execution/stop/:sessionId - Stop tool execution
router.post('/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    // Stop the process
    if (session.process) {
      session.process.kill('SIGTERM');
    }

    // Clean up session directory
    const sessionDir = path.join(__dirname, '../runtime', sessionId);
    try {
      await fs.rmdir(sessionDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to clean up session directory:', error.message);
    }

    // Remove from active sessions
    activeSessions.delete(sessionId);

    // Log execution stop
    if (session.toolId) {
      await db.insert('tool_analytics', {
        tool_id: session.toolId,
        user_id: req.user.id,
        event_type: 'execution_stop',
        event_data: JSON.stringify({
          session_id: sessionId,
          duration: Date.now() - session.startTime,
          timestamp: new Date().toISOString()
        })
      });
    }

    res.json({
      success: true,
      message: 'Tool execution stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping tool execution:', error);
    res.status(500).json({
      error: 'Failed to stop tool execution'
    });
  }
});

// ============================================================================
// EXECUTION HELPER FUNCTIONS
// ============================================================================

async function determineExecutionStrategy(tool, toolFiles, sessionDir) {
  try {
    // Check for different tool types
    const hasPackageJson = toolFiles.some(f => f.filename === 'package.json');
    const hasRequirementsTxt = toolFiles.some(f => f.filename === 'requirements.txt');
    const hasCargoToml = toolFiles.some(f => f.filename === 'Cargo.toml');
    const hasGoMod = toolFiles.some(f => f.filename === 'go.mod');
    
    const hasHtmlFiles = toolFiles.some(f => f.filename.endsWith('.html'));
    const hasJsFiles = toolFiles.some(f => f.filename.endsWith('.js') || f.filename.endsWith('.jsx'));
    const hasPyFiles = toolFiles.some(f => f.filename.endsWith('.py'));
    
    // Node.js/React application
    if (hasPackageJson) {
      const packageJsonFile = toolFiles.find(f => f.filename === 'package.json');
      let packageJson = {};
      
      try {
        packageJson = JSON.parse(packageJsonFile.content || '{}');
      } catch (error) {
        console.warn('Failed to parse package.json:', error.message);
      }

      // Check if it's a web application
      if (packageJson.scripts && (packageJson.scripts.start || packageJson.scripts.dev)) {
        return {
          type: 'nodejs-web',
          command: 'npm',
          args: packageJson.scripts.start ? ['start'] : ['run', 'dev'],
          workingDir: sessionDir,
          port: findAvailablePort(),
          installCommand: 'npm install'
        };
      }

      // Regular Node.js script
      const entryPoint = packageJson.main || 'index.js';
      return {
        type: 'nodejs',
        command: 'node',
        args: [entryPoint],
        workingDir: sessionDir,
        installCommand: 'npm install'
      };
    }

    // Python application
    if (hasPyFiles) {
      const mainPy = toolFiles.find(f => f.filename === 'main.py' || f.filename === 'app.py');
      const entryPoint = mainPy ? mainPy.filename : toolFiles.find(f => f.filename.endsWith('.py')).filename;

      return {
        type: 'python',
        command: 'python',
        args: [entryPoint],
        workingDir: sessionDir,
        installCommand: hasRequirementsTxt ? 'pip install -r requirements.txt' : null
      };
    }

    // Static HTML/JS application
    if (hasHtmlFiles || hasJsFiles) {
      const indexHtml = toolFiles.find(f => f.filename === 'index.html');
      
      return {
        type: 'static',
        entryPoint: indexHtml ? indexHtml.filename : toolFiles.find(f => f.filename.endsWith('.html')).filename,
        workingDir: sessionDir,
        port: findAvailablePort()
      };
    }

    // Rust application
    if (hasCargoToml) {
      return {
        type: 'rust',
        command: 'cargo',
        args: ['run'],
        workingDir: sessionDir,
        buildCommand: 'cargo build'
      };
    }

    // Go application
    if (hasGoMod) {
      return {
        type: 'go',
        command: 'go',
        args: ['run', '.'],
        workingDir: sessionDir,
        buildCommand: 'go mod tidy'
      };
    }

    return null;
  } catch (error) {
    console.error('Error determining execution strategy:', error);
    return null;
  }
}

async function startToolExecution(sessionId, config, tool) {
  const session = {
    id: sessionId,
    toolId: tool.id,
    type: config.type,
    status: 'starting',
    startTime: Date.now(),
    logs: [],
    port: config.port,
    url: null,
    process: null,
    interfaceHtml: null
  };

  try {
    // Install dependencies if needed
    if (config.installCommand) {
      session.logs.push(`Installing dependencies: ${config.installCommand}`);
      await runCommand(config.installCommand, config.workingDir, session);
    }

    // Build if needed
    if (config.buildCommand) {
      session.logs.push(`Building: ${config.buildCommand}`);
      await runCommand(config.buildCommand, config.workingDir, session);
    }

    // Handle different execution types
    switch (config.type) {
      case 'nodejs-web':
        await startNodejsWebApp(session, config);
        break;
      case 'nodejs':
        await startNodejsScript(session, config);
        break;
      case 'python':
        await startPythonScript(session, config);
        break;
      case 'static':
        await startStaticApp(session, config);
        break;
      case 'rust':
      case 'go':
        await startCompiledApp(session, config);
        break;
      default:
        throw new Error(`Unsupported execution type: ${config.type}`);
    }

    session.status = 'running';
    session.logs.push('Tool started successfully');

  } catch (error) {
    session.status = 'error';
    session.logs.push(`Error: ${error.message}`);
    console.error('Error starting tool execution:', error);
  }

  return session;
}

async function startNodejsWebApp(session, config) {
  return new Promise((resolve, reject) => {
    // Create secure environment
    const secureEnv = createSecureEnvironment(config.workingDir, config);
    
    const childProcess = spawn(config.command, config.args, {
      cwd: config.workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...secureEnv, PORT: config.port }
    });

    session.process = childProcess;
    session.url = `http://localhost:${config.port}`;

    // Apply resource limits
    applyResourceLimits(childProcess);
    
    // Monitor resource usage
    monitorResourceUsage(childProcess, session);

    childProcess.stdout.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDOUT] ${log}`);
    });

    childProcess.stderr.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDERR] ${log}`);
    });

    childProcess.on('error', (error) => {
      session.logs.push(`[ERROR] ${error.message}`);
      reject(error);
    });

    // Wait for server to start
    setTimeout(() => {
      if (childProcess.exitCode === null) {
        resolve();
      } else {
        reject(new Error('Process exited unexpectedly'));
      }
    }, 3000);
  });
}

async function startStaticApp(session, config) {
  const express = require('express');
  const app = express();
  
  // Serve static files
  app.use(express.static(config.workingDir));
  
  // Start server
  const server = app.listen(config.port, () => {
    session.url = `http://localhost:${config.port}`;
    session.logs.push(`Static server started on port ${config.port}`);
  });

  session.server = server;
}

async function startNodejsScript(session, config) {
  // For non-web Node.js scripts, create a simple interface
  session.interfaceHtml = `
    <html>
      <head><title>${session.toolId} - Node.js Tool</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🔧 Node.js Tool Interface</h2>
        <p>This tool is running as a Node.js script.</p>
        <div id="output" style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Output:</h4>
          <pre id="logs">${session.logs.join('\n')}</pre>
        </div>
        <script>
          // Poll for updates
          setInterval(async () => {
            try {
              const response = await fetch('/api/execution/status/${session.id}');
              const data = await response.json();
              document.getElementById('logs').textContent = data.logs.join('\\n');
            } catch (error) {
              console.error('Failed to fetch logs:', error);
            }
          }, 2000);
        </script>
      </body>
    </html>
  `;
}

async function startPythonScript(session, config) {
  return new Promise((resolve, reject) => {
    const process = spawn(config.command, config.args, {
      cwd: config.workingDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    session.process = process;

    process.stdout.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDOUT] ${log}`);
    });

    process.stderr.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDERR] ${log}`);
    });

    process.on('error', (error) => {
      session.logs.push(`[ERROR] ${error.message}`);
      reject(error);
    });

    // Create interface for Python script
    session.interfaceHtml = `
      <html>
        <head><title>${session.toolId} - Python Tool</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🐍 Python Tool Interface</h2>
          <p>This tool is running as a Python script.</p>
          <div id="output" style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Output:</h4>
            <pre id="logs">${session.logs.join('\n')}</pre>
          </div>
          <script>
            setInterval(async () => {
              try {
                const response = await fetch('/api/execution/status/${session.id}');
                const data = await response.json();
                document.getElementById('logs').textContent = data.logs.join('\\n');
              } catch (error) {
                console.error('Failed to fetch logs:', error);
              }
            }, 2000);
          </script>
        </body>
      </html>
    `;

    setTimeout(() => resolve(), 1000);
  });
}

async function startCompiledApp(session, config) {
  return new Promise((resolve, reject) => {
    const process = spawn(config.command, config.args, {
      cwd: config.workingDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    session.process = process;

    process.stdout.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDOUT] ${log}`);
    });

    process.stderr.on('data', (data) => {
      const log = data.toString().trim();
      session.logs.push(`[STDERR] ${log}`);
    });

    process.on('error', (error) => {
      session.logs.push(`[ERROR] ${error.message}`);
      reject(error);
    });

    setTimeout(() => resolve(), 2000);
  });
}

async function runCommand(command, workingDir, session) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    process.stdout.on('data', (data) => {
      session.logs.push(`[${cmd}] ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data) => {
      session.logs.push(`[${cmd} ERROR] ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', reject);
  });
}

function findAvailablePort() {
  // Simple port allocation - in production, use proper port management
  return Math.floor(Math.random() * (9000 - 8000) + 8000);
}

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  console.log('Cleaning up active tool sessions...');
  for (const [sessionId, session] of activeSessions) {
    if (session.process) {
      session.process.kill('SIGTERM');
    }
    if (session.server) {
      session.server.close();
    }
  }
});

module.exports = router;
