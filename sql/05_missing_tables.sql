-- ============================================================================
-- COMPLETE MISSING TABLES AND DATA - Manual Run
-- ============================================================================

-- Create profiles table (if missing)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create productivity_metrics table (if missing)
CREATE TABLE IF NOT EXISTS public.productivity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_planned INTEGER DEFAULT 0,
  hours_worked DECIMAL(4, 2) DEFAULT 0,
  hours_planned DECIMAL(4, 2) DEFAULT 0,
  productivity_score DECIMAL(5, 2) DEFAULT 0,
  focus_time_minutes INTEGER DEFAULT 0,
  break_time_minutes INTEGER DEFAULT 0,
  meetings_count INTEGER DEFAULT 0,
  energy_level INTEGER DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
  mood_rating INTEGER DEFAULT 5 CHECK (mood_rating >= 1 AND mood_rating <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, metric_date)
);

-- Enable RLS on productivity_metrics
ALTER TABLE public.productivity_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for productivity_metrics
DROP POLICY IF EXISTS "Users can manage own productivity metrics" ON public.productivity_metrics;
CREATE POLICY "Users can manage own productivity metrics"
  ON public.productivity_metrics FOR ALL
  USING (auth.uid() = user_id);

-- Create user_dashboard_settings table (if missing)
CREATE TABLE IF NOT EXISTS public.user_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
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

-- Enable RLS on user_dashboard_settings
ALTER TABLE public.user_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_dashboard_settings
DROP POLICY IF EXISTS "Users can manage own dashboard settings" ON public.user_dashboard_settings;
CREATE POLICY "Users can manage own dashboard settings"
  ON public.user_dashboard_settings FOR ALL
  USING (auth.uid() = user_id);

-- Create project_tasks table (if missing)
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

-- Enable RLS on project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_tasks
DROP POLICY IF EXISTS "Users can manage own project tasks" ON public.project_tasks;
CREATE POLICY "Users can manage own project tasks"
  ON public.project_tasks FOR ALL
  USING (auth.uid() = user_id);

-- Create invoices table (if missing)
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

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_user_date ON public.productivity_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_settings_user_id ON public.user_dashboard_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON public.project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_dashboard_settings_updated_at ON public.user_dashboard_settings;
CREATE TRIGGER update_user_dashboard_settings_updated_at
  BEFORE UPDATE ON public.user_dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create dashboard summary function
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

-- Create sample data function
CREATE OR REPLACE FUNCTION create_sample_dashboard_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert sample profile (if not exists)
  INSERT INTO public.profiles (user_id, full_name, email)
  SELECT p_user_id, 'Sample User', 'user@example.com'
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id);

  -- Insert sample dashboard settings (if not exists)
  INSERT INTO public.user_dashboard_settings (user_id, preferred_name)
  SELECT p_user_id, 'Sample User'
  WHERE NOT EXISTS (SELECT 1 FROM public.user_dashboard_settings WHERE user_id = p_user_id);

  -- Insert sample productivity metrics
  INSERT INTO public.productivity_metrics (user_id, metric_date, tasks_completed, tasks_planned, productivity_score)
  VALUES 
    (p_user_id, CURRENT_DATE, 8, 10, 80),
    (p_user_id, CURRENT_DATE - INTERVAL '1 day', 6, 8, 75),
    (p_user_id, CURRENT_DATE - INTERVAL '2 days', 10, 12, 83)
  ON CONFLICT (user_id, metric_date) DO NOTHING;

  -- Insert sample clients (if clients table exists and no clients for user)
  INSERT INTO public.clients (user_id, name, company, email, inquiry_status)
  SELECT p_user_id, 'John Smith', 'Acme Corp', 'john@acme.com', 'new'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients')
    AND NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = p_user_id)
  UNION ALL
  SELECT p_user_id, 'Sarah Johnson', 'Tech Solutions', 'sarah@tech.com', 'contacted'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients')
    AND NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = p_user_id);

  -- Insert sample projects (if projects table exists and no projects for user)
  INSERT INTO public.projects (user_id, name, description, status, priority, progress_percentage)
  SELECT p_user_id, 'Website Redesign', 'Complete website overhaul', 'in_progress', 'high', 65
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
    AND NOT EXISTS (SELECT 1 FROM public.projects WHERE user_id = p_user_id)
  UNION ALL
  SELECT p_user_id, 'Mobile App', 'iOS and Android app development', 'pending', 'medium', 0
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
    AND NOT EXISTS (SELECT 1 FROM public.projects WHERE user_id = p_user_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for existing users (run this after creating a user)
-- Uncomment and replace with actual user ID:
-- SELECT create_sample_dashboard_data('your-user-id-here');

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables and functions created successfully!';
  RAISE NOTICE '📊 Tables: profiles, productivity_metrics, user_dashboard_settings, project_tasks, invoices';
  RAISE NOTICE '🔧 Functions: get_dashboard_summary, create_sample_dashboard_data';
  RAISE NOTICE '🛡️  RLS policies enabled on all tables';
  RAISE NOTICE '⚡ Triggers added for updated_at fields';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Sign up in your app to create a user';
  RAISE NOTICE '2. Run: SELECT create_sample_dashboard_data(auth.uid()); (after login)';
  RAISE NOTICE '3. Test your dashboard!';
END $$;
