-- Create enum for user roles (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'superadmin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table (secure role management)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'superadmin')
  )
$$;

-- Create tools_registry table
CREATE TABLE IF NOT EXISTS public.tools_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('pdf', 'business', 'ai', 'productivity', 'design')),
  icon TEXT,
  manifest JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'disabled', 'hidden', 'deleted')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  permissions TEXT[] DEFAULT ARRAY['user'],
  ui_component TEXT,
  entrypoint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tools_registry ENABLE ROW LEVEL SECURITY;

-- Create tool_audit_logs table
CREATE TABLE IF NOT EXISTS public.tool_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools_registry(id) ON DELETE SET NULL,
  tool_slug TEXT,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tool_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles (safe creation)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for tools_registry (safe creation)
DROP POLICY IF EXISTS "Users can view enabled tools" ON public.tools_registry;
CREATE POLICY "Users can view enabled tools"
  ON public.tools_registry FOR SELECT
  USING (status = 'enabled' OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert tools" ON public.tools_registry;
CREATE POLICY "Admins can insert tools"
  ON public.tools_registry FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update tools" ON public.tools_registry;
CREATE POLICY "Admins can update tools"
  ON public.tools_registry FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can delete tools" ON public.tools_registry;
CREATE POLICY "Superadmins can delete tools"
  ON public.tools_registry FOR DELETE
  USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for tool_audit_logs (safe creation)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.tool_audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON public.tool_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.tool_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.tool_audit_logs FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tools_registry_updated_at
  BEFORE UPDATE ON public.tools_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert some example tools
INSERT INTO public.tools_registry (slug, name, description, category, icon, manifest, status, ui_component, permissions)
VALUES 
  ('merge-pdf', 'PDF Merger', 'Merge multiple PDF files into one document', 'pdf', 'FileText', 
   '{"version": "1.0.0", "features": {"merge": true}}'::jsonb, 
   'enabled', 'MergePdfTool', ARRAY['admin', 'user']),
  ('split-pdf', 'PDF Splitter', 'Split a PDF file into multiple documents', 'pdf', 'FileText',
   '{"version": "1.0.0", "features": {"split": true}}'::jsonb,
   'enabled', 'SplitPdfTool', ARRAY['admin', 'user']),
  ('content-generator', 'AI Content Generator', 'Generate content using AI', 'ai', 'Brain',
   '{"version": "1.0.0", "features": {"textGeneration": true}}'::jsonb,
   'enabled', 'ContentGeneratorTool', ARRAY['admin', 'user']),
  ('roi-calculator', 'ROI Calculator', 'Calculate return on investment', 'business', 'Calculator',
   '{"version": "1.0.0"}'::jsonb,
   'enabled', 'RoiCalculatorTool', ARRAY['admin', 'user']);