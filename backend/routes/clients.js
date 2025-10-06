/**
 * Comprehensive Client Management System
 * CRM functionality with real-time activity tracking
 * Industry-level client relationship management
 */

const express = require('express');
const { rateLimits } = require('../middleware/toolSecurity');
const { realTimeIntegration } = require('../services/realTimeIntegration');
const { auditLogManager } = require('./auditLogs');
const router = express.Router();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);



class ClientManager {
  constructor() {
    // Real-time database connection
  }

  async getAllClients(filters = {}) {
    try {
      let query = supabase.from('clients').select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.industry) {
        query = query.ilike('industry', `%${filters.industry}%`);
      }

      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }

      // Sorting
      const sortField = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order === 'desc';
      query = query.order(sortField, { ascending: !sortOrder });

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const startIndex = (page - 1) * limit;
      
      query = query.range(startIndex, startIndex + limit - 1);

      const { data: clients, error, count } = await query;
      
      if (error) throw error;

      return {
        clients: clients || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total_clients: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
          has_next: startIndex + limit < (count || 0),
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      return {
        clients: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_clients: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }
      };
    }
  }

  async getClientById(id) {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !client) return null;

      // Get client activities
      const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        ...client,
        activities: activities || [],
        total_activities: activities?.length || 0
      };
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  async createClient(clientData, userId) {
    try {
      const newClient = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone || '',
        company: clientData.company || clientData.name,
        industry: clientData.industry || 'Other',
        status: clientData.status || 'active',
        priority: clientData.priority || 'medium',
        assigned_to: clientData.assigned_to || userId,
        last_contact: null,
        next_followup: clientData.next_followup || null,
        total_value: clientData.total_value || 0,
        projects_count: 0,
        satisfaction_score: 0,
        tags: clientData.tags || [],
        address: clientData.address || {},
        contacts: clientData.contacts || [],
        notes: clientData.notes || '',
        custom_fields: clientData.custom_fields || {},
        user_id: userId
      };

      const { data: client, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.addActivity(client.id, {
        type: 'client_created',
        title: 'Client Created',
        description: `Client ${client.name} was created`,
        created_by: userId
      });

      // Track in analytics
      await realTimeIntegration.trackClientActivity({
        userId,
        organizationId: 'system',
        clientId: client.id,
        activityType: 'client_created',
        details: { client_name: client.name }
      });

      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id, updateData, userId) {
    const clientIndex = this.clients.findIndex(c => c.id === parseInt(id));
    if (clientIndex === -1) return null;

    const oldClient = { ...this.clients[clientIndex] };
    const updatedClient = {
      ...this.clients[clientIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.clients[clientIndex] = updatedClient;

    // Track changes
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (oldClient[key] !== updateData[key]) {
        changes[key] = {
          old: oldClient[key],
          new: updateData[key]
        };
      }
    });

    // Log activity
    await this.addActivity(parseInt(id), {
      type: 'client_updated',
      title: 'Client Updated',
      description: `Client information was updated`,
      created_by: userId,
      metadata: { changes }
    });

    // Track in analytics
    await realTimeIntegration.trackClientActivity({
      userId,
      organizationId: 'system',
      clientId: parseInt(id),
      activityType: 'client_updated',
      details: { changes: Object.keys(changes) }
    });

    return updatedClient;
  }

  async deleteClient(id, userId) {
    const clientIndex = this.clients.findIndex(c => c.id === parseInt(id));
    if (clientIndex === -1) return false;

    const client = this.clients[clientIndex];
    
    // Soft delete - mark as inactive
    this.clients[clientIndex] = {
      ...client,
      status: 'deleted',
      updated_at: new Date().toISOString()
    };

    // Log activity
    await this.addActivity(parseInt(id), {
      type: 'client_deleted',
      title: 'Client Deleted',
      description: `Client ${client.name} was deleted`,
      created_by: userId
    });

    // Track in analytics
    await realTimeIntegration.trackClientActivity({
      userId,
      organizationId: 'system',
      clientId: parseInt(id),
      activityType: 'client_deleted',
      details: { client_name: client.name }
    });

    return true;
  }

  async addActivity(clientId, activityData) {
    const activity = {
      id: activityIdCounter++,
      client_id: parseInt(clientId),
      type: activityData.type,
      title: activityData.title,
      description: activityData.description,
      created_by: activityData.created_by,
      created_at: new Date().toISOString(),
      metadata: activityData.metadata || {}
    };

    this.activities.unshift(activity);

    // Update client's last contact if it's a contact activity
    if (['meeting', 'call', 'email'].includes(activity.type)) {
      const clientIndex = this.clients.findIndex(c => c.id === parseInt(clientId));
      if (clientIndex !== -1) {
        this.clients[clientIndex].last_contact = activity.created_at;
        this.clients[clientIndex].updated_at = activity.created_at;
      }
    }

    // Broadcast real-time update
    realTimeIntegration.broadcastToClients('client_activity_added', {
      client_id: parseInt(clientId),
      activity
    });

    return activity;
  }

  async getClientActivities(clientId, filters = {}) {
    let activities = this.activities.filter(a => a.client_id === parseInt(clientId));

    if (filters.type) {
      activities = activities.filter(a => a.type === filters.type);
    }

    if (filters.created_by) {
      activities = activities.filter(a => a.created_by === filters.created_by);
    }

    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      activities: activities.slice(startIndex, endIndex),
      pagination: {
        current_page: page,
        per_page: limit,
        total_activities: activities.length,
        total_pages: Math.ceil(activities.length / limit)
      }
    };
  }

  async getClientStats() {
    const total = this.clients.length;
    const active = this.clients.filter(c => c.status === 'active').length;
    const inactive = this.clients.filter(c => c.status === 'inactive').length;
    const deleted = this.clients.filter(c => c.status === 'deleted').length;

    const priorityBreakdown = {
      high: this.clients.filter(c => c.priority === 'high').length,
      medium: this.clients.filter(c => c.priority === 'medium').length,
      low: this.clients.filter(c => c.priority === 'low').length
    };

    const industryBreakdown = {};
    this.clients.forEach(client => {
      industryBreakdown[client.industry] = (industryBreakdown[client.industry] || 0) + 1;
    });

    const totalValue = this.clients.reduce((sum, client) => sum + (client.total_value || 0), 0);
    const avgSatisfaction = this.clients.reduce((sum, client) => sum + (client.satisfaction_score || 0), 0) / this.clients.length;

    return {
      total_clients: total,
      active_clients: active,
      inactive_clients: inactive,
      deleted_clients: deleted,
      priority_breakdown: priorityBreakdown,
      industry_breakdown: industryBreakdown,
      total_value: totalValue,
      average_satisfaction: Math.round(avgSatisfaction * 10) / 10,
      total_activities: this.activities.length
    };
  }
}

