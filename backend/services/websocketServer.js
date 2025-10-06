const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

class DashboardWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
  }

  start() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    console.log(`🔌 WebSocket server started on port ${this.port}`);
  }

  verifyClient(info) {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token', error.message);
      return false;
    }
  }

  handleConnection(ws, req) {
    const userId = req.user.id;
    console.log(`WebSocket client connected: ${userId}`);

    // Add client to tracking
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Send initial connection message
    this.sendToClient(ws, {
      type: 'connection_established',
      data: { userId, timestamp: new Date().toISOString() }
    });

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleClientMessage(ws, userId, data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${userId}`);
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  handleClientMessage(ws, userId, message) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      
      case 'subscribe_dashboard':
        // Client wants to subscribe to dashboard updates
        console.log(`User ${userId} subscribed to dashboard updates`);
        break;
      
      case 'subscribe_analytics':
        // Client wants to subscribe to analytics updates
        console.log(`User ${userId} subscribed to analytics updates`);
        break;
      
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast dashboard update to specific user
  broadcastDashboardUpdate(userId, updateData) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = {
        type: 'dashboard_update',
        data: updateData,
        timestamp: new Date().toISOString()
      };

      userClients.forEach(ws => {
        this.sendToClient(ws, message);
      });
    }
  }

  // Broadcast analytics update to specific user
  broadcastAnalyticsUpdate(userId, updateData) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = {
        type: 'analytics_update',
        data: updateData,
        timestamp: new Date().toISOString()
      };

      userClients.forEach(ws => {
        this.sendToClient(ws, message);
      });
    }
  }

  // Broadcast to all connected clients
  broadcastToAll(message) {
    this.clients.forEach((clientSet, userId) => {
      clientSet.forEach(ws => {
        this.sendToClient(ws, message);
      });
    });
  }

  // Get connected clients count
  getConnectedClientsCount() {
    let total = 0;
    this.clients.forEach(clientSet => {
      total += clientSet.size;
    });
    return total;
  }

  // Get stats
  getStats() {
    return {
      connectedUsers: this.clients.size,
      totalConnections: this.getConnectedClientsCount(),
      uptime: process.uptime()
    };
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket server stopped');
    }
  }
}

// Database change listeners for real-time updates
class DatabaseChangeListener {
  constructor(wsServer) {
    this.wsServer = wsServer;
  }

  // Simulate database triggers (in a real app, you'd use PostgreSQL NOTIFY/LISTEN)
  async startListening() {
    // Poll for changes every 30 seconds (in production, use proper DB triggers)
    setInterval(async () => {
      await this.checkForUpdates();
    }, 30000);
  }

  async checkForUpdates() {
    try {
      // Check for recent project updates
      const recentProjects = await db.getMany(`
        SELECT DISTINCT user_id 
        FROM public.projects 
        WHERE updated_at > NOW() - INTERVAL '1 minute'
      `);

      // Check for recent client updates
      const recentClients = await db.getMany(`
        SELECT DISTINCT user_id 
        FROM public.clients 
        WHERE updated_at > NOW() - INTERVAL '1 minute'
      `);

      // Check for recent invoice updates
      const recentInvoices = await db.getMany(`
        SELECT DISTINCT user_id 
        FROM public.invoices 
        WHERE updated_at > NOW() - INTERVAL '1 minute'
      `);

      // Check for recent productivity updates (if table exists)
      let recentProductivity = [];
      try {
        recentProductivity = await db.getMany(`
          SELECT DISTINCT user_id 
          FROM public.productivity_metrics 
          WHERE updated_at > NOW() - INTERVAL '1 minute'
        `);
      } catch (error) {
        // Table might not exist yet, ignore error
      }

      // Notify affected users
      const affectedUsers = new Set([
        ...recentProjects.map(p => p.user_id),
        ...recentClients.map(c => c.user_id),
        ...recentInvoices.map(i => i.user_id),
        ...recentProductivity.map(pm => pm.user_id)
      ]);

      for (const userId of affectedUsers) {
        this.wsServer.broadcastAnalyticsUpdate(userId, {
          type: 'data_changed',
          message: 'Analytics data has been updated'
        });
      }
    } catch (error) {
      console.error('Error checking for database updates:', error);
    }
  }
}

module.exports = { DashboardWebSocketServer, DatabaseChangeListener };
