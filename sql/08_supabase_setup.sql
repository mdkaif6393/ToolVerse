-- ============================================================================
-- QUICK SETUP: Copy and paste this into Supabase SQL Editor
-- ============================================================================

-- Create tools table (main tools registry)
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('pdf', 'ai', 'business', 'design', 'development', 'productivity')),
  icon TEXT DEFAULT '🛠️',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted', 'pending')),
  version TEXT DEFAULT '1.0.0',
  entry_point TEXT,
  language TEXT,
  framework TEXT,
  tech_stack JSONB DEFAULT '[]',
  confidence_score DECIMAL(3, 2) DEFAULT 0.0,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_files table
CREATE TABLE public.tool_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  is_entry_point BOOLEAN DEFAULT false,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_analytics table
CREATE TABLE public.tool_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'use', 'error', 'performance')),
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  response_time INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for tools
CREATE POLICY "Users can view public tools or their own tools"
  ON public.tools FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own tools"
  ON public.tools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools"
  ON public.tools FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools"
  ON public.tools FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for tool_files
CREATE POLICY "Users can view files for accessible tools"
  ON public.tool_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_files.tool_id
    AND (tools.is_public = true OR tools.user_id = auth.uid())
  ));

CREATE POLICY "Users can insert files for their tools"
  ON public.tool_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_files.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Create policies for analytics
CREATE POLICY "Users can view analytics for their tools"
  ON public.tool_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_analytics.tool_id
    AND tools.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert analytics"
  ON public.tool_analytics FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_tools_user_id ON public.tools(user_id);
CREATE INDEX idx_tools_category ON public.tools(category);
CREATE INDEX idx_tools_status ON public.tools(status);
CREATE INDEX idx_tools_slug ON public.tools(slug);
CREATE INDEX idx_tools_is_public ON public.tools(is_public);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create helper functions
CREATE OR REPLACE FUNCTION increment_tool_view_count(tool_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tools 
  SET view_count = view_count + 1 
  WHERE id = tool_id;
  
  INSERT INTO public.tool_analytics (tool_id, event_type, event_data)
  VALUES (tool_id, 'view', '{"timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_tool_download_count(tool_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tools 
  SET download_count = download_count + 1 
  WHERE id = tool_id;
  
  INSERT INTO public.tool_analytics (tool_id, event_type, event_data)
  VALUES (tool_id, 'download', '{"timestamp": "' || NOW() || '"}');
END;
$$ LANGUAGE plpgsql;
