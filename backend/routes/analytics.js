/**
 * Advanced Analytics Dashboard Backend
 * Real-time metrics and business intelligence
 * Integration with database for live analytics
 */

const express = require('express');
const { rateLimits } = require('../middleware/toolSecurity');
const { auditLogManager } = require('./auditLogs');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

// GET /api/analytics/summary - Returns all top card data
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total revenue (sum of paid invoices)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('amount, paid')
      .eq('user_id', userId);
    
    if (invoicesError) throw new Error(invoicesError.message);
    
    // Get clients data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, created_at')
      .eq('user_id', userId);
    
    if (clientsError) throw new Error(clientsError.message);
    
    // Get projects data
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, value, status, created_at, completed_at')
      .eq('user_id', userId);
    
    if (projectsError) throw new Error(projectsError.message);
    
    // Calculate metrics
    const totalRevenue = invoices
      .filter(invoice => invoice.paid)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    
    const newClients = clients.filter(client => 
      new Date(client.created_at) >= oneMonthAgo
    ).length;
    
    const completedProjects = projects.filter(project => project.status === 'completed').length;
    const totalProjects = projects.length;
    const projectCompletion = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    
    const projectValues = projects.map(project => project.value || 0);
    const avgProjectValue = projectValues.length > 0 
      ? projectValues.reduce((sum, value) => sum + value, 0) / projectValues.length 
      : 0;
    
    // Calculate month-over-month changes (using dummy data for now)
    // In a real implementation, you would compare with previous month's data
    const monthlyRevenue = {
      value: totalRevenue,
      change: 12.5 // Placeholder
    };
    
    const clientsChange = {
      value: newClients,
      change: 8.2 // Placeholder
    };
    
    const projectCompletionChange = {
      value: projectCompletion,
      change: 5.1 // Placeholder
    };
    
    const avgProjectValueChange = {
      value: avgProjectValue,
      change: -2.3 // Placeholder
    };
    
    const summary = {
      totalClients: clients.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      completedProjects
    };
    
    res.json({
      success: true,
      data: {
        monthlyRevenue,
        newClients: clientsChange,
        projectCompletion: projectCompletionChange,
        avgProjectValue: avgProjectValueChange,
        summary
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics data' 
    });
  }
});

// GET /api/analytics/revenue-trends - Returns time-based revenue data
router.get('/revenue-trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get invoices for the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('amount, created_at, paid')
      .eq('user_id', userId)
      .gte('created_at', twelveMonthsAgo.toISOString());
    
    if (invoicesError) throw new Error(invoicesError.message);
    
    // Group invoices by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          invoiceCount: 0
        };
      }
      
      if (invoice.paid) {
        monthlyData[monthKey].revenue += invoice.amount;
      }
      monthlyData[monthKey].invoiceCount += 1;
    });
    
    // Convert to array and sort by date
    const revenueTrends = Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
    
    res.json({
      success: true,
      data: revenueTrends
    });
    
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch revenue trends' 
    });
  }
});

// GET /api/analytics/client-growth - Returns client growth data
router.get('/client-growth', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get clients for the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', twelveMonthsAgo.toISOString());
    
    if (clientsError) throw new Error(clientsError.message);
    
    // Group clients by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with zero
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      monthlyData[monthKey] = {
        month: monthKey,
        newClients: 0,
        totalClients: 0
      };
    }
    
    // Count new clients per month
    clients.forEach(client => {
      const date = new Date(client.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].newClients += 1;
      }
    });
    
    // Calculate running total
    let runningTotal = 0;
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.split(' ');
      const [bMonth, bYear] = b.split(' ');
      
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
    
    sortedMonths.forEach(month => {
      runningTotal += monthlyData[month].newClients;
      monthlyData[month].totalClients = runningTotal;
    });
    
    // Convert to array
    const clientGrowth = sortedMonths.map(month => monthlyData[month]);
    
    res.json({
      success: true,
      data: clientGrowth
    });
    
  } catch (error) {
    console.error('Error fetching client growth:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch client growth data' 
    });
  }
});

// GET /api/analytics/recent-activity - Returns recent changes
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 5; // Number of recent items to fetch
    
    // Get recent projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status, value, updated_at, client_id, clients(name)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (projectsError) throw new Error(projectsError.message);
    
    // Get recent invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, updated_at, client_id, clients(name)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (invoicesError) throw new Error(invoicesError.message);
    
    // Get recent clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (clientsError) throw new Error(clientsError.message);
    
    res.json({
      success: true,
      data: {
        projects,
        invoices,
        clients
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent activity' 
    });
  }
});

// Function to send real-time analytics updates
const sendAnalyticsUpdate = () => {
  try {
    // Send real-time analytics updates to connected clients
    global.wss?.clients?.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({
          type: 'analytics_update',
          timestamp: new Date().toISOString(),
          message: 'Analytics data updated'
        }));
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending analytics update:', error);
    return { success: false, error: error.message };
  }
};

