const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// DASHBOARD GREETING ROUTES
// ============================================================================

// GET /api/dashboard/greeting - Get personalized dashboard greeting data
router.get('/greeting', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    // Get user profile information
    const { data: userProfile, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get dashboard settings
    const { data: settings } = await supabaseAdmin
      .from('user_dashboard_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get project stats
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('status')
      .eq('user_id', userId);

    // Get client stats
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('inquiry_status, inquiry_date')
      .eq('user_id', userId);

    // Calculate summary stats
    const summary = {
      pending_projects: projects?.filter(p => p.status === 'pending').length || 0,
      new_client_inquiries: clients?.filter(c => c.inquiry_status === 'new').length || 0,
      monthly_productivity_percentage: 0, // Will be calculated from productivity_metrics
      total_projects: projects?.length || 0,
      total_clients: clients?.length || 0,
      completed_projects_this_month: projects?.filter(p => p.status === 'completed').length || 0
    };

    // Generate time-based greeting
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay;
    
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 17) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    // Determine display name
    const displayName = settings?.preferred_name || 
                       userProfile.user?.user_metadata?.full_name || 
                       userProfile.user?.email?.split('@')[0] || 'User';

    // Build response
    const greetingData = {
      user: {
        displayName,
        email: userProfile.user?.email || '',
        settings: {
          greetingEnabled: settings?.greeting_enabled ?? true,
          showProductivity: settings?.show_productivity ?? true,
          showProjects: settings?.show_projects ?? true,
          showClients: settings?.show_clients ?? true,
          timezone: settings?.timezone || 'UTC'
        }
      },
      greeting: {
        timeOfDay,
        message: `Good ${timeOfDay}, ${displayName}! 👋`
      },
      stats: {
        pendingProjects: summary.pending_projects,
        newClientInquiries: summary.new_client_inquiries,
        monthlyProductivityPercentage: summary.monthly_productivity_percentage,
        totalProjects: summary.total_projects,
        totalClients: summary.total_clients,
        completedProjectsThisMonth: summary.completed_projects_this_month
      },
      timestamp: now.toISOString()
    };

    res.json(greetingData);
  } catch (error) {
    console.error('Dashboard greeting error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard greeting data' });
  }
});

