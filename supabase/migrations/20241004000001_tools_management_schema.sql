-- ============================================================================
-- TOOLS MANAGEMENT SYSTEM - COMPREHENSIVE DATABASE SCHEMA
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

-- Create tool_files table (stores uploaded files)
CREATE TABLE public.tool_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  is_entry_point BOOLEAN DEFAULT false,
  content TEXT, -- For small text files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_versions table (version management)
CREATE TABLE public.tool_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  changelog TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  download_count INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tool_id, version)
);

-- Create tool_dependencies table (dependency management)
CREATE TABLE public.tool_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  dependency_type TEXT DEFAULT 'production' CHECK (dependency_type IN ('production', 'development', 'peer')),
  security_score INTEGER DEFAULT 100,
  has_vulnerabilities BOOLEAN DEFAULT false,
  vulnerability_count INTEGER DEFAULT 0,
  last_updated DATE,
  license TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_analytics table (usage analytics)
CREATE TABLE public.tool_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'use', 'error', 'performance')),
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  response_time INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_tests table (testing results)
CREATE TABLE public.tool_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('syntax', 'dependencies', 'build', 'runtime', 'security', 'performance')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'skipped')),
  duration INTEGER, -- in milliseconds
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_reviews table (user reviews and ratings)
CREATE TABLE public.tool_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tool_id, user_id)
);

-- Create tool_tags table (tagging system)
CREATE TABLE public.tool_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tool_id, tag)
);

-- Create tool_collections table (tool collections/suites)
CREATE TABLE public.tool_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tool_collection_items table (items in collections)
CREATE TABLE public.tool_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.tool_collections(id) ON DELETE CASCADE NOT NULL,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(collection_id, tool_id)
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_collection_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Tools policies
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

-- Tool files policies
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

CREATE POLICY "Users can delete files for their tools"
  ON public.tool_files FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_files.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Tool versions policies
CREATE POLICY "Users can view versions for accessible tools"
  ON public.tool_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_versions.tool_id
    AND (tools.is_public = true OR tools.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage versions for their tools"
  ON public.tool_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_versions.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Tool dependencies policies
CREATE POLICY "Users can view dependencies for accessible tools"
  ON public.tool_dependencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_dependencies.tool_id
    AND (tools.is_public = true OR tools.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage dependencies for their tools"
  ON public.tool_dependencies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_dependencies.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Tool analytics policies (read-only for tool owners)
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

-- Tool tests policies
CREATE POLICY "Users can view tests for accessible tools"
  ON public.tool_tests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_tests.tool_id
    AND (tools.is_public = true OR tools.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage tests for their tools"
  ON public.tool_tests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_tests.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Tool reviews policies
CREATE POLICY "Anyone can view reviews for public tools"
  ON public.tool_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_reviews.tool_id
    AND tools.is_public = true
  ));

CREATE POLICY "Users can insert their own reviews"
  ON public.tool_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.tool_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Tool tags policies
CREATE POLICY "Users can view tags for accessible tools"
  ON public.tool_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_tags.tool_id
    AND (tools.is_public = true OR tools.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage tags for their tools"
  ON public.tool_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tools
    WHERE tools.id = tool_tags.tool_id
    AND tools.user_id = auth.uid()
  ));

-- Tool collections policies
CREATE POLICY "Users can view public collections or their own"
  ON public.tool_collections FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own collections"
  ON public.tool_collections FOR ALL
  USING (auth.uid() = user_id);

-- Tool collection items policies
CREATE POLICY "Users can view items in accessible collections"
  ON public.tool_collection_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tool_collections
    WHERE tool_collections.id = tool_collection_items.collection_id
    AND (tool_collections.is_public = true OR tool_collections.user_id = auth.uid())
  ));

CREATE POLICY "Users can manage items in their collections"
  ON public.tool_collection_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tool_collections
    WHERE tool_collections.id = tool_collection_items.collection_id
    AND tool_collections.user_id = auth.uid()
  ));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tools indexes
CREATE INDEX idx_tools_user_id ON public.tools(user_id);
CREATE INDEX idx_tools_category ON public.tools(category);
CREATE INDEX idx_tools_status ON public.tools(status);
CREATE INDEX idx_tools_slug ON public.tools(slug);
CREATE INDEX idx_tools_is_public ON public.tools(is_public);
CREATE INDEX idx_tools_is_featured ON public.tools(is_featured);
CREATE INDEX idx_tools_created_at ON public.tools(created_at DESC);

-- Tool files indexes
CREATE INDEX idx_tool_files_tool_id ON public.tool_files(tool_id);
CREATE INDEX idx_tool_files_filename ON public.tool_files(filename);

-- Tool analytics indexes
CREATE INDEX idx_tool_analytics_tool_id ON public.tool_analytics(tool_id);
CREATE INDEX idx_tool_analytics_event_type ON public.tool_analytics(event_type);
CREATE INDEX idx_tool_analytics_created_at ON public.tool_analytics(created_at DESC);

-- Tool dependencies indexes
CREATE INDEX idx_tool_dependencies_tool_id ON public.tool_dependencies(tool_id);
CREATE INDEX idx_tool_dependencies_package_name ON public.tool_dependencies(package_name);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tool_versions_updated_at
  BEFORE UPDATE ON public.tool_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tool_reviews_updated_at
  BEFORE UPDATE ON public.tool_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tool_collections_updated_at
  BEFORE UPDATE ON public.tool_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to update tool rating when review is added/updated
CREATE OR REPLACE FUNCTION update_tool_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tools 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.tool_reviews 
      WHERE tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.tool_reviews 
      WHERE tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
    )
  WHERE id = COALESCE(NEW.tool_id, OLD.tool_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tool rating
CREATE TRIGGER update_tool_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tool_reviews
  FOR EACH ROW EXECUTE FUNCTION update_tool_rating();

-- Function to increment view count
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

-- Function to increment download count
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
