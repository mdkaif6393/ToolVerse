// ============================================================================
// DATABASE CLIENT - SUPABASE INTEGRATION
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Database Types
export interface Database {
  public: {
    Tables: {
      tools: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          description: string | null;
          category: 'pdf' | 'ai' | 'business' | 'design' | 'development' | 'productivity';
          icon: string;
          status: 'active' | 'inactive' | 'deleted' | 'pending';
          version: string;
          entry_point: string | null;
          language: string | null;
          framework: string | null;
          tech_stack: any[];
          confidence_score: number;
          is_featured: boolean;
          is_public: boolean;
          download_count: number;
          view_count: number;
          rating: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          category: 'pdf' | 'ai' | 'business' | 'design' | 'development' | 'productivity';
          icon?: string;
          status?: 'active' | 'inactive' | 'deleted' | 'pending';
          version?: string;
          entry_point?: string | null;
          language?: string | null;
          framework?: string | null;
          tech_stack?: any[];
          confidence_score?: number;
          is_featured?: boolean;
          is_public?: boolean;
          download_count?: number;
          view_count?: number;
          rating?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category?: 'pdf' | 'ai' | 'business' | 'design' | 'development' | 'productivity';
          icon?: string;
          status?: 'active' | 'inactive' | 'deleted' | 'pending';
          version?: string;
          entry_point?: string | null;
          language?: string | null;
          framework?: string | null;
          tech_stack?: any[];
          confidence_score?: number;
          is_featured?: boolean;
          is_public?: boolean;
          download_count?: number;
          view_count?: number;
          rating?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tool_files: {
        Row: {
          id: string;
          tool_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          file_type: string;
          mime_type: string | null;
          is_entry_point: boolean;
          content: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tool_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          file_type: string;
          mime_type?: string | null;
          is_entry_point?: boolean;
          content?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tool_id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          mime_type?: string | null;
          is_entry_point?: boolean;
          content?: string | null;
          created_at?: string;
        };
      };
      tool_analytics: {
        Row: {
          id: string;
          tool_id: string;
          event_type: 'view' | 'download' | 'use' | 'error' | 'performance';
          event_data: any;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          response_time: number | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tool_id: string;
          event_type: 'view' | 'download' | 'use' | 'error' | 'performance';
          event_data?: any;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          response_time?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tool_id?: string;
          event_type?: 'view' | 'download' | 'use' | 'error' | 'performance';
          event_data?: any;
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          response_time?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
      };
      tool_dependencies: {
        Row: {
          id: string;
          tool_id: string;
          package_name: string;
          version: string;
          dependency_type: 'production' | 'development' | 'peer';
          security_score: number;
          has_vulnerabilities: boolean;
          vulnerability_count: number;
          last_updated: string | null;
          license: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tool_id: string;
          package_name: string;
          version: string;
          dependency_type?: 'production' | 'development' | 'peer';
          security_score?: number;
          has_vulnerabilities?: boolean;
          vulnerability_count?: number;
          last_updated?: string | null;
          license?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tool_id?: string;
          package_name?: string;
          version?: string;
          dependency_type?: 'production' | 'development' | 'peer';
          security_score?: number;
          has_vulnerabilities?: boolean;
          vulnerability_count?: number;
          last_updated?: string | null;
          license?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      increment_tool_view_count: {
        Args: { tool_id: string };
        Returns: void;
      };
      increment_tool_download_count: {
        Args: { tool_id: string };
        Returns: void;
      };
    };
  };
}

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database helper functions
export const db = {
  // Tools operations
  tools: {
    async getAll(userId?: string) {
      let query = supabase
        .from('tools')
        .select(`
          *,
          tool_files(count),
          tool_analytics(count)
        `)
        .eq('status', 'active');
      
      if (userId) {
        query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
      } else {
        query = query.eq('is_public', true);
      }
      
      return query.order('created_at', { ascending: false });
    },

    async getById(id: string) {
      return supabase
        .from('tools')
        .select(`
          *,
          tool_files(*),
          tool_dependencies(*),
          tool_analytics(count)
        `)
        .eq('id', id)
        .single();
    },

    async create(tool: Database['public']['Tables']['tools']['Insert']) {
      return supabase.from('tools').insert(tool).select().single();
    },

    async update(id: string, updates: Database['public']['Tables']['tools']['Update']) {
      return supabase.from('tools').update(updates).eq('id', id).select().single();
    },

    async delete(id: string) {
      return supabase.from('tools').update({ status: 'deleted' }).eq('id', id);
    },

    async incrementView(toolId: string) {
      return supabase.rpc('increment_tool_view_count', { tool_id: toolId });
    },

    async incrementDownload(toolId: string) {
      return supabase.rpc('increment_tool_download_count', { tool_id: toolId });
    }
  },

  // Tool files operations
  toolFiles: {
    async getByToolId(toolId: string) {
      return supabase
        .from('tool_files')
        .select('*')
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });
    },

    async create(file: Database['public']['Tables']['tool_files']['Insert']) {
      return supabase.from('tool_files').insert(file).select().single();
    },

    async delete(id: string) {
      return supabase.from('tool_files').delete().eq('id', id);
    }
  },

  // Analytics operations
  analytics: {
    async getToolAnalytics(toolId: string, days: number = 30) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      return supabase
        .from('tool_analytics')
        .select('*')
        .eq('tool_id', toolId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
    },

    async logEvent(event: Database['public']['Tables']['tool_analytics']['Insert']) {
      return supabase.from('tool_analytics').insert(event);
    }
  },

  // Dependencies operations
  dependencies: {
    async getByToolId(toolId: string) {
      return supabase
        .from('tool_dependencies')
        .select('*')
        .eq('tool_id', toolId)
        .order('package_name', { ascending: true });
    },

    async create(dependency: Database['public']['Tables']['tool_dependencies']['Insert']) {
      return supabase.from('tool_dependencies').insert(dependency).select().single();
    },

    async updateSecurity(id: string, securityData: {
      security_score?: number;
      has_vulnerabilities?: boolean;
      vulnerability_count?: number;
    }) {
      return supabase
        .from('tool_dependencies')
        .update(securityData)
        .eq('id', id);
    }
  }
};

export default supabase;