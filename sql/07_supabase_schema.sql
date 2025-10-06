-- Supabase Database Schema for Tools Management System
-- Run this SQL in your Supabase SQL Editor
-- Fixed version that handles existing objects and matches TypeScript interface

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS tools CASCADE;

-- Create tools table with all required columns
CREATE TABLE tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid() NOT NULL, -- Will be linked to auth.users later
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'productivity' CHECK (category IN ('pdf', 'ai', 'business', 'design', 'development', 'productivity')),
    icon VARCHAR(50) DEFAULT '🛠️',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted', 'pending')),
    version VARCHAR(20) DEFAULT '1.0.0',
    entry_point TEXT,
    language VARCHAR(50),
    framework VARCHAR(50),
    tech_stack JSONB DEFAULT '[]',
    confidence_score DECIMAL(3, 2) DEFAULT 0.0,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    frontend_url TEXT, -- This is the column that was missing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_tools_user_id ON tools(user_id);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_tools_is_public ON tools(is_public);
CREATE INDEX idx_tools_created_at ON tools(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_tools_updated_at ON tools;
CREATE TRIGGER update_tools_updated_at 
    BEFORE UPDATE ON tools 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on tools" ON tools;
DROP POLICY IF EXISTS "Allow public access to tools bucket" ON storage.objects;

-- Create policies for tools table
-- Allow all operations for now (you can restrict based on user authentication later)
CREATE POLICY "Allow all operations on tools" ON tools
    FOR ALL USING (true);

-- Create storage bucket for tool files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tools', 'tools', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for tools bucket
CREATE POLICY "Allow public access to tools bucket" ON storage.objects
    FOR ALL USING (bucket_id = 'tools');

-- Insert sample data with proper column names and demo URLs
INSERT INTO tools (name, slug, description, category, status, frontend_url, icon, version) VALUES
    ('PDF Merger', 'pdf-merger', 'Merge multiple PDF files into a single document', 'pdf', 'active', '/tools/demo.html?name=PDF%20Merger&description=Merge%20multiple%20PDF%20files%20into%20a%20single%20document&category=pdf', '📄', '1.0.0'),
    ('Text Analyzer', 'text-analyzer', 'Analyze text for readability, sentiment, and statistics', 'ai', 'active', '/tools/demo.html?name=Text%20Analyzer&description=Analyze%20text%20for%20readability%2C%20sentiment%2C%20and%20statistics&category=ai', '🤖', '1.0.0'),
    ('QR Code Generator', 'qr-generator', 'Generate QR codes for text, URLs, and more', 'productivity', 'active', '/tools/demo.html?name=QR%20Code%20Generator&description=Generate%20QR%20codes%20for%20text%2C%20URLs%2C%20and%20more&category=productivity', '📱', '1.0.0'),
    ('Color Palette Generator', 'color-palette', 'Generate beautiful color palettes for design projects', 'design', 'active', '/tools/demo.html?name=Color%20Palette%20Generator&description=Generate%20beautiful%20color%20palettes%20for%20design%20projects&category=design', '🎨', '1.0.0'),
    ('JSON Formatter', 'json-formatter', 'Format and validate JSON data with syntax highlighting', 'development', 'active', '/tools/demo.html?name=JSON%20Formatter&description=Format%20and%20validate%20JSON%20data%20with%20syntax%20highlighting&category=development', '💻', '1.0.0'),
    ('Invoice Generator', 'invoice-generator', 'Create professional invoices for your business', 'business', 'active', '/tools/demo.html?name=Invoice%20Generator&description=Create%20professional%20invoices%20for%20your%20business&category=business', '💼', '1.0.0')
ON CONFLICT (slug) DO NOTHING;

-- Drop existing view if it exists
DROP VIEW IF EXISTS active_tools;

-- Create a view for active tools
CREATE VIEW active_tools AS
SELECT * FROM tools WHERE status = 'active' AND is_public = true
ORDER BY created_at DESC;

-- Grant permissions (adjust based on your authentication setup)
GRANT ALL ON tools TO authenticated;
GRANT ALL ON tools TO anon;
GRANT ALL ON active_tools TO authenticated;
GRANT ALL ON active_tools TO anon;
