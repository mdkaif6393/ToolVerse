const WebSocket = require('ws');
const { supabaseAdmin } = require('../config/supabase');

class SimpleWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    try {
      this.wss = new WebSocket.Server({ 
        port: this.port,
        verifyClient: this.verifyClient.bind(this)
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      
      console.log(`🔌 Simple WebSocket server started on port ${this.port}`);
      console.log('   WebSocket server is optional - dashboard works without it');
      
      // Send periodic updates to connected clients
      this.startPeriodicUpdates();
      
    } catch (error) {
      console.log(`⚠️  Could not start WebSocket server on port ${this.port}:`, error.message);
      console.log('   Dashboard will work in offline mode without real-time updates');
    }
  }

  verifyClient(info) {
    // For simplicity, allow all connections
    // In production, you'd want to verify JWT tokens here
    return true;
  }

  handleConnection(ws, req) {
    console.log('WebSocket client connected');
    this.clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.log('WebSocket client error:', error.message);
      this.clients.delete(ws);
    });

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      data: { message: 'Connected to ToolVerse WebSocket server' },
      timestamp: new Date().toISOString()
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  broadcast(message) {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  startPeriodicUpdates() {
    // Send dashboard updates every 60 seconds
    setInterval(() => {
      if (this.clients.size > 0) {
        this.broadcast({
          type: 'dashboard_update',
          data: { 
            message: 'Dashboard data refresh available',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 60000); // 60 seconds
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('WebSocket server stopped');
    }
  }
}

module.exports = SimpleWebSocketServer;
