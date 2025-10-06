/**
 * Real Analytics Integration Service
 * Connects Node.js backend with Python analytics service
 * Real-time data tracking and processing
 */

const axios = require('axios');
const WebSocket = require('ws');

class RealAnalyticsIntegration {
  constructor() {
    this.analyticsApiUrl = 'http://localhost:8001';
    this.websocketUrl = 'ws://localhost:8001/ws';
    this.websocket = null;
    this.isConnected = false;
    this.eventQueue = [];
    this.retryCount = 0;
    this.maxRetries = 5;
    
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      // Test API connection
      await this.testConnection();
      
      // Initialize WebSocket
      this.connectWebSocket();
      
      console.log('✅ Real Analytics Integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize analytics integration:', error.message);
      this.scheduleRetry();
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.analyticsApiUrl}/api/health`, {
        timeout: 5000
      });
      
      if (response.data.status === 'healthy') {
        console.log('✅ Analytics service is healthy');
        this.retryCount = 0;
        return true;
      }
      throw new Error('Analytics service not healthy');
    } catch (error) {
      throw new Error(`Analytics service connection failed: ${error.message}`);
    }
  }

  connectWebSocket() {
    try {
      this.websocket = new WebSocket(this.websocketUrl);
      
      this.websocket.on('open', () => {
        console.log('✅ WebSocket connected to analytics service');
        this.isConnected = true;
        this.processEventQueue();
      });
      
      this.websocket.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.websocket.on('close', () => {
        console.log('⚠️ WebSocket connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });
      
      this.websocket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      });
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  handleWebSocketMessage(message) {
    // Handle real-time analytics updates
    switch (message.type) {
      case 'metrics_update':
        this.broadcastMetricsUpdate(message.data);
        break;
      case 'tool_usage':
        this.broadcastToolUsage(message.data);
        break;
      case 'initial_metrics':
        console.log('📊 Received initial metrics from analytics service');
        break;
      default:
        console.log('📨 Received analytics message:', message.type);
    }
  }

  broadcastMetricsUpdate(metrics) {
    // Broadcast to connected clients (implement your WebSocket broadcasting here)
    console.log('📊 Broadcasting metrics update:', {
      active_users: metrics.active_users,
      api_calls_per_minute: metrics.api_calls_per_minute,
      system_health: metrics.system_health
    });
  }

  broadcastToolUsage(usage) {
    console.log('🔧 Broadcasting tool usage:', usage.tool_name);
  }

  scheduleReconnect() {
    if (this.retryCount < this.maxRetries) {
      const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
      console.log(`🔄 Reconnecting to analytics service in ${delay}ms (attempt ${this.retryCount + 1})`);
      
      setTimeout(() => {
        this.retryCount++;
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('❌ Max retries reached. Analytics integration disabled.');
    }
  }

  scheduleRetry() {
    if (this.retryCount < this.maxRetries) {
      const delay = Math.pow(2, this.retryCount) * 2000;
      console.log(`🔄 Retrying analytics initialization in ${delay}ms`);
      
      setTimeout(() => {
        this.retryCount++;
        this.initializeConnection();
      }, delay);
    }
  }

  async processEventQueue() {
    if (this.eventQueue.length > 0) {
      console.log(`📤 Processing ${this.eventQueue.length} queued events`);
      
      for (const event of this.eventQueue) {
        try {
          await this.sendEvent(event);
        } catch (error) {
          console.error('Failed to send queued event:', error);
        }
      }
      
      this.eventQueue = [];
    }
  }

  async trackEvent(eventData) {
    const event = {
      event_type: eventData.event_type,
      user_id: eventData.user_id,
      organization_id: eventData.organization_id,
      data: eventData.data || {},
      ip_address: eventData.ip_address,
      user_agent: eventData.user_agent,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.error('Failed to send event, adding to queue:', error);
        this.eventQueue.push(event);
      }
    } else {
      this.eventQueue.push(event);
      console.log(`📥 Event queued (${this.eventQueue.length} total)`);
    }
  }

  async sendEvent(event) {
    try {
      const response = await axios.post(`${this.analyticsApiUrl}/api/events`, event, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Event tracked: ${event.event_type}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Analytics service not available');
      }
      throw error;
    }
  }

  async trackToolUsage(usageData) {
    const usage = {
      tool_id: usageData.tool_id,
      tool_name: usageData.tool_name,
      user_id: usageData.user_id,
      usage_type: usageData.usage_type || 'execution',
      execution_time_ms: usageData.execution_time_ms,
      success: usageData.success !== false,
      error_message: usageData.error_message
    };

    try {
      const response = await axios.post(`${this.analyticsApiUrl}/api/tool-usage`, usage, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Tool usage tracked: ${usage.tool_name}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to track tool usage:', error.message);
      
      // Track as event if tool usage endpoint fails
      await this.trackEvent({
        event_type: 'tool_usage_fallback',
        user_id: usage.user_id,
        data: usage
      });
    }
  }

  async getDashboardAnalytics() {
    try {
      const response = await axios.get(`${this.analyticsApiUrl}/api/analytics/dashboard`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to get analytics data');
    } catch (error) {
      console.error('Failed to get dashboard analytics:', error.message);
      
      // Return mock data as fallback
      return this.getMockAnalytics();
    }
  }

  async getToolAnalytics(toolId) {
    try {
      const response = await axios.get(`${this.analyticsApiUrl}/api/analytics/tools/${toolId}`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to get tool analytics');
    } catch (error) {
      console.error(`Failed to get analytics for tool ${toolId}:`, error.message);
      
      return {
        tool_id: toolId,
        usage_count: 0,
        success_rate: 0,
        avg_execution_time: 0,
        trends: []
      };
    }
  }

  getMockAnalytics() {
    // Fallback mock data when analytics service is unavailable
    return {
      real_time_metrics: {
        timestamp: new Date().toISOString(),
        active_users: 0,
        api_calls_per_minute: 0,
        error_rate: 0,
        cpu_usage: 0,
        memory_usage: 0,
        tools_used_last_hour: 0,
        estimated_revenue_today: 0,
        total_events_last_hour: 0,
        system_health: "unknown"
      },
      summary: {
        total_users: 0,
        total_events: 0,
        total_tool_usage: 0,
        avg_response_time: 0
      },
      tool_stats: {},
      daily_trends: [],
      user_activity: {
        total_users: 0,
        avg_events_per_user: 0,
        most_active_users: {}
      },
      system_health: "unknown"
    };
  }

  // Convenience methods for common events
  async trackUserLogin(userId, organizationId, ipAddress, userAgent) {
    return this.trackEvent({
      event_type: 'user_login',
      user_id: userId,
      organization_id: organizationId,
      ip_address: ipAddress,
      user_agent: userAgent,
      data: { login_time: new Date().toISOString() }
    });
  }

  async trackToolExecution(toolId, toolName, userId, executionTime, success, errorMessage) {
    return this.trackToolUsage({
      tool_id: toolId,
      tool_name: toolName,
      user_id: userId,
      usage_type: 'execution',
      execution_time_ms: executionTime,
      success: success,
      error_message: errorMessage
    });
  }

  async trackApiCall(endpoint, userId, responseTime, statusCode) {
    return this.trackEvent({
      event_type: 'api_call',
      user_id: userId,
      data: {
        endpoint: endpoint,
        response_time_ms: responseTime,
        status_code: statusCode,
        timestamp: new Date().toISOString()
      }
    });
  }

  async trackError(errorType, errorMessage, userId, context) {
    return this.trackEvent({
      event_type: 'error_occurred',
      user_id: userId,
      data: {
        error_type: errorType,
        error_message: errorMessage,
        context: context,
        timestamp: new Date().toISOString()
      }
    });
  }

  async trackPayment(userId, organizationId, amount, currency, paymentMethod, transactionId) {
    return this.trackEvent({
      event_type: 'payment_processed',
      user_id: userId,
      organization_id: organizationId,
      data: {
        amount: amount,
        currency: currency,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Health check
  async getHealthStatus() {
    try {
      const response = await axios.get(`${this.analyticsApiUrl}/api/health`, {
        timeout: 3000
      });
      
      return {
        analytics_service: response.data.status,
        websocket_connected: this.isConnected,
        queued_events: this.eventQueue.length,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        analytics_service: 'unavailable',
        websocket_connected: false,
        queued_events: this.eventQueue.length,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  // Cleanup
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    console.log('🔌 Analytics integration disconnected');
  }
}

// Create singleton instance
const realAnalyticsIntegration = new RealAnalyticsIntegration();

module.exports = {
  realAnalyticsIntegration,
  RealAnalyticsIntegration
};
