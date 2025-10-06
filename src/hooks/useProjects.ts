import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useProjects = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      return result.data?.projects || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["projects-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/projects/stats/overview`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data || {};
    },
  });

  const createProject = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-stats"] });
      toast({ title: "Success", description: "Project created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { projects, stats, isLoading, error, createProject };
};
