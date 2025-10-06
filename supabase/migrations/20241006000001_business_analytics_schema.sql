-- ============================================================================
-- BUSINESS ANALYTICS SCHEMA - Real-time Dashboard Data
-- ============================================================================

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  total_value DECIMAL(12, 2) DEFAULT 0.00,
  projects_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns to existing clients table if they don't exist
DO $$ 
BEGIN
  -- Add total_value column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_value') THEN
    ALTER TABLE public.clients ADD COLUMN total_value DECIMAL(12, 2) DEFAULT 0.00;
  END IF;
  
  -- Add projects_count column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'projects_count') THEN
    ALTER TABLE public.clients ADD COLUMN projects_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add email column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
    ALTER TABLE public.clients ADD COLUMN email TEXT;
  END IF;
  
  -- Add company column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company') THEN
    ALTER TABLE public.clients ADD COLUMN company TEXT;
  END IF;
  
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
    ALTER TABLE public.clients ADD COLUMN phone TEXT;
  END IF;
  
  -- Add address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') THEN
    ALTER TABLE public.clients ADD COLUMN address TEXT;
  END IF;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'cancelled', 'on_hold')),
  value DECIMAL(12, 2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns to existing projects table if they don't exist
DO $$ 
BEGIN
  -- Add value column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'value') THEN
    ALTER TABLE public.projects ADD COLUMN value DECIMAL(12, 2) DEFAULT 0.00;
  END IF;
  
  -- Add client_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
  
  -- Add completion_percentage column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completion_percentage') THEN
    ALTER TABLE public.projects ADD COLUMN completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
  END IF;
  
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
    ALTER TABLE public.projects ADD COLUMN start_date DATE;
  END IF;
  
  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
    ALTER TABLE public.projects ADD COLUMN end_date DATE;
  END IF;
END $$;

-- Create invoices table (or add missing columns if exists)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, invoice_number)
);

-- Add missing columns to existing invoices table if they don't exist
DO $$ 
BEGIN
  -- Add amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'amount') THEN
    ALTER TABLE public.invoices ADD COLUMN amount DECIMAL(12, 2) DEFAULT 0.00;
  END IF;
  
  -- Add client_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_id') THEN
    ALTER TABLE public.invoices ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
  
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'project_id') THEN
    ALTER TABLE public.invoices ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
  
  -- Add invoice_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
    ALTER TABLE public.invoices ADD COLUMN invoice_number TEXT;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
    ALTER TABLE public.invoices ADD COLUMN status TEXT DEFAULT 'draft';
  END IF;
  
  -- Add issue_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
    ALTER TABLE public.invoices ADD COLUMN issue_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add due_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
    ALTER TABLE public.invoices ADD COLUMN due_date DATE;
  END IF;
  
  -- Add paid_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_date') THEN
    ALTER TABLE public.invoices ADD COLUMN paid_date DATE;
  END IF;
END $$;

-- Create business_metrics table for calculated analytics
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('monthly_revenue', 'client_growth', 'project_completion', 'avg_project_value')),
  metric_value DECIMAL(12, 2) NOT NULL,
  metric_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, metric_type, metric_date)
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can manage their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can manage their own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for business_metrics
CREATE POLICY "Users can view their own metrics"
  ON public.business_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert metrics"
  ON public.business_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update metrics"
  ON public.business_metrics FOR UPDATE
  USING (true);

-- Create updated_at triggers (with safe creation)
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate monthly revenue
CREATE OR REPLACE FUNCTION public.calculate_monthly_revenue(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(12, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.invoices
  WHERE user_id = user_uuid
    AND status = 'paid'
    AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM target_date)
    AND EXTRACT(MONTH FROM paid_date) = EXTRACT(MONTH FROM target_date);
$$;

-- Function to get new clients count
CREATE OR REPLACE FUNCTION public.get_new_clients_count(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.clients
  WHERE user_id = user_uuid
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM target_date)
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM target_date);
$$;

-- Function to calculate project completion rate
CREATE OR REPLACE FUNCTION public.calculate_project_completion_rate(user_uuid UUID)
RETURNS DECIMAL(5, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
  END
  FROM public.projects
  WHERE user_id = user_uuid
    AND status != 'cancelled';
$$;

-- Function to calculate average project value
CREATE OR REPLACE FUNCTION public.calculate_avg_project_value(user_uuid UUID)
RETURNS DECIMAL(12, 2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(AVG(value), 0)
  FROM public.projects
  WHERE user_id = user_uuid
    AND status != 'cancelled'
    AND value > 0;
$$;

-- Function to get dashboard analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(user_uuid UUID)
RETURNS TABLE (
  monthly_revenue DECIMAL(12, 2),
  monthly_revenue_change DECIMAL(5, 2),
  new_clients INTEGER,
  new_clients_change DECIMAL(5, 2),
  project_completion_rate DECIMAL(5, 2),
  project_completion_change DECIMAL(5, 2),
  avg_project_value DECIMAL(12, 2),
  avg_project_value_change DECIMAL(5, 2),
  total_clients INTEGER,
  active_projects INTEGER,
  completed_projects INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH current_month AS (
    SELECT 
      public.calculate_monthly_revenue(user_uuid, CURRENT_DATE) as revenue,
      public.get_new_clients_count(user_uuid, CURRENT_DATE) as clients,
      public.calculate_project_completion_rate(user_uuid) as completion,
      public.calculate_avg_project_value(user_uuid) as avg_value
  ),
  previous_month AS (
    SELECT 
      public.calculate_monthly_revenue(user_uuid, (CURRENT_DATE - INTERVAL '1 month')::DATE) as revenue,
      public.get_new_clients_count(user_uuid, (CURRENT_DATE - INTERVAL '1 month')::DATE) as clients,
      (SELECT public.calculate_project_completion_rate(user_uuid)) as completion,
      (SELECT public.calculate_avg_project_value(user_uuid)) as avg_value
  ),
  totals AS (
    SELECT 
      (SELECT COUNT(*) FROM public.clients WHERE user_id = user_uuid AND status = 'active') as total_clients,
      (SELECT COUNT(*) FROM public.projects WHERE user_id = user_uuid AND status IN ('active', 'planning')) as active_projects,
      (SELECT COUNT(*) FROM public.projects WHERE user_id = user_uuid AND status = 'completed') as completed_projects
  )
  SELECT 
    cm.revenue,
    CASE WHEN pm.revenue = 0 THEN 0 ELSE ROUND(((cm.revenue - pm.revenue) / pm.revenue) * 100, 2) END,
    cm.clients,
    CASE WHEN pm.clients = 0 THEN 0 ELSE ROUND(((cm.clients - pm.clients)::DECIMAL / pm.clients) * 100, 2) END,
    cm.completion,
    0.0, -- Completion rate change (complex calculation, simplified for now)
    cm.avg_value,
    CASE WHEN pm.avg_value = 0 THEN 0 ELSE ROUND(((cm.avg_value - pm.avg_value) / pm.avg_value) * 100, 2) END,
    t.total_clients,
    t.active_projects,
    t.completed_projects
  FROM current_month cm, previous_month pm, totals t;
$$;

-- Function to get revenue trends (last 12 months)
CREATE OR REPLACE FUNCTION public.get_revenue_trends(user_uuid UUID)
RETURNS TABLE (
  month_year TEXT,
  revenue DECIMAL(12, 2),
  invoice_count INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    TO_CHAR(DATE_TRUNC('month', paid_date), 'YYYY-MM') as month_year,
    SUM(amount) as revenue,
    COUNT(*)::INTEGER as invoice_count
  FROM public.invoices
  WHERE user_id = user_uuid
    AND status = 'paid'
    AND paid_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', paid_date)
  ORDER BY month_year;
$$;

-- Function to get client growth trends
CREATE OR REPLACE FUNCTION public.get_client_growth_trends(user_uuid UUID)
RETURNS TABLE (
  month_year TEXT,
  new_clients INTEGER,
  total_clients INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH monthly_new AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as new_count
    FROM public.clients
    WHERE user_id = user_uuid
      AND created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  running_total AS (
    SELECT 
      month,
      new_count,
      SUM(new_count) OVER (ORDER BY month) as cumulative
    FROM monthly_new
  )
  SELECT 
    TO_CHAR(month, 'YYYY-MM') as month_year,
    new_count::INTEGER as new_clients,
    cumulative::INTEGER as total_clients
  FROM running_total
  ORDER BY month;
$$;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample clients (only if no data exists)
INSERT INTO public.clients (user_id, name, email, company, status, total_value, projects_count)
SELECT 
  auth.uid(),
  'Sample Client ' || generate_series,
  'client' || generate_series || '@example.com',
  'Company ' || generate_series,
  CASE WHEN random() > 0.1 THEN 'active' ELSE 'inactive' END,
  (random() * 50000 + 5000)::DECIMAL(12,2),
  (random() * 5 + 1)::INTEGER
FROM generate_series(1, 10)
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = auth.uid())
  AND auth.uid() IS NOT NULL;

-- Insert sample projects
INSERT INTO public.projects (user_id, client_id, name, description, status, value, start_date, end_date, completion_percentage)
SELECT 
  auth.uid(),
  c.id,
  'Project ' || generate_series,
  'Sample project description ' || generate_series,
  CASE 
    WHEN random() < 0.3 THEN 'completed'
    WHEN random() < 0.6 THEN 'active'
    WHEN random() < 0.8 THEN 'planning'
    ELSE 'on_hold'
  END,
  (random() * 15000 + 2000)::DECIMAL(12,2),
  CURRENT_DATE - (random() * 365)::INTEGER,
  CURRENT_DATE + (random() * 180)::INTEGER,
  (random() * 100)::INTEGER
FROM generate_series(1, 25), 
     (SELECT id FROM public.clients WHERE user_id = auth.uid() LIMIT 1) c
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE user_id = auth.uid())
  AND auth.uid() IS NOT NULL;

-- Insert sample invoices
INSERT INTO public.invoices (user_id, client_id, project_id, invoice_number, amount, status, issue_date, due_date, paid_date)
SELECT 
  auth.uid(),
  c.id,
  p.id,
  'INV-' || LPAD(generate_series::TEXT, 4, '0'),
  (random() * 8000 + 1000)::DECIMAL(12,2),
  CASE 
    WHEN random() < 0.7 THEN 'paid'
    WHEN random() < 0.85 THEN 'sent'
    ELSE 'draft'
  END,
  CURRENT_DATE - (random() * 180)::INTEGER,
  CURRENT_DATE - (random() * 150)::INTEGER,
  CASE WHEN random() < 0.7 THEN CURRENT_DATE - (random() * 120)::INTEGER ELSE NULL END
FROM generate_series(1, 40),
     (SELECT id FROM public.clients WHERE user_id = auth.uid() ORDER BY random() LIMIT 1) c,
     (SELECT id FROM public.projects WHERE user_id = auth.uid() ORDER BY random() LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM public.invoices WHERE user_id = auth.uid())
  AND auth.uid() IS NOT NULL;
