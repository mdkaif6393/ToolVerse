/**
 * Comprehensive Audit Logs System
 * Real-time tracking of all system activities
 * Industry-level audit trail with advanced filtering
 */

const express = require('express');
const { rateLimits, auditLogger } = require('../middleware/toolSecurity');
const { realTimeIntegration } = require('../services/realTimeIntegration');
const router = express.Router();

// In-memory storage for demo (replace with database in production)
let auditLogs = [];
let logIdCounter = 1;

// Enhanced audit logging class
class AuditLogManager {
  constructor() {
    this.logs = auditLogs;
    this.maxLogs = 10000; // Keep last 10k logs
    this.categories = {
      SYSTEM: 'system',
      USER: 'user', 
      TOOL: 'tool',
      CLIENT: 'client',
      PROJECT: 'project',
      INVOICE: 'invoice',
      SECURITY: 'security',
      API: 'api'
    };
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  async log(action, details = {}) {
    const logEntry = {
      id: logIdCounter++,
      timestamp: new Date().toISOString(),
      action,
      category: details.category || this.categories.SYSTEM,
      severity: details.severity || this.severityLevels.LOW,
      user_id: details.userId || 'system',
      organization_id: details.organizationId || 'global',
      resource_type: details.resourceType || 'unknown',
      resource_id: details.resourceId || null,
      ip_address: details.ipAddress || '127.0.0.1',
      user_agent: details.userAgent || 'Unknown',
      changes: details.changes || null,
      metadata: {
        session_id: details.sessionId,
        request_id: details.requestId,
        endpoint: details.endpoint,
        method: details.method,
        status_code: details.statusCode,
        response_time: details.responseTime,
        file_size: details.fileSize,
        tool_name: details.toolName,
        client_name: details.clientName,
        project_name: details.projectName,
        invoice_amount: details.invoiceAmount,
        error_message: details.errorMessage,
        stack_trace: details.stackTrace
      }
    };

    // Add to logs array
    this.logs.unshift(logEntry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Send to Python analytics service
    try {
      await realTimeIntegration.trackEvent({
        event_type: 'audit_log',
        user_id: logEntry.user_id,
        organization_id: logEntry.organization_id,
        data: logEntry
      });
    } catch (error) {
      console.error('Failed to send audit log to analytics:', error);
    }

    // Broadcast to real-time clients
    realTimeIntegration.broadcastToClients('audit_log_created', logEntry);

    return logEntry;
  }

  async getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    // Apply filters
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.user_id === filters.userId);
    }

    if (filters.organizationId) {
      filteredLogs = filteredLogs.filter(log => log.organization_id === filters.organizationId);
    }

    if (filters.resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resource_type === filters.resourceType);
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchTerm) ||
        (log.metadata.tool_name && log.metadata.tool_name.toLowerCase().includes(searchTerm)) ||
        (log.metadata.client_name && log.metadata.client_name.toLowerCase().includes(searchTerm)) ||
        (log.metadata.project_name && log.metadata.project_name.toLowerCase().includes(searchTerm))
      );
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      pagination: {
        current_page: page,
        per_page: limit,
        total_logs: filteredLogs.length,
        total_pages: Math.ceil(filteredLogs.length / limit),
        has_next: endIndex < filteredLogs.length,
        has_prev: page > 1
      }
    };
  }

  async getLogStats(organizationId = null) {
    let logs = this.logs;
    
    if (organizationId) {
      logs = logs.filter(log => log.organization_id === organizationId);
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total_logs: logs.length,
      last_24h: logs.filter(log => new Date(log.timestamp) >= last24h).length,
      last_7d: logs.filter(log => new Date(log.timestamp) >= last7d).length,
      last_30d: logs.filter(log => new Date(log.timestamp) >= last30d).length,
      by_category: {},
      by_severity: {},
      by_user: {},
      recent_activities: logs.slice(0, 10),
      top_actions: {}
    };

    // Category breakdown
    Object.values(this.categories).forEach(category => {
      stats.by_category[category] = logs.filter(log => log.category === category).length;
    });

    // Severity breakdown
    Object.values(this.severityLevels).forEach(severity => {
      stats.by_severity[severity] = logs.filter(log => log.severity === severity).length;
    });

    // User activity
    const userCounts = {};
    logs.forEach(log => {
      userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
    });
    stats.by_user = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [user, count]) => ({ ...obj, [user]: count }), {});

    // Top actions
    const actionCounts = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    stats.top_actions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [action, count]) => ({ ...obj, [action]: count }), {});

    return stats;
  }
}

const auditLogManager = new AuditLogManager();

