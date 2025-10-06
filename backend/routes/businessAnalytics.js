const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard analytics summary
router.get('/dashboard-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .rpc('get_dashboard_analytics', { user_uuid: userId });

    if (error) throw error;

    const analytics = data[0] || {
      monthly_revenue: 0,
      monthly_revenue_change: 0,
      new_clients: 0,
      new_clients_change: 0,
      project_completion_rate: 0,
      project_completion_change: 0,
      avg_project_value: 0,
      avg_project_value_change: 0,
      total_clients: 0,
      active_projects: 0,
      completed_projects: 0
    };

    res.json({
      success: true,
      data: {
        monthlyRevenue: {
          value: parseFloat(analytics.monthly_revenue || 0),
          change: parseFloat(analytics.monthly_revenue_change || 0)
        },
        newClients: {
          value: parseInt(analytics.new_clients || 0),
          change: parseFloat(analytics.new_clients_change || 0)
        },
        projectCompletion: {
          value: parseFloat(analytics.project_completion_rate || 0),
          change: parseFloat(analytics.project_completion_change || 0)
        },
        avgProjectValue: {
          value: parseFloat(analytics.avg_project_value || 0),
          change: parseFloat(analytics.avg_project_value_change || 0)
        },
        summary: {
          totalClients: parseInt(analytics.total_clients || 0),
          activeProjects: parseInt(analytics.active_projects || 0),
          completedProjects: parseInt(analytics.completed_projects || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics'
    });
  }
});

// Get revenue trends
router.get('/revenue-trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .rpc('get_revenue_trends', { user_uuid: userId });

    if (error) throw error;

    const trends = data.map(item => ({
      month: item.month_year,
      revenue: parseFloat(item.revenue || 0),
      invoiceCount: parseInt(item.invoice_count || 0)
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends'
    });
  }
});

// Get client growth trends
router.get('/client-growth', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .rpc('get_client_growth_trends', { user_uuid: userId });

    if (error) throw error;

    const growth = data.map(item => ({
      month: item.month_year,
      newClients: parseInt(item.new_clients || 0),
      totalClients: parseInt(item.total_clients || 0)
    }));

    res.json({
      success: true,
      data: growth
    });
  } catch (error) {
    console.error('Error fetching client growth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client growth'
    });
  }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent projects
    const { data: recentProjects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        value,
        updated_at,
        clients(name)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (projectsError) throw projectsError;

    // Get recent invoices
    const { data: recentInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount,
        status,
        updated_at,
        clients(name)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (invoicesError) throw invoicesError;

    // Get recent clients
    const { data: recentClients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (clientsError) throw clientsError;

    res.json({
      success: true,
      data: {
        projects: recentProjects || [],
        invoices: recentInvoices || [],
        clients: recentClients || []
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

// Create new client
router.post('/clients', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, company, phone, address } = req.body;

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name,
        email,
        company,
        phone,
        address
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time update
    req.app.locals.wsServer?.broadcastAnalyticsUpdate(userId, {
      type: 'client_created',
      data: data
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
});

// Create new project
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { client_id, name, description, value, start_date, end_date } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        client_id,
        name,
        description,
        value,
        start_date,
        end_date,
        status: 'planning'
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time update
    req.app.locals.wsServer?.broadcastAnalyticsUpdate(userId, {
      type: 'project_created',
      data: data
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Update project status
router.patch('/projects/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { status, completion_percentage } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .update({ 
        status, 
        completion_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time update
    req.app.locals.wsServer?.broadcastAnalyticsUpdate(userId, {
      type: 'project_updated',
      data: data
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Create new invoice
router.post('/invoices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { client_id, project_id, invoice_number, amount, due_date } = req.body;

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        client_id,
        project_id,
        invoice_number,
        amount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time update
    req.app.locals.wsServer?.broadcastAnalyticsUpdate(userId, {
      type: 'invoice_created',
      data: data
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
});

// Update invoice status (especially for payments)
router.patch('/invoices/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const { status } = req.body;

    const updateData = { 
      status,
      updated_at: new Date().toISOString()
    };

    // If marking as paid, set paid_date
    if (status === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time update
    req.app.locals.wsServer?.broadcastAnalyticsUpdate(userId, {
      type: 'invoice_updated',
      data: data
    });

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
});

module.exports = router;
