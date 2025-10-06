const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Simple ToolVerse Backend'
  });
});

// Dashboard greeting endpoint
app.get('/api/dashboard/greeting', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user settings (with fallback)
    let settings = null;
    try {
      const { data } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      settings = data;
    } catch (error) {
      console.log('Settings table not available, using defaults');
      settings = {
        greeting_enabled: true,
        show_productivity: true,
        show_projects: true,
        show_clients: true,
        timezone: 'UTC',
        preferred_name: null
      };
    }

    // Get project stats (with fallback)
    let projects = [];
    try {
      const { data } = await supabase
        .from('projects')
        .select('status')
        .eq('user_id', userId);
      projects = data || [];
    } catch (error) {
      console.log('Projects table not available, using empty data');
      projects = [];
    }

    // Get client stats (with fallback)
    let clients = [];
    try {
      const { data } = await supabase
        .from('clients')
        .select('inquiry_status, inquiry_date')
        .eq('user_id', userId);
      clients = data || [];
    } catch (error) {
      console.log('Clients table not available, using empty data');
      clients = [];
    }

    // Calculate summary stats
    const summary = {
      pending_projects: projects?.filter(p => p.status === 'pending').length || 0,
      new_client_inquiries: clients?.filter(c => c.inquiry_status === 'new').length || 0,
      monthly_productivity_percentage: 0,
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
                       req.user?.user_metadata?.full_name || 
                       req.user?.email?.split('@')[0] || 'User';

    // Build response
    const greetingData = {
      user: {
        displayName,
        email: req.user?.email || '',
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

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get projects (with fallback)
    let projects = [];
    try {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5);
      projects = data || [];
    } catch (error) {
      console.log('Projects table not available for stats');
      projects = [];
    }

    // Get clients (with fallback)
    let clients = [];
    try {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('inquiry_date', { ascending: false })
        .limit(5);
      clients = data || [];
    } catch (error) {
      console.log('Clients table not available for stats');
      clients = [];
    }

    // Get productivity metrics (with fallback)
    let productivity = [];
    try {
      const { data } = await supabase
        .from('productivity_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('metric_date', { ascending: false })
        .limit(30);
      productivity = data || [];
    } catch (error) {
      console.log('Productivity metrics table not available');
      productivity = [];
    }

    res.json({
      projects: {
        total_projects: projects?.length || 0,
        pending_projects: projects?.filter(p => p.status === 'pending').length || 0,
        in_progress_projects: projects?.filter(p => p.status === 'in_progress').length || 0,
        completed_projects: projects?.filter(p => p.status === 'completed').length || 0,
        recent: projects || []
      },
      clients: {
        total_clients: clients?.length || 0,
        new_inquiries: clients?.filter(c => c.inquiry_status === 'new').length || 0,
        recent: clients || []
      },
      productivity: {
        trend: productivity || [],
        currentMonthAverage: productivity?.length > 0 
          ? productivity.reduce((sum, day) => sum + (day.productivity_score || 0), 0) / productivity.length
          : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Simple ToolVerse Backend Started!
📍 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