// Middleware to automatically log API requests
const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    // Skip logging for health checks and static assets
    if (req.path.includes('/health') || req.path.includes('/static')) {
      return;
    }

    try {
      await auditLogManager.log('api_request', {
        category: auditLogManager.categories.API,
        severity: res.statusCode >= 400 ? auditLogManager.severityLevels.MEDIUM : auditLogManager.severityLevels.LOW,
        userId: req.user?.id || 'anonymous',
        organizationId: req.user?.organizationId || 'system',
        resourceType: 'api_endpoint',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        sessionId: req.sessionID,
        requestId: req.id
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  });

  next();
};

// Get audit logs with advanced filtering
router.get('/logs', rateLimits.apiCalls, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      severity: req.query.severity,
      userId: req.query.user_id,
      organizationId: req.query.organization_id || req.user?.organizationId,
      resourceType: req.query.resource_type,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await auditLogManager.getLogs(filters);

    await auditLogManager.log('audit_logs_accessed', {
      category: auditLogManager.categories.SYSTEM,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { filters_applied: Object.keys(filters).filter(k => filters[k]) }
    });

    res.json({
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit logs' 
    });
  }
});

// Get audit log statistics
router.get('/stats', rateLimits.apiCalls, async (req, res) => {
  try {
    const organizationId = req.query.organization_id || req.user?.organizationId;
    const stats = await auditLogManager.getLogStats(organizationId);

    await auditLogManager.log('audit_stats_accessed', {
      category: auditLogManager.categories.SYSTEM,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: stats,
      message: 'Audit statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit statistics' 
    });
  }
});

// Get specific audit log by ID
router.get('/logs/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    const log = auditLogManager.logs.find(l => l.id === logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    // Check organization access
    if (req.user?.organizationId && log.organization_id !== req.user.organizationId && log.organization_id !== 'global') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this audit log'
      });
    }

    await auditLogManager.log('audit_log_viewed', {
      category: auditLogManager.categories.SYSTEM,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'audit_log',
      resourceId: logId.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: log,
      message: 'Audit log retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit log' 
    });
  }
});

// Export audit logs (CSV format)
router.get('/export', rateLimits.apiCalls, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      severity: req.query.severity,
      userId: req.query.user_id,
      organizationId: req.query.organization_id || req.user?.organizationId,
      resourceType: req.query.resource_type,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      search: req.query.search
    };

    const result = await auditLogManager.getLogs({ ...filters, limit: 10000 });
    const logs = result.logs;

    // Generate CSV
    const csvHeaders = [
      'ID', 'Timestamp', 'Action', 'Category', 'Severity', 'User ID', 
      'Organization ID', 'Resource Type', 'Resource ID', 'IP Address', 
      'User Agent', 'Changes'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.timestamp,
      log.action,
      log.category,
      log.severity,
      log.user_id,
      log.organization_id,
      log.resource_type,
      log.resource_id || '',
      log.ip_address,
      log.user_agent,
      log.changes ? JSON.stringify(log.changes) : ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    await auditLogManager.log('audit_logs_exported', {
      category: auditLogManager.categories.SYSTEM,
      severity: auditLogManager.severityLevels.MEDIUM,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        exported_count: logs.length,
        filters_applied: Object.keys(filters).filter(k => filters[k])
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export audit logs' 
    });
  }
});

// Clear old audit logs (admin only)
router.delete('/cleanup', rateLimits.apiCalls, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const daysToKeep = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const initialCount = auditLogManager.logs.length;
    auditLogManager.logs = auditLogManager.logs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );
    const removedCount = initialCount - auditLogManager.logs.length;

    await auditLogManager.log('audit_logs_cleanup', {
      category: auditLogManager.categories.SYSTEM,
      severity: auditLogManager.severityLevels.HIGH,
      userId: req.user.id,
      organizationId: req.user.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        days_kept: daysToKeep,
        logs_removed: removedCount,
        logs_remaining: auditLogManager.logs.length
      }
    });

    res.json({
      success: true,
      data: {
        removed_count: removedCount,
        remaining_count: auditLogManager.logs.length,
        cutoff_date: cutoffDate.toISOString()
      },
      message: `Cleaned up ${removedCount} old audit logs`
    });

  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cleanup audit logs' 
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Audit Logs',
    timestamp: new Date().toISOString(),
    total_logs: auditLogManager.logs.length,
    categories: Object.keys(auditLogManager.categories),
    severity_levels: Object.keys(auditLogManager.severityLevels)
  });
});

module.exports = {
  router,
  auditLogManager,
  auditMiddleware
};