// GET /api/dashboard/stats - Get detailed dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get detailed project statistics
    const projectStats = await db.getOne(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_projects,
        AVG(progress_percentage) as average_progress
      FROM public.projects
      WHERE user_id = $1
    `, [userId]);

    // Get detailed client statistics
    const clientStats = await db.getOne(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN inquiry_status = 'new' THEN 1 END) as new_inquiries,
        COUNT(CASE WHEN inquiry_status = 'contacted' THEN 1 END) as contacted_clients,
        COUNT(CASE WHEN inquiry_status = 'qualified' THEN 1 END) as qualified_clients,
        COUNT(CASE WHEN inquiry_status = 'converted' THEN 1 END) as converted_clients,
        COUNT(CASE WHEN inquiry_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as inquiries_this_week,
        COUNT(CASE WHEN inquiry_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as inquiries_this_month
      FROM public.clients
      WHERE user_id = $1
    `, [userId]);

    // Get productivity trends (last 30 days)
    const productivityTrend = await db.getMany(`
      SELECT 
        metric_date,
        productivity_score,
        tasks_completed,
        tasks_planned,
        hours_worked,
        hours_planned
      FROM public.productivity_metrics
      WHERE user_id = $1 
        AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY metric_date DESC
      LIMIT 30
    `, [userId]);

    // Get recent activity
    const recentProjects = await db.getMany(`
      SELECT 
        id,
        name,
        status,
        priority,
        progress_percentage,
        due_date,
        updated_at
      FROM public.projects
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 5
    `, [userId]);

    const recentClients = await db.getMany(`
      SELECT 
        id,
        name,
        company,
        inquiry_status,
        inquiry_date,
        last_contact_date
      FROM public.clients
      WHERE user_id = $1
      ORDER BY inquiry_date DESC
      LIMIT 5
    `, [userId]);

    res.json({
      projects: {
        ...projectStats,
        recent: recentProjects
      },
      clients: {
        ...clientStats,
        recent: recentClients
      },
      productivity: {
        trend: productivityTrend,
        currentMonthAverage: productivityTrend.length > 0 
          ? productivityTrend.reduce((sum, day) => sum + (day.productivity_score || 0), 0) / productivityTrend.length
          : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// POST /api/dashboard/settings - Update dashboard settings
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      greetingEnabled, 
      showProductivity, 
      showProjects, 
      showClients, 
      timezone, 
      preferredName 
    } = req.body;

    // Upsert dashboard settings
    const settings = await db.query(`
      INSERT INTO public.user_dashboard_settings (
        user_id, greeting_enabled, show_productivity, show_projects, 
        show_clients, timezone, preferred_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        greeting_enabled = EXCLUDED.greeting_enabled,
        show_productivity = EXCLUDED.show_productivity,
        show_projects = EXCLUDED.show_projects,
        show_clients = EXCLUDED.show_clients,
        timezone = EXCLUDED.timezone,
        preferred_name = EXCLUDED.preferred_name,
        updated_at = NOW()
      RETURNING *
    `, [userId, greetingEnabled, showProductivity, showProjects, showClients, timezone, preferredName]);

    res.json({
      message: 'Dashboard settings updated successfully',
      settings: settings.rows[0]
    });
  } catch (error) {
    console.error('Dashboard settings update error:', error);
    res.status(500).json({ error: 'Failed to update dashboard settings' });
  }
});

// POST /api/dashboard/sample-data - Create sample data for new users
router.post('/sample-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Call the database function to create sample data
    await db.query(`SELECT create_sample_dashboard_data($1)`, [userId]);

    res.json({
      message: 'Sample dashboard data created successfully'
    });
  } catch (error) {
    console.error('Sample data creation error:', error);
    res.status(500).json({ error: 'Failed to create sample data' });
  }
});

// POST /api/dashboard/productivity - Add daily productivity metrics
router.post('/productivity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      metricDate = new Date().toISOString().split('T')[0],
      tasksCompleted = 0,
      tasksPlanned = 0,
      hoursWorked = 0,
      hoursPlanned = 0,
      focusTimeMinutes = 0,
      breakTimeMinutes = 0,
      meetingsCount = 0
    } = req.body;

    // Calculate productivity score
    const productivityScore = tasksPlanned > 0 
      ? Math.round((tasksCompleted / tasksPlanned) * 100)
      : 0;

    // Upsert productivity metrics
    const metrics = await db.query(`
      INSERT INTO public.productivity_metrics (
        user_id, metric_date, tasks_completed, tasks_planned, 
        hours_worked, hours_planned, productivity_score,
        focus_time_minutes, break_time_minutes, meetings_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, metric_date)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_planned = EXCLUDED.tasks_planned,
        hours_worked = EXCLUDED.hours_worked,
        hours_planned = EXCLUDED.hours_planned,
        productivity_score = EXCLUDED.productivity_score,
        focus_time_minutes = EXCLUDED.focus_time_minutes,
        break_time_minutes = EXCLUDED.break_time_minutes,
        meetings_count = EXCLUDED.meetings_count,
        updated_at = NOW()
      RETURNING *
    `, [userId, metricDate, tasksCompleted, tasksPlanned, hoursWorked, hoursPlanned, 
        productivityScore, focusTimeMinutes, breakTimeMinutes, meetingsCount]);

    res.json({
      message: 'Productivity metrics updated successfully',
      metrics: metrics.rows[0]
    });
  } catch (error) {
    console.error('Productivity metrics error:', error);
    res.status(500).json({ error: 'Failed to update productivity metrics' });
  }
});

module.exports = router;