module.exports = router;
      mrr_trend: await this.getTimeSeriesData('mrr', '12m', organizationId),
      churn_analysis: {
        monthly_churn: analyticsData.revenue.churn_rate,
        churn_reasons: {
          'Price': 35,
          'Features': 25,
          'Support': 20,
          'Competition': 15,
          'Other': 5
        }
      },
      ltv_cac_ratio: analyticsData.revenue.ltv / analyticsData.revenue.cac
    };
  }
}

const analyticsManager = new AnalyticsManager();

// Get overview dashboard metrics
router.get('/overview', rateLimits.apiCalls, async (req, res) => {
  try {
    const organizationId = req.query.organization_id || req.user?.organizationId;
    const metrics = await analyticsManager.getOverviewMetrics(organizationId);

    await auditLogManager.log('analytics_overview_accessed', {
      category: 'system',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: metrics,
      message: 'Overview metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview metrics'
    });
  }
});

// Get time series data
router.get('/timeseries/:metric', rateLimits.apiCalls, async (req, res) => {
  try {
    const { metric } = req.params;
    const period = req.query.period || '7d';
    const organizationId = req.query.organization_id || req.user?.organizationId;

    const data = await analyticsManager.getTimeSeriesData(metric, period, organizationId);

    res.json({
      success: true,
      data: {
        metric,
        period,
        data_points: data
      },
      message: 'Time series data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time series data'
    });
  }
});

// Get tool analytics
router.get('/tools', rateLimits.apiCalls, async (req, res) => {
  try {
    const organizationId = req.query.organization_id || req.user?.organizationId;
    const analytics = await analyticsManager.getToolAnalytics(organizationId);

    res.json({
      success: true,
      data: analytics,
      message: 'Tool analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching tool analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool analytics'
    });
  }
});

// Get user analytics
router.get('/users', rateLimits.apiCalls, async (req, res) => {
  try {
    const organizationId = req.query.organization_id || req.user?.organizationId;
    const analytics = await analyticsManager.getUserAnalytics(organizationId);

    res.json({
      success: true,
      data: analytics,
      message: 'User analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

// Get revenue analytics
router.get('/revenue', rateLimits.apiCalls, async (req, res) => {
  try {
    const organizationId = req.query.organization_id || req.user?.organizationId;
    const analytics = await analyticsManager.getRevenueAnalytics(organizationId);

    res.json({
      success: true,
      data: analytics,
      message: 'Revenue analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

// Get real-time metrics
router.get('/realtime', rateLimits.apiCalls, async (req, res) => {
  try {
    const realTimeMetrics = {
      active_users: analyticsData.users.active_today,
      tool_executions_today: analyticsData.tools.executions_today,
      revenue_today: analyticsData.revenue.today,
      system_health: {
        cpu_usage: analyticsData.system.cpu_usage,
        memory_usage: analyticsData.system.memory_usage,
        active_connections: analyticsData.system.active_connections,
        uptime: analyticsData.system.uptime
      },
      recent_activities: await auditLogManager.getLogs({ limit: 10 }),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: realTimeMetrics,
      message: 'Real-time metrics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics'
    });
  }
});

// Export analytics data
router.get('/export', rateLimits.apiCalls, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const organizationId = req.query.organization_id || req.user?.organizationId;
    
    const exportData = {
      overview: await analyticsManager.getOverviewMetrics(organizationId),
      tools: await analyticsManager.getToolAnalytics(organizationId),
      users: await analyticsManager.getUserAnalytics(organizationId),
      revenue: await analyticsManager.getRevenueAnalytics(organizationId),
      exported_at: new Date().toISOString(),
      organization_id: organizationId
    };

    await auditLogManager.log('analytics_data_exported', {
      category: 'system',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { export_format: format }
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Analytics',
    timestamp: new Date().toISOString(),
    cache_size: analyticsManager.cache.size,
    python_service_connected: realTimeIntegration.isConnected
  });
});

function convertToCSV(data) {
  // Simple CSV conversion for overview metrics
  const rows = [
    ['Metric', 'Value', 'Category'],
    ['Total Users', data.overview.users.total, 'Users'],
    ['Active Today', data.overview.users.active_today, 'Users'],
    ['Total Executions', data.overview.tools.total_executions, 'Tools'],
    ['Success Rate', data.overview.tools.success_rate + '%', 'Tools'],
    ['Total Revenue', '$' + data.overview.revenue.total, 'Revenue'],
    ['MRR', '$' + data.overview.revenue.mrr, 'Revenue'],
    ['System Uptime', data.overview.system.uptime + '%', 'System']
  ];

  return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

module.exports = {
  router,
  analyticsManager
};
