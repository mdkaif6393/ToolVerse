const EventEmitter = require('events');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const Docker = require('dockerode');
const { Worker } = require('worker_threads');
const WebSocket = require('ws');

class ToolOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.docker = new Docker();
    this.activeSessions = new Map();
    this.workers = new Map();
    this.wsServer = null;
    this.metrics = {
      totalExecutions: 0,
      activeExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        disk: 0
      }
    };
    
    this.init();
  }

  async init() {
    // Initialize WebSocket server for real-time communication
    this.wsServer = new WebSocket.Server({ port: 8080 });
    
    this.wsServer.on('connection', (ws, req) => {
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
    });

    // Start metrics collection
    this.startMetricsCollection();
    
    // Initialize Docker containers
    await this.initializeContainers();
    
    console.log('🚀 Tool Orchestrator initialized');
  }

  async initializeContainers() {
    // Create base containers for different languages
    const containers = [
      {
        name: 'nodejs-sandbox',
        image: 'node:18-alpine',
        config: {
          WorkingDir: '/app',
          Env: ['NODE_ENV=sandbox'],
          User: '1000:1000',
          Memory: 512 * 1024 * 1024, // 512MB
          CpuShares: 512,
          NetworkMode: 'none'
        }
      },
      {
        name: 'python-sandbox',
        image: 'python:3.11-alpine',
        config: {
          WorkingDir: '/app',
          Env: ['PYTHONPATH=/app'],
          User: '1000:1000',
          Memory: 512 * 1024 * 1024,
          CpuShares: 512,
          NetworkMode: 'none'
        }
      },
      {
        name: 'go-sandbox',
        image: 'golang:1.21-alpine',
        config: {
          WorkingDir: '/app',
          Env: ['GOOS=linux', 'GOARCH=amd64'],
          User: '1000:1000',
          Memory: 512 * 1024 * 1024,
          CpuShares: 512,
          NetworkMode: 'none'
        }
      }
    ];

    for (const containerConfig of containers) {
      try {
        // Pull image if not exists
        await this.docker.pull(containerConfig.image);
        console.log(`✅ Container ${containerConfig.name} ready`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${containerConfig.name}:`, error.message);
      }
    }
  }

  // Advanced tool execution with Docker isolation
  async executeToolInContainer(sessionId, toolData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Determine container type based on tool analysis
      const containerType = this.determineContainerType(toolData.analysis);
      
      // Create isolated container for this execution
      const container = await this.createExecutionContainer(sessionId, containerType, toolData);
      
      // Start container
      await container.start();
      
      // Set up real-time monitoring
      const monitor = this.setupContainerMonitoring(sessionId, container);
      
      // Execute tool inside container
      const execution = await this.runToolInContainer(container, toolData);
      
      // Store session data
      const session = {
        id: sessionId,
        container,
        monitor,
        execution,
        toolData,
        startTime,
        status: 'running',
        logs: [],
        metrics: {
          cpu: 0,
          memory: 0,
          network: 0
        }
      };
      
      this.activeSessions.set(sessionId, session);
      this.metrics.activeExecutions++;
      this.metrics.totalExecutions++;
      
      // Emit events
      this.emit('executionStarted', { sessionId, toolData });
      
      // Set up cleanup timer
      setTimeout(() => {
        this.cleanupSession(sessionId, 'timeout');
      }, options.timeout || 5 * 60 * 1000); // 5 minutes default
      
      return {
        sessionId,
        status: 'running',
        containerId: container.id,
        startTime
      };
      
    } catch (error) {
      this.metrics.failedExecutions++;
      this.emit('executionFailed', { sessionId, error: error.message });
      throw error;
    }
  }

  determineContainerType(analysis) {
    if (analysis.languages.includes('JavaScript') || analysis.languages.includes('TypeScript')) {
      return 'nodejs-sandbox';
    } else if (analysis.languages.includes('Python')) {
      return 'python-sandbox';
    } else if (analysis.languages.includes('Go')) {
      return 'go-sandbox';
    } else {
      return 'nodejs-sandbox'; // Default fallback
    }
  }

  async createExecutionContainer(sessionId, containerType, toolData) {
    const containerConfig = {
      Image: this.getImageForContainer(containerType),
      WorkingDir: '/app',
      Env: [
        'NODE_ENV=sandbox',
        'PYTHONPATH=/app',
        `SESSION_ID=${sessionId}`,
        'EXECUTION_MODE=isolated'
      ],
      User: '1000:1000',
      Memory: 512 * 1024 * 1024, // 512MB
      CpuShares: 512,
      NetworkMode: 'none',
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
      Labels: {
        'tool.session': sessionId,
        'tool.name': toolData.toolName,
        'tool.type': containerType
      },
      HostConfig: {
        Memory: 512 * 1024 * 1024,
        CpuShares: 512,
        PidsLimit: 50,
        ReadonlyRootfs: false,
        Tmpfs: {
          '/tmp': 'rw,noexec,nosuid,size=100m'
        },
        Ulimits: [
          { Name: 'nproc', Soft: 50, Hard: 50 },
          { Name: 'nofile', Soft: 1024, Hard: 1024 }
        ]
      }
    };

    return await this.docker.createContainer(containerConfig);
  }

  getImageForContainer(containerType) {
    const imageMap = {
      'nodejs-sandbox': 'node:18-alpine',
      'python-sandbox': 'python:3.11-alpine',
      'go-sandbox': 'golang:1.21-alpine'
    };
    return imageMap[containerType] || 'node:18-alpine';
  }

  async runToolInContainer(container, toolData) {
    // Copy files to container
    await this.copyFilesToContainer(container, toolData.files);
    
    // Determine execution command
    const command = this.buildExecutionCommand(toolData);
    
    // Execute command in container
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false
    });
    
    const stream = await exec.start({ hijack: true, stdin: false });
    
    return {
      exec,
      stream,
      command
    };
  }

  async copyFilesToContainer(container, files) {
    // Create tar archive of files
    const tar = require('tar-stream');
    const pack = tar.pack();
    
    for (const file of files) {
      pack.entry({ name: file.name, size: Buffer.byteLength(file.content) }, file.content);
    }
    
    pack.finalize();
    
    // Copy to container
    await container.putArchive(pack, { path: '/app' });
  }

  buildExecutionCommand(toolData) {
    const { analysis, files } = toolData;
    
    if (analysis.languages.includes('JavaScript')) {
      const entryPoint = files.find(f => 
        f.name === 'index.js' || 
        f.name === 'app.js' || 
        f.name === 'server.js'
      )?.name || 'index.js';
      
      return ['node', entryPoint];
    } else if (analysis.languages.includes('Python')) {
      const entryPoint = files.find(f => 
        f.name === 'main.py' || 
        f.name === 'app.py'
      )?.name || 'main.py';
      
      return ['python3', entryPoint];
    } else if (analysis.languages.includes('Go')) {
      return ['sh', '-c', 'go build -o app . && ./app'];
    }
    
    return ['node', 'index.js']; // Default
  }

  setupContainerMonitoring(sessionId, container) {
    const monitor = {
      sessionId,
      containerId: container.id,
      stats: {
        cpu: 0,
        memory: 0,
        network: 0,
        disk: 0
      },
      logs: [],
      startTime: Date.now()
    };

    // Set up stats monitoring
    const statsStream = container.stats({ stream: true });
    
    statsStream.on('data', (data) => {
      try {
        const stats = JSON.parse(data.toString());
        
        // Calculate CPU percentage
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
        
        // Memory usage
        const memoryUsage = stats.memory_stats.usage;
        const memoryLimit = stats.memory_stats.limit;
        const memoryPercent = (memoryUsage / memoryLimit) * 100;
        
        monitor.stats = {
          cpu: cpuPercent || 0,
          memory: memoryPercent || 0,
          memoryBytes: memoryUsage || 0,
          network: stats.networks ? Object.values(stats.networks).reduce((acc, net) => acc + net.rx_bytes + net.tx_bytes, 0) : 0,
          disk: stats.blkio_stats ? stats.blkio_stats.io_service_bytes_recursive?.reduce((acc, io) => acc + io.value, 0) || 0 : 0
        };
        
        // Emit real-time stats
        this.emit('statsUpdate', { sessionId, stats: monitor.stats });
        
        // Send to WebSocket clients
        this.broadcastToClients('statsUpdate', { sessionId, stats: monitor.stats });
        
      } catch (error) {
        console.error('Error parsing container stats:', error);
      }
    });

    // Set up log monitoring
    container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    }).then(stream => {
      stream.on('data', (chunk) => {
        const logEntry = {
          timestamp: new Date(),
          data: chunk.toString(),
          type: 'container'
        };
        
        monitor.logs.push(logEntry);
        
        // Emit log event
        this.emit('logUpdate', { sessionId, log: logEntry });
        
        // Send to WebSocket clients
        this.broadcastToClients('logUpdate', { sessionId, log: logEntry });
      });
    });

    return monitor;
  }

  // Real-time communication
  broadcastToClients(event, data) {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event, data }));
        }
      });
    }
  }

  handleWebSocketMessage(ws, data) {
    const { action, sessionId, payload } = data;
    
    switch (action) {
      case 'subscribe':
        ws.sessionId = sessionId;
        ws.send(JSON.stringify({ event: 'subscribed', sessionId }));
        break;
        
      case 'getStatus':
        const session = this.activeSessions.get(sessionId);
        if (session) {
          ws.send(JSON.stringify({
            event: 'status',
            data: {
              sessionId,
              status: session.status,
              stats: session.monitor?.stats,
              logs: session.monitor?.logs?.slice(-50) // Last 50 logs
            }
          }));
        }
        break;
        
      case 'stopExecution':
        this.stopExecution(sessionId);
        break;
    }
  }

  // Advanced session management
  async stopExecution(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    try {
      // Stop container
      await session.container.stop({ t: 10 }); // 10 second grace period
      
      session.status = 'stopped';
      session.endTime = Date.now();
      
      this.emit('executionStopped', { sessionId });
      this.broadcastToClients('executionStopped', { sessionId });
      
    } catch (error) {
      console.error(`Error stopping session ${sessionId}:`, error);
    }
  }

  async cleanupSession(sessionId, reason = 'cleanup') {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    try {
      // Stop and remove container
      await session.container.stop({ t: 5 });
      await session.container.remove({ force: true });
      
      // Update metrics
      this.metrics.activeExecutions--;
      const executionTime = Date.now() - session.startTime;
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime + executionTime) / 2;
      
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      
      this.emit('sessionCleaned', { sessionId, reason, executionTime });
      
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error);
    }
  }

  // Metrics and monitoring
  startMetricsCollection() {
    setInterval(async () => {
      try {
        // Collect system metrics
        const systemInfo = await this.docker.info();
        
        this.metrics.resourceUsage = {
          containers: systemInfo.Containers,
          images: systemInfo.Images,
          memoryTotal: systemInfo.MemTotal,
          cpus: systemInfo.NCPU
        };
        
        // Emit metrics update
        this.emit('metricsUpdate', this.metrics);
        
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Advanced tool analysis with AI
  async analyzeToolWithAI(files) {
    return new Promise((resolve) => {
      const worker = new Worker(path.join(__dirname, 'aiAnalyzer.js'), {
        workerData: { files }
      });
      
      worker.on('message', (analysis) => {
        resolve(analysis);
      });
      
      worker.on('error', (error) => {
        console.error('AI Analysis error:', error);
        resolve({ error: error.message });
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        worker.terminate();
        resolve({ error: 'Analysis timeout' });
      }, 30000);
    });
  }

  // Get comprehensive session status
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId,
      status: session.status,
      toolName: session.toolData.toolName,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime,
      stats: session.monitor?.stats,
      logs: session.monitor?.logs?.slice(-100), // Last 100 logs
      containerId: session.container.id,
      metrics: session.metrics
    };
  }

  // Get system metrics
  getSystemMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.activeSessions.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };
  }

  // Cleanup all sessions
  async cleanup() {
    console.log('🧹 Cleaning up all sessions...');
    
    const cleanupPromises = Array.from(this.activeSessions.keys()).map(sessionId => 
      this.cleanupSession(sessionId, 'shutdown')
    );
    
    await Promise.all(cleanupPromises);
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    console.log('✅ Cleanup completed');
  }
}

module.exports = ToolOrchestrator;
