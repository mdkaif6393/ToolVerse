const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeDashboard() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Initializing dashboard database...');
    
    // Check if the update_updated_at function exists, create if not
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create users table if it doesn't exist (for standalone testing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    
    // Run the dashboard schema migration
    const dashboardSchema = `
      -- Create clients table
      CREATE TABLE IF NOT EXISTS public.clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        address TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'former')),
        inquiry_status TEXT DEFAULT 'new' CHECK (inquiry_status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
        inquiry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_contact_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create projects table
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        start_date DATE,
        due_date DATE,
        completion_date DATE,
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        budget DECIMAL(10, 2),
        actual_cost DECIMAL(10, 2),
        client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create productivity_metrics table
      CREATE TABLE IF NOT EXISTS public.productivity_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        metric_date DATE NOT NULL,
        tasks_completed INTEGER DEFAULT 0,
        tasks_planned INTEGER DEFAULT 0,
        hours_worked DECIMAL(4, 2) DEFAULT 0,
        hours_planned DECIMAL(4, 2) DEFAULT 0,
        productivity_score DECIMAL(5, 2) DEFAULT 0,
        focus_time_minutes INTEGER DEFAULT 0,
        break_time_minutes INTEGER DEFAULT 0,
        meetings_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, metric_date)
      );

      -- Create user_dashboard_settings table
      CREATE TABLE IF NOT EXISTS public.user_dashboard_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        greeting_enabled BOOLEAN DEFAULT true,
        show_productivity BOOLEAN DEFAULT true,
        show_projects BOOLEAN DEFAULT true,
        show_clients BOOLEAN DEFAULT true,
        timezone TEXT DEFAULT 'UTC',
        preferred_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
      CREATE INDEX IF NOT EXISTS idx_clients_inquiry_status ON public.clients(inquiry_status);
      CREATE INDEX IF NOT EXISTS idx_productivity_metrics_user_id ON public.productivity_metrics(user_id);
      CREATE INDEX IF NOT EXISTS idx_productivity_metrics_date ON public.productivity_metrics(metric_date DESC);

      -- Create triggers
      DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON public.projects
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

      DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
      CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

      DROP TRIGGER IF EXISTS update_productivity_metrics_updated_at ON public.productivity_metrics;
      CREATE TRIGGER update_productivity_metrics_updated_at
        BEFORE UPDATE ON public.productivity_metrics
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

      DROP TRIGGER IF EXISTS update_user_dashboard_settings_updated_at ON public.user_dashboard_settings;
      CREATE TRIGGER update_user_dashboard_settings_updated_at
        BEFORE UPDATE ON public.user_dashboard_settings
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    `;
    
    await client.query(dashboardSchema);
    
    // Create dashboard functions
    await client.query(`
      CREATE OR REPLACE FUNCTION get_monthly_productivity_percentage(p_user_id UUID, p_month DATE DEFAULT CURRENT_DATE)
      RETURNS DECIMAL(5,2) AS $$
      DECLARE
        current_month_avg DECIMAL(5,2);
        previous_month_avg DECIMAL(5,2);
        percentage_change DECIMAL(5,2);
      BEGIN
        SELECT COALESCE(AVG(productivity_score), 0)
        INTO current_month_avg
        FROM public.productivity_metrics
        WHERE user_id = p_user_id
          AND DATE_TRUNC('month', metric_date) = DATE_TRUNC('month', p_month);

        SELECT COALESCE(AVG(productivity_score), 0)
        INTO previous_month_avg
        FROM public.productivity_metrics
        WHERE user_id = p_user_id
          AND DATE_TRUNC('month', metric_date) = DATE_TRUNC('month', p_month - INTERVAL '1 month');

        IF previous_month_avg > 0 THEN
          percentage_change := ((current_month_avg - previous_month_avg) / previous_month_avg) * 100;
        ELSE
          percentage_change := current_month_avg;
        END IF;

        RETURN ROUND(percentage_change, 2);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
      RETURNS JSON AS $$
      DECLARE
        result JSON;
      BEGIN
        SELECT json_build_object(
          'pending_projects', (
            SELECT COUNT(*)
            FROM public.projects
            WHERE user_id = p_user_id AND status IN ('pending', 'in_progress')
          ),
          'new_client_inquiries', (
            SELECT COUNT(*)
            FROM public.clients
            WHERE user_id = p_user_id 
              AND inquiry_status = 'new'
              AND inquiry_date >= CURRENT_DATE - INTERVAL '30 days'
          ),
          'monthly_productivity_percentage', (
            SELECT get_monthly_productivity_percentage(p_user_id)
          ),
          'total_projects', (
            SELECT COUNT(*)
            FROM public.projects
            WHERE user_id = p_user_id
          ),
          'total_clients', (
            SELECT COUNT(*)
            FROM public.clients
            WHERE user_id = p_user_id
          ),
          'completed_projects_this_month', (
            SELECT COUNT(*)
            FROM public.projects
            WHERE user_id = p_user_id 
              AND status = 'completed'
              AND DATE_TRUNC('month', completion_date) = DATE_TRUNC('month', CURRENT_DATE)
          )
        ) INTO result;

        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Dashboard database initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing dashboard database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create sample data for testing
async function createSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('📝 Creating sample data...');
    
    // Create a test user if none exists
    const existingUser = await client.query('SELECT id FROM public.users LIMIT 1');
    let userId;
    
    if (existingUser.rows.length === 0) {
      const newUser = await client.query(`
        INSERT INTO public.users (email, full_name, password_hash)
        VALUES ('test@example.com', 'Test User', '$2b$12$dummy.hash.for.testing')
        RETURNING id
      `);
      userId = newUser.rows[0].id;
      console.log('Created test user:', userId);
    } else {
      userId = existingUser.rows[0].id;
      console.log('Using existing user:', userId);
    }
    
    // Create dashboard settings
    await client.query(`
      INSERT INTO public.user_dashboard_settings (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
    
    // Create sample clients
    await client.query(`
      INSERT INTO public.clients (user_id, name, email, company, inquiry_status, inquiry_date)
      VALUES 
        ($1, 'John Doe', 'john@techcorp.com', 'Tech Corp', 'new', NOW() - INTERVAL '2 days'),
        ($1, 'Jane Smith', 'jane@startup.com', 'Startup Inc', 'qualified', NOW() - INTERVAL '5 days'),
        ($1, 'Bob Wilson', 'bob@fashion.com', 'Fashion Co', 'new', NOW() - INTERVAL '1 day')
      ON CONFLICT DO NOTHING
    `, [userId]);
    
    // Get client IDs for projects
    const clients = await client.query(`
      SELECT id, name FROM public.clients WHERE user_id = $1
    `, [userId]);
    
    if (clients.rows.length > 0) {
      // Create sample projects
      await client.query(`
        INSERT INTO public.projects (user_id, name, description, status, priority, due_date, progress_percentage, client_id)
        VALUES 
          ($1, 'Website Redesign', 'Complete redesign of company website', 'in_progress', 'high', CURRENT_DATE + INTERVAL '14 days', 65, $2),
          ($1, 'Mobile App Development', 'Develop mobile app for client', 'pending', 'medium', CURRENT_DATE + INTERVAL '30 days', 0, $3),
          ($1, 'Brand Identity', 'Create new brand identity package', 'in_progress', 'high', CURRENT_DATE + INTERVAL '21 days', 40, $4)
        ON CONFLICT DO NOTHING
      `, [userId, clients.rows[0]?.id, clients.rows[1]?.id, clients.rows[2]?.id]);
    }
    
    // Create sample productivity metrics for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const tasksCompleted = Math.floor(Math.random() * 10) + 5;
      const tasksPlanned = tasksCompleted + Math.floor(Math.random() * 3);
      const hoursWorked = Math.random() * 3 + 6; // 6-9 hours
      const productivityScore = Math.round((tasksCompleted / tasksPlanned) * 100);
      
      await client.query(`
        INSERT INTO public.productivity_metrics (
          user_id, metric_date, tasks_completed, tasks_planned, 
          hours_worked, hours_planned, productivity_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, metric_date) DO UPDATE SET
          tasks_completed = EXCLUDED.tasks_completed,
          tasks_planned = EXCLUDED.tasks_planned,
          hours_worked = EXCLUDED.hours_worked,
          productivity_score = EXCLUDED.productivity_score
      `, [userId, date.toISOString().split('T')[0], tasksCompleted, tasksPlanned, hoursWorked, 8, productivityScore]);
    }
    
    console.log('✅ Sample data created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await initializeDashboard();
    await createSampleData();
    console.log('🎉 Dashboard initialization complete!');
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { initializeDashboard, createSampleData };