const clientManager = new ClientManager();

// Get all clients with filtering and pagination
router.get('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      industry: req.query.industry,
      assigned_to: req.query.assigned_to,
      search: req.query.search,
      tags: req.query.tags,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await clientManager.getAllClients(filters);

    await auditLogManager.log('clients_accessed', {
      category: 'client',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { filters_applied: Object.keys(filters).filter(k => filters[k]) }
    });

    res.json({
      success: true,
      data: result,
      message: 'Clients retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

// Get client by ID
router.get('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const client = await clientManager.getClientById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    await auditLogManager.log('client_viewed', {
      category: 'client',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'client',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { client_name: client.name }
    });

    res.json({
      success: true,
      data: client,
      message: 'Client retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    });
  }
});

// Create new client
router.post('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const clientData = req.body;
    const userId = req.user?.id || 'system';

    // Validation
    if (!clientData.name || !clientData.email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const newClient = await clientManager.createClient(clientData, userId);

    await auditLogManager.log('client_created', {
      category: 'client',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'client',
      resourceId: newClient.id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { client_name: newClient.name }
    });

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Client created successfully'
    });

  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
});

// Update client
router.put('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user?.id || 'system';

    const updatedClient = await clientManager.updateClient(req.params.id, updateData, userId);
    
    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    await auditLogManager.log('client_updated', {
      category: 'client',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'client',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: updateData,
      metadata: { client_name: updatedClient.name }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully'
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update client'
    });
  }
});

// Delete client
router.delete('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const userId = req.user?.id || 'system';
    const success = await clientManager.deleteClient(req.params.id, userId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    await auditLogManager.log('client_deleted', {
      category: 'client',
      severity: 'high',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'client',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client'
    });
  }
});

// Add activity to client
router.post('/:id/activities', rateLimits.apiCalls, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      created_by: req.user?.id || 'system'
    };

    const activity = await clientManager.addActivity(req.params.id, activityData);

    await auditLogManager.log('client_activity_added', {
      category: 'client',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'client_activity',
      resourceId: activity.id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        client_id: req.params.id,
        activity_type: activity.type,
        activity_title: activity.title
      }
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity added successfully'
    });

  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add activity'
    });
  }
});

// Get client activities
router.get('/:id/activities', rateLimits.apiCalls, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      created_by: req.query.created_by,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await clientManager.getClientActivities(req.params.id, filters);

    res.json({
      success: true,
      data: result,
      message: 'Client activities retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching client activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client activities'
    });
  }
});

// Get client statistics
router.get('/stats/overview', rateLimits.apiCalls, async (req, res) => {
  try {
    const stats = await clientManager.getClientStats();

    await auditLogManager.log('client_stats_accessed', {
      category: 'client',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: stats,
      message: 'Client statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client statistics'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Client Management',
    timestamp: new Date().toISOString(),
    total_clients: clientManager.clients.length,
    total_activities: clientManager.activities.length
  });
});

module.exports = {
  router,
  clientManager
};
