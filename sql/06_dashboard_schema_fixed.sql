-- ============================================================================
-- DASHBOARD DATA SCHEMA - FIXED VERSION (Run this in Supabase SQL Editor)
-- ============================================================================

-- Create clients table FIRST (since projects references it)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create projects table SECOND (references clients)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_planned INTEGER DEFAULT 0,
  hours_worked DECIMAL(4, 2) DEFAULT 0,
  hours_planned DECIMAL(4, 2) DEFAULT 0,
  focus_time_minutes INTEGER DEFAULT 0,
  break_time_minutes INTEGER DEFAULT 0,
  meetings_count INTEGER DEFAULT 0,
  productivity_score DECIMAL(5, 2) DEFAULT 0,
  energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
  mood_rating INTEGER DEFAULT 5 CHECK (mood_rating >= 1 AND mood_rating <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, metric_date)
);

-- Create user_dashboard_settings table
CREATE TABLE IF NOT EXISTS public.user_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  greeting_enabled BOOLEAN DEFAULT true,
  show_productivity BOOLEAN DEFAULT true,
  show_projects BOOLEAN DEFAULT true,
  show_clients BOOLEAN DEFAULT true,
  show_recent_activity BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  preferred_name TEXT,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  dashboard_layout JSONB DEFAULT '{"widgets": ["greeting", "stats", "recent"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  estimated_hours DECIMAL(4, 2),
  actual_hours DECIMAL(4, 2),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_inquiry_status ON public.clients(inquiry_status);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_user_date ON public.productivity_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON public.project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);

-- Create database functions for dashboard calculations
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_projects', (
      SELECT COUNT(*) FROM public.projects 
      WHERE user_id = p_user_id AND status = 'pending'
    ),
    'new_client_inquiries', (
      SELECT COUNT(*) FROM public.clients 
      WHERE user_id = p_user_id AND inquiry_status = 'new'
    ),
    'monthly_productivity_percentage', (
      SELECT COALESCE(AVG(productivity_score), 0)
      FROM public.productivity_metrics 
      WHERE user_id = p_user_id 
        AND metric_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'total_projects', (
      SELECT COUNT(*) FROM public.projects 
      WHERE user_id = p_user_id AND status != 'cancelled'
    ),
    'total_clients', (
      SELECT COUNT(*) FROM public.clients 
      WHERE user_id = p_user_id
    ),
    'completed_projects_this_month', (
      SELECT COUNT(*) FROM public.projects 
      WHERE user_id = p_user_id 
        AND status = 'completed'
        AND completion_date >= DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create sample dashboard data
CREATE OR REPLACE FUNCTION create_sample_dashboard_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert sample clients
  INSERT INTO public.clients (user_id, name, company, email, inquiry_status)
  VALUES 
    (p_user_id, 'John Smith', 'Acme Corp', 'john@acme.com', 'new'),
    (p_user_id, 'Sarah Johnson', 'Tech Solutions Inc', 'sarah@techsolutions.com', 'contacted'),
    (p_user_id, 'Mike Davis', 'Creative Agency', 'mike@creative.com', 'qualified')
  ON CONFLICT DO NOTHING;

  -- Insert sample projects
  INSERT INTO public.projects (user_id, name, description, status, priority, progress_percentage)
  VALUES 
    (p_user_id, 'Website Redesign', 'Complete website overhaul for client', 'in_progress', 'high', 65),
    (p_user_id, 'Mobile App Development', 'iOS and Android app development', 'pending', 'medium', 0),
    (p_user_id, 'Brand Identity Design', 'Logo and brand guidelines creation', 'completed', 'low', 100)
  ON CONFLICT DO NOTHING;

  -- Insert sample productivity metrics
  INSERT INTO public.productivity_metrics (user_id, metric_date, tasks_completed, tasks_planned, hours_worked, productivity_score)
  VALUES 
    (p_user_id, CURRENT_DATE, 8, 10, 7.5, 80),
    (p_user_id, CURRENT_DATE - INTERVAL '1 day', 6, 8, 6.0, 75),
    (p_user_id, CURRENT_DATE - INTERVAL '2 days', 10, 12, 8.0, 83)
  ON CONFLICT (user_id, metric_date) DO NOTHING;

  -- Insert dashboard settings
  INSERT INTO public.user_dashboard_settings (user_id, preferred_name)
  VALUES (p_user_id, 'User')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own productivity metrics" ON public.productivity_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own dashboard settings" ON public.user_dashboard_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own project tasks" ON public.project_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = user_id);
