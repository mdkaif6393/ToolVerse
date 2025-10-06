/**
 * Real-time Integration Service
 * Connects Node.js backend with Python Analytics Service
 * Industry-level integration with WebSockets and HTTP APIs
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { auditLogger } = require('../middleware/toolSecurity');

class RealTimeIntegration extends EventEmitter {
  constructor() {
    super();
    this.pythonServiceUrl = process.env.PYTHON_ANALYTICS_URL || 'http://localhost:8001';
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.isConnected = false;
    
    this.init();
  }

  async init() {
    try {
      // Test Python service connection
      await this.testConnection();
      
      // Initialize WebSocket connection
      await this.connectWebSocket();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('🔗 Real-time Integration Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Real-time Integration:', error);
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.pythonServiceUrl}/api/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('✅ Python Analytics Service is healthy');
        return true;
      }
    } catch (error) {
      console.error('❌ Python Analytics Service connection failed:', error.message);
      throw error;
    }
  }

  async connectWebSocket() {
    try {
      const wsUrl = this.pythonServiceUrl.replace('http', 'ws') + '/ws/global';
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.on('open', () => {
        console.log('🔌 WebSocket connected to Python Analytics Service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Send authentication
        this.wsConnection.send(JSON.stringify({
          type: 'authenticate',
          data: {
            service: 'nodejs-backend',
            timestamp: new Date().toISOString()
          }
        }));
      });

      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.wsConnection.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.wsConnection.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'real_time_update':
        this.emit('analytics_update', message.data);
        break;
      
      case 'anomaly_detected':
        this.emit('anomaly_alert', message.data);
        auditLogger.log('anomaly_detected', message.data);
        break;
      
      case 'system_alert':
        this.emit('system_alert', message.data);
        console.warn('🚨 System Alert:', message.data);
        break;
      
      case 'ping':
        // Respond to ping
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
          this.wsConnection.send(JSON.stringify({ type: 'pong' }));
        }
        break;
      
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  startHealthMonitoring() {
    // Check health every 30 seconds
    setInterval(async () => {
      try {
        await this.testConnection();
        
        if (!this.isConnected) {
          console.log('🔄 WebSocket not connected, attempting to reconnect...');
          this.connectWebSocket();
        }
      } catch (error) {
        console.error('Health check failed:', error.message);
      }
    }, 30000);
  }

  // Analytics tracking methods
  async trackEvent(eventData) {
    try {
      // Send via WebSocket if connected
      if (this.isConnected && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'track_event',
          data: eventData
        }));
        return { success: true, method: 'websocket' };
      }
      
      // Fallback to HTTP API
      const response = await axios.post(`${this.pythonServiceUrl}/api/events`, eventData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, method: 'http', data: response.data };
      
    } catch (error) {
      console.error('Failed to track event:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getMetrics(organizationId) {
    try {
      const response = await axios.get(`${this.pythonServiceUrl}/api/metrics/${organizationId}`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get metrics:', error.message);
      throw error;
    }
  }

  async getDashboardData(organizationId) {
    try {
      // Request dashboard data via WebSocket for real-time updates
      if (this.isConnected && this.wsConnection.readyState === WebSocket.OPEN) {
        return new Promise((resolve, reject) => {
          const requestId = `dashboard_${Date.now()}`;
          
          // Set up one-time listener for response
          const responseHandler = (message) => {
            if (message.type === 'dashboard_data' && message.requestId === requestId) {
              this.wsConnection.removeListener('message', responseHandler);
              resolve(message.data);
            }
          };
          
          this.wsConnection.on('message', (data) => {
            try {
              const message = JSON.parse(data);
              responseHandler(message);
            } catch (error) {
              reject(error);
            }
          });
          
          // Send request
          this.wsConnection.send(JSON.stringify({
            type: 'get_dashboard',
            requestId,
            organizationId
          }));
          
          // Timeout after 10 seconds
          setTimeout(() => {
            this.wsConnection.removeListener('message', responseHandler);
            reject(new Error('Dashboard data request timeout'));
          }, 10000);
        });
      }
      
      // Fallback to HTTP
      return await this.getMetrics(organizationId);
      
    } catch (error) {
      console.error('Failed to get dashboard data:', error.message);
      throw error;
    }
  }

  // Client management integration
  async trackClientActivity(clientData) {
    return await this.trackEvent({
      event_type: 'client_activity',
      user_id: clientData.userId,
      organization_id: clientData.organizationId,
      data: {
        client_id: clientData.clientId,
        activity_type: clientData.activityType,
        details: clientData.details
      }
    });
  }

  // Tool usage integration
  async trackToolUsage(toolData) {
    return await this.trackEvent({
      event_type: 'tool_usage',
      user_id: toolData.userId,
      organization_id: toolData.organizationId,
      tool_id: toolData.toolId,
      data: {
        tool_name: toolData.toolName,
        duration: toolData.duration,
        status: toolData.status,
        file_size: toolData.fileSize,
        processing_time: toolData.processingTime
      }
    });
  }

  // API call tracking
  async trackApiCall(apiData) {
    return await this.trackEvent({
      event_type: 'api_call',
      user_id: apiData.userId,
      organization_id: apiData.organizationId,
      data: {
        endpoint: apiData.endpoint,
        method: apiData.method,
        status_code: apiData.statusCode,
        response_time: apiData.responseTime,
        user_agent: apiData.userAgent
      }
    });
  }

  // Error tracking
  async trackError(errorData) {
    return await this.trackEvent({
      event_type: 'error',
      user_id: errorData.userId || 'anonymous',
      organization_id: errorData.organizationId || 'system',
      data: {
        error_type: errorData.errorType,
        error_message: errorData.message,
        stack_trace: errorData.stack,
        endpoint: errorData.endpoint,
        user_agent: errorData.userAgent
      }
    });
  }

  // Payment tracking
  async trackPayment(paymentData) {
    return await this.trackEvent({
      event_type: 'payment',
      user_id: paymentData.userId,
      organization_id: paymentData.organizationId,
      data: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.paymentMethod,
        subscription_plan: paymentData.subscriptionPlan,
        transaction_id: paymentData.transactionId
      }
    });
  }

  // User activity tracking
  async trackUserLogin(userData) {
    return await this.trackEvent({
      event_type: 'user_login',
      user_id: userData.userId,
      organization_id: userData.organizationId,
      data: {
        login_method: userData.loginMethod,
        ip_address: userData.ipAddress,
        user_agent: userData.userAgent,
        location: userData.location
      }
    });
  }

  // Real-time notifications
  broadcastToClients(eventType, data) {
    this.emit('broadcast', {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup method
  async cleanup() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    console.log('🔄 Real-time Integration Service cleanup complete');
  }
}

// Create singleton instance
const realTimeIntegration = new RealTimeIntegration();

// Middleware for automatic tracking
const trackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track API call on response finish
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    try {
      await realTimeIntegration.trackApiCall({
        userId: req.user?.id || 'anonymous',
        organizationId: req.user?.organizationId || 'system',
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent')
      });
    } catch (error) {
      console.error('Failed to track API call:', error);
    }
  });
  
  next();
};

// Error tracking middleware
const errorTrackingMiddleware = (error, req, res, next) => {
  // Track error
  realTimeIntegration.trackError({
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    errorType: error.name || 'UnknownError',
    message: error.message,
    stack: error.stack,
    endpoint: req.path,
    userAgent: req.get('User-Agent')
  }).catch(console.error);
  
  next(error);
};

module.exports = {
  realTimeIntegration,
  trackingMiddleware,
  errorTrackingMiddleware
};
