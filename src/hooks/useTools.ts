import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Tool, ToolInsert, ToolUpdate, ToolAnalytics } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Tool creation helper functions
export const createToolSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

// Upload file to Supabase Storage
export const uploadToolFile = async (file: File, toolSlug: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${toolSlug}-${Date.now()}.${fileExt}`;
  const filePath = `tools/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('tools')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('tools')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Analytics tracking functions
export const trackToolView = async (toolId: string) => {
  try {
    // Call Supabase function to increment view count
    await supabase.rpc('increment_tool_view_count', { tool_id: toolId });
  } catch (error) {
    console.error('Failed to track tool view:', error);
  }
};

export const trackToolDownload = async (toolId: string) => {
  try {
    // Call Supabase function to increment download count
    await supabase.rpc('increment_tool_download_count', { tool_id: toolId });
  } catch (error) {
    console.error('Failed to track tool download:', error);
  }
};

export const trackToolUsage = async (toolId: string, eventData?: Record<string, any>) => {
  try {
    const { error } = await supabase
      .from('tool_analytics')
      .insert({
        tool_id: toolId,
        event_type: 'use',
        event_data: eventData || {},
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to track tool usage:', error);
    }
  } catch (error) {
    console.error('Failed to track tool usage:', error);
  }
};

export const useTools = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active tools
  const { data: tools = [], isLoading, error } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch tools: ${error.message}`);
      }

      return data || [];
    },
  });

  // Fetch all tools (for admin)
  const { data: allTools = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["tools-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch all tools: ${error.message}`);
      }

      return data || [];
    },
  });

  // Add new tool
  const addTool = useMutation({
    mutationFn: async (toolData: ToolInsert) => {
      const { data, error } = await supabase
        .from('tools')
        .insert([toolData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create tool: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools-all"] });
      toast({
        title: "✅ Success",
        description: "Tool created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update tool
  const updateTool = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ToolUpdate }) => {
      const { data, error } = await supabase
        .from('tools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update tool: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools-all"] });
      toast({
        title: "✅ Success",
        description: "Tool updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete tool
  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete tool: ${error.message}`);
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools-all"] });
      toast({
        title: "✅ Success",
        description: "Tool deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tools,
    allTools,
    isLoading,
    isLoadingAll,
    error,
    addTool,
    updateTool,
    deleteTool,
    uploadToolFile,
  };
};