import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Tool {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  category: 'pdf' | 'ai' | 'business' | 'design' | 'development' | 'productivity';
  icon?: string;
  status: 'active' | 'inactive' | 'deleted' | 'pending';
  version?: string;
  entry_point?: string;
  language?: string;
  framework?: string;
  tech_stack?: string[];
  confidence_score?: number;
  is_featured?: boolean;
  is_public?: boolean;
  download_count?: number;
  view_count?: number;
  rating?: number;
  rating_count?: number;
  frontend_url?: string;
  created_at: string;
  updated_at: string;
}

// Tool insert type (for creating new tools)
export interface ToolInsert {
  name: string;
  slug: string;
  description?: string;
  category: 'pdf' | 'ai' | 'business' | 'design' | 'development' | 'productivity';
  icon?: string;
  status?: 'active' | 'inactive' | 'deleted' | 'pending';
  version?: string;
  entry_point?: string;
  language?: string;
  framework?: string;
  tech_stack?: string[];
  confidence_score?: number;
  is_featured?: boolean;
  is_public?: boolean;
  frontend_url?: string;
}

// Tool Files type
export interface ToolFile {
  id: string;
  tool_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type?: string;
  is_entry_point?: boolean;
  content?: string;
  created_at: string;
}

// Analytics type
export interface ToolAnalytics {
  id: string;
  tool_id: string;
  event_type: 'view' | 'download' | 'use' | 'error' | 'performance';
  event_data?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  response_time?: number;
  success?: boolean;
  error_message?: string;
  created_at: string;
}

export interface ToolUpdate {
  name?: string
  slug?: string
  category?: string
  status?: 'active' | 'inactive' | 'draft'
  frontend_url?: string
}
