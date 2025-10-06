/**
 * Advanced Project Management System
 * Real-time collaboration with Python analytics integration
 * Industry-level project tracking and team management
 */

const express = require('express');
const { rateLimits } = require('../middleware/toolSecurity');
const { realAnalyticsIntegration } = require('../services/realAnalyticsIntegration');
const { auditLogManager } = require('./auditLogs');
const { clientManager } = require('./clients');
const router = express.Router();

// Mock project database (replace with real database)
let projects = [
  {
    id: 1,
    name: 'E-commerce Platform Redesign',
    description: 'Complete redesign of the client\'s e-commerce platform with modern UI/UX',
    client_id: 1,
    client_name: 'Acme Corporation',
    status: 'in_progress',
    priority: 'high',
    progress: 65,
    budget: 50000,
    spent: 32500,
    estimated_hours: 400,
    logged_hours: 260,
    start_date: '2024-09-01T00:00:00Z',
    end_date: '2024-12-15T00:00:00Z',
    deadline: '2024-12-15T00:00:00Z',
    created_at: '2024-08-15T10:30:00Z',
    updated_at: '2024-10-03T14:20:00Z',
    created_by: 'john_doe',
    project_manager: 'alice_brown',
    team_members: [
      {
        user_id: 'john_doe',
        name: 'John Doe',
        role: 'Full Stack Developer',
        allocation: 80,
        hourly_rate: 75
      },
      {
        user_id: 'jane_smith',
        name: 'Jane Smith',
        role: 'UI/UX Designer',
        allocation: 60,
        hourly_rate: 65
      },
      {
        user_id: 'bob_wilson',
        name: 'Bob Wilson',
        role: 'Backend Developer',
        allocation: 100,
        hourly_rate: 70
      }
    ],
    tags: ['web-development', 'e-commerce', 'redesign'],
    category: 'Web Development',
    tools_used: ['pdf-merger', 'image-compressor', 'qr-generator'],
    milestones: [
      {
        id: 1,
        name: 'Design Phase Complete',
        description: 'All UI/UX designs approved by client',
        due_date: '2024-10-01T00:00:00Z',
        status: 'completed',
        completion_date: '2024-09-28T00:00:00Z'
      },
      {
        id: 2,
        name: 'Backend Development',
        description: 'API development and database setup',
        due_date: '2024-11-15T00:00:00Z',
        status: 'in_progress',
        completion_date: null
      },
      {
        id: 3,
        name: 'Frontend Integration',
        description: 'Frontend development and API integration',
        due_date: '2024-12-01T00:00:00Z',
        status: 'pending',
        completion_date: null
      }
    ],
    custom_fields: {
      technology_stack: 'React, Node.js, PostgreSQL',
      deployment_environment: 'AWS',
      testing_requirements: 'Unit tests, Integration tests, E2E tests'
    },
    risk_level: 'medium',
    health_score: 78
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    client_id: 2,
    client_name: 'TechStart Inc',
    status: 'planning',
    priority: 'medium',
    progress: 15,
    budget: 25000,
    spent: 3750,
    estimated_hours: 200,
    logged_hours: 30,
    start_date: '2024-10-15T00:00:00Z',
    end_date: '2024-02-28T00:00:00Z',
    deadline: '2024-02-28T00:00:00Z',
    created_at: '2024-09-20T15:45:00Z',
    updated_at: '2024-10-02T11:30:00Z',
    created_by: 'jane_smith',
    project_manager: 'bob_wilson',
    team_members: [
      {
        user_id: 'jane_smith',
        name: 'Jane Smith',
        role: 'Mobile Developer',
        allocation: 100,
        hourly_rate: 80
      }
    ],
    tags: ['mobile-development', 'ios', 'android'],
    category: 'Mobile Development',
    tools_used: ['text-analyzer', 'password-generator'],
    milestones: [
      {
        id: 1,
        name: 'Requirements Gathering',
        description: 'Complete requirements analysis and documentation',
        due_date: '2024-10-30T00:00:00Z',
        status: 'in_progress',
        completion_date: null
      }
    ],
    custom_fields: {
      technology_stack: 'React Native, Firebase',
      deployment_environment: 'App Store, Google Play',
      testing_requirements: 'Device testing, Performance testing'
    },
    risk_level: 'low',
    health_score: 85
  }
];

let projectActivities = [
  {
    id: 1,
    project_id: 1,
    type: 'milestone_completed',
    title: 'Design Phase Completed',
    description: 'All UI/UX designs have been approved by the client',
    created_by: 'jane_smith',
    created_at: '2024-09-28T16:30:00Z',
    metadata: {
      milestone_id: 1,
      milestone_name: 'Design Phase Complete'
    }
  },
  {
    id: 2,
    project_id: 1,
    type: 'time_logged',
    title: 'Development Work',
    description: 'Backend API development - 8 hours logged',
    created_by: 'bob_wilson',
    created_at: '2024-10-01T18:00:00Z',
    metadata: {
      hours: 8,
      task: 'API development',
      billable: true
    }
  }
];

let projectIdCounter = projects.length + 1;
let activityIdCounter = projectActivities.length + 1;
let milestoneIdCounter = 4;

class ProjectManager {
  constructor() {
    this.projects = projects;
    this.activities = projectActivities;
    this.startRealTimeUpdates();
  }

  startRealTimeUpdates() {
    // Update project health scores every 5 minutes
    setInterval(() => {
      this.updateProjectHealthScores();
    }, 5 * 60 * 1000);

    // Check for overdue milestones every hour
    setInterval(() => {
      this.checkOverdueMilestones();
    }, 60 * 60 * 1000);
  }

  updateProjectHealthScores() {
    this.projects.forEach(project => {
      if (project.status === 'completed' || project.status === 'cancelled') return;

      let healthScore = 100;
      const now = new Date();
      const deadline = new Date(project.deadline);
      const startDate = new Date(project.start_date);
      const totalDuration = deadline.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);

      // Progress vs timeline
      if (project.progress < expectedProgress - 20) {
        healthScore -= 30; // Behind schedule
      } else if (project.progress < expectedProgress - 10) {
        healthScore -= 15; // Slightly behind
      }

      // Budget utilization
      const budgetUtilization = (project.spent / project.budget) * 100;
      const progressRatio = project.progress / 100;
      const expectedBudgetUsage = progressRatio * 100;

      if (budgetUtilization > expectedBudgetUsage + 20) {
        healthScore -= 25; // Over budget
      } else if (budgetUtilization > expectedBudgetUsage + 10) {
        healthScore -= 10; // Slightly over budget
      }

      // Overdue milestones
      const overdueMilestones = project.milestones.filter(m => 
        m.status !== 'completed' && new Date(m.due_date) < now
      ).length;
      healthScore -= overdueMilestones * 15;

      // Team allocation
      const totalAllocation = project.team_members.reduce((sum, member) => sum + member.allocation, 0);
      if (totalAllocation < 100) {
        healthScore -= 10; // Under-allocated
      }

      project.health_score = Math.max(0, Math.min(100, healthScore));
      
      // Update risk level based on health score
      if (project.health_score >= 80) {
        project.risk_level = 'low';
      } else if (project.health_score >= 60) {
        project.risk_level = 'medium';
      } else {
        project.risk_level = 'high';
      }
    });

    // Broadcast health score updates
    realTimeIntegration.broadcastToClients('project_health_updated', {
      projects: this.projects.map(p => ({
        id: p.id,
        name: p.name,
        health_score: p.health_score,
        risk_level: p.risk_level
      }))
    });
  }

  checkOverdueMilestones() {
    const now = new Date();
    
    this.projects.forEach(project => {
      project.milestones.forEach(milestone => {
        if (milestone.status !== 'completed' && new Date(milestone.due_date) < now) {
          // Log overdue milestone
          this.addActivity(project.id, {
            type: 'milestone_overdue',
            title: 'Milestone Overdue',
            description: `Milestone "${milestone.name}" is overdue`,
            created_by: 'system',
            metadata: {
              milestone_id: milestone.id,
              milestone_name: milestone.name,
              due_date: milestone.due_date
            }
          });

          // Send alert
          realTimeIntegration.broadcastToClients('milestone_overdue_alert', {
            project_id: project.id,
            project_name: project.name,
            milestone: milestone
          });
        }
      });
    });
  }

  async getAllProjects(filters = {}) {
    let filteredProjects = [...this.projects];

    // Apply filters
    if (filters.status) {
      filteredProjects = filteredProjects.filter(p => p.status === filters.status);
    }

    if (filters.priority) {
      filteredProjects = filteredProjects.filter(p => p.priority === filters.priority);
    }

    if (filters.client_id) {
      filteredProjects = filteredProjects.filter(p => p.client_id === parseInt(filters.client_id));
    }

    if (filters.project_manager) {
      filteredProjects = filteredProjects.filter(p => p.project_manager === filters.project_manager);
    }

    if (filters.category) {
      filteredProjects = filteredProjects.filter(p => 
        p.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.risk_level) {
      filteredProjects = filteredProjects.filter(p => p.risk_level === filters.risk_level);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.client_name.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      filteredProjects = filteredProjects.filter(p =>
        tags.some(tag => p.tags.includes(tag))
      );
    }

    // Sorting
    if (filters.sort_by) {
      const sortField = filters.sort_by;
      const sortOrder = filters.sort_order === 'desc' ? -1 : 1;
      
      filteredProjects.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    return {
      projects: paginatedProjects,
      pagination: {
        current_page: page,
        per_page: limit,
        total_projects: filteredProjects.length,
        total_pages: Math.ceil(filteredProjects.length / limit),
        has_next: endIndex < filteredProjects.length,
        has_prev: page > 1
      }
    };
  }

  async getProjectById(id) {
    const project = this.projects.find(p => p.id === parseInt(id));
    if (!project) return null;

    // Get project activities
    const activities = this.activities
      .filter(a => a.project_id === parseInt(id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate additional metrics
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.milestones.length;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    const budgetUtilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
    const timeUtilization = project.estimated_hours > 0 ? (project.logged_hours / project.estimated_hours) * 100 : 0;

    return {
      ...project,
      activities: activities.slice(0, 20), // Last 20 activities
      total_activities: activities.length,
      metrics: {
        milestone_progress: Math.round(milestoneProgress),
        budget_utilization: Math.round(budgetUtilization * 100) / 100,
        time_utilization: Math.round(timeUtilization * 100) / 100,
        team_size: project.team_members.length,
        tools_count: project.tools_used.length
      }
    };
  }

  async createProject(projectData, userId) {
    const newProject = {
      id: projectIdCounter++,
      name: projectData.name,
      description: projectData.description || '',
      client_id: projectData.client_id,
      client_name: projectData.client_name || 'Unknown Client',
      status: projectData.status || 'planning',
      priority: projectData.priority || 'medium',
      progress: 0,
      budget: projectData.budget || 0,
      spent: 0,
      estimated_hours: projectData.estimated_hours || 0,
      logged_hours: 0,
      start_date: projectData.start_date || new Date().toISOString(),
      end_date: projectData.end_date,
      deadline: projectData.deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      project_manager: projectData.project_manager || userId,
      team_members: projectData.team_members || [],
      tags: projectData.tags || [],
      category: projectData.category || 'General',
      tools_used: [],
      milestones: projectData.milestones || [],
      custom_fields: projectData.custom_fields || {},
      risk_level: 'low',
      health_score: 100
    };

    this.projects.push(newProject);

    // Log activity
    await this.addActivity(newProject.id, {
      type: 'project_created',
      title: 'Project Created',
      description: `Project "${newProject.name}" was created`,
      created_by: userId
    });

    // Track in Python analytics
    await realAnalyticsIntegration.trackEvent({
      event_type: 'project_created',
      user_id: userId,
      organization_id: 'system',
      data: {
        project_id: newProject.id,
        project_name: newProject.name,
        client_id: newProject.client_id,
        budget: newProject.budget,
        estimated_hours: newProject.estimated_hours
      }
    });

    return newProject;
  }

  async updateProject(id, updateData, userId) {
    const projectIndex = this.projects.findIndex(p => p.id === parseInt(id));
    if (projectIndex === -1) return null;

    const oldProject = { ...this.projects[projectIndex] };
    const updatedProject = {
      ...this.projects[projectIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.projects[projectIndex] = updatedProject;

    // Track changes
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (oldProject[key] !== updateData[key]) {
        changes[key] = {
          old: oldProject[key],
          new: updateData[key]
        };
      }
    });

    // Log activity
    await this.addActivity(parseInt(id), {
      type: 'project_updated',
      title: 'Project Updated',
      description: `Project information was updated`,
      created_by: userId,
      metadata: { changes }
    });

    // Broadcast real-time update
    realTimeIntegration.broadcastToClients('project_updated', {
      project_id: parseInt(id),
      project: updatedProject,
      changes
    });

    return updatedProject;
  }

  async addActivity(projectId, activityData) {
    const activity = {
      id: activityIdCounter++,
      project_id: parseInt(projectId),
      type: activityData.type,
      title: activityData.title,
      description: activityData.description,
      created_by: activityData.created_by,
      created_at: new Date().toISOString(),
      metadata: activityData.metadata || {}
    };

    this.activities.unshift(activity);

    // Update project's updated_at timestamp
    const projectIndex = this.projects.findIndex(p => p.id === parseInt(projectId));
    if (projectIndex !== -1) {
      this.projects[projectIndex].updated_at = activity.created_at;
    }

    // Broadcast real-time update
    realTimeIntegration.broadcastToClients('project_activity_added', {
      project_id: parseInt(projectId),
      activity
    });

    return activity;
  }

  async getProjectStats() {
    const total = this.projects.length;
    const active = this.projects.filter(p => ['planning', 'in_progress'].includes(p.status)).length;
    const completed = this.projects.filter(p => p.status === 'completed').length;
    const cancelled = this.projects.filter(p => p.status === 'cancelled').length;

    const statusBreakdown = {
      planning: this.projects.filter(p => p.status === 'planning').length,
      in_progress: this.projects.filter(p => p.status === 'in_progress').length,
      completed: completed,
      cancelled: cancelled,
      on_hold: this.projects.filter(p => p.status === 'on_hold').length
    };

    const priorityBreakdown = {
      high: this.projects.filter(p => p.priority === 'high').length,
      medium: this.projects.filter(p => p.priority === 'medium').length,
      low: this.projects.filter(p => p.priority === 'low').length
    };

    const riskBreakdown = {
      high: this.projects.filter(p => p.risk_level === 'high').length,
      medium: this.projects.filter(p => p.risk_level === 'medium').length,
      low: this.projects.filter(p => p.risk_level === 'low').length
    };

    const totalBudget = this.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = this.projects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const totalHours = this.projects.reduce((sum, p) => sum + (p.logged_hours || 0), 0);
    const avgHealthScore = this.projects.reduce((sum, p) => sum + (p.health_score || 0), 0) / this.projects.length;

    return {
      total_projects: total,
      active_projects: active,
      completed_projects: completed,
      cancelled_projects: cancelled,
      status_breakdown: statusBreakdown,
      priority_breakdown: priorityBreakdown,
      risk_breakdown: riskBreakdown,
      total_budget: totalBudget,
      total_spent: totalSpent,
      budget_utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      total_hours_logged: totalHours,
      average_health_score: Math.round(avgHealthScore),
      total_activities: this.activities.length
    };
  }
}

const projectManager = new ProjectManager();

// Get all projects with filtering and pagination
router.get('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      client_id: req.query.client_id,
      project_manager: req.query.project_manager,
      category: req.query.category,
      risk_level: req.query.risk_level,
      search: req.query.search,
      tags: req.query.tags,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await projectManager.getAllProjects(filters);

    await auditLogManager.log('projects_accessed', {
      category: 'project',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { filters_applied: Object.keys(filters).filter(k => filters[k]) }
    });

    res.json({
      success: true,
      data: result,
      message: 'Projects retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// Get project by ID
router.get('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const project = await projectManager.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    await auditLogManager.log('project_viewed', {
      category: 'project',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'project',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { project_name: project.name }
    });

    res.json({
      success: true,
      data: project,
      message: 'Project retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// Create new project
router.post('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const projectData = req.body;
    const userId = req.user?.id || 'system';

    // Validation
    if (!projectData.name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const newProject = await projectManager.createProject(projectData, userId);

    await auditLogManager.log('project_created', {
      category: 'project',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'project',
      resourceId: newProject.id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { project_name: newProject.name }
    });

    res.status(201).json({
      success: true,
      data: newProject,
      message: 'Project created successfully'
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Update project
router.put('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const updateData = req.body;
    const userId = req.user?.id || 'system';

    const updatedProject = await projectManager.updateProject(req.params.id, updateData, userId);
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    await auditLogManager.log('project_updated', {
      category: 'project',
      severity: 'medium',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'project',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      changes: updateData,
      metadata: { project_name: updatedProject.name }
    });

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Add activity to project
router.post('/:id/activities', rateLimits.apiCalls, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      created_by: req.user?.id || 'system'
    };

    const activity = await projectManager.addActivity(req.params.id, activityData);

    await auditLogManager.log('project_activity_added', {
      category: 'project',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      resourceType: 'project_activity',
      resourceId: activity.id.toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        project_id: req.params.id,
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

// Get project statistics
router.get('/stats/overview', rateLimits.apiCalls, async (req, res) => {
  try {
    const stats = await projectManager.getProjectStats();

    await auditLogManager.log('project_stats_accessed', {
      category: 'project',
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: stats,
      message: 'Project statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project statistics'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Project Management',
    timestamp: new Date().toISOString(),
    total_projects: projectManager.projects.length,
    total_activities: projectManager.activities.length
  });
});

module.exports = {
  router,
  projectManager
};
