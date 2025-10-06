import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardGreeting {
  user: {
    displayName: string;
    email: string;
    settings: {
      greetingEnabled: boolean;
      showProductivity: boolean;
      showProjects: boolean;
      showClients: boolean;
      timezone: string;
    };
  };
  greeting: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    message: string;
  };
  stats: {
    pendingProjects: number;
    newClientInquiries: number;
    monthlyProductivityPercentage: number;
    totalProjects: number;
    totalClients: number;
    completedProjectsThisMonth: number;
  };
  timestamp: string;
}

interface DashboardStats {
  projects: {
    total_projects: number;
    pending_projects: number;
    in_progress_projects: number;
    completed_projects: number;
    on_hold_projects: number;
    overdue_projects: number;
    average_progress: number;
    recent: Array<{
      id: string;
      name: string;
      status: string;
      priority: string;
      progress_percentage: number;
      due_date: string;
      updated_at: string;
    }>;
  };
  clients: {
    total_clients: number;
    new_inquiries: number;
    contacted_clients: number;
    qualified_clients: number;
    converted_clients: number;
    inquiries_this_week: number;
    inquiries_this_month: number;
    recent: Array<{
      id: string;
      name: string;
      company: string;
      inquiry_status: string;
      inquiry_date: string;
      last_contact_date: string;
    }>;
  };
  productivity: {
    trend: Array<{
      metric_date: string;
      productivity_score: number;
      tasks_completed: number;
      tasks_planned: number;
      hours_worked: number;
      hours_planned: number;
    }>;
    currentMonthAverage: number;
  };
  timestamp: string;
}

export const useDashboardGreeting = () => {
  const [data, setData] = useState<DashboardGreeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const fetchGreeting = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/greeting', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard greeting');
      }

      const greetingData = await response.json();
      setData(greetingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard greeting fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGreeting();
  }, [session?.access_token]);

  const refetch = () => {
    fetchGreeting();
  };

  return { data, loading, error, refetch };
};

export const useDashboardStats = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const fetchStats = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await response.json();
      setData(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [session?.access_token]);

  const refetch = () => {
    fetchStats();
  };

  return { data, loading, error, refetch };
};

export const useDashboardSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const updateSettings = async (settings: {
    greetingEnabled?: boolean;
    showProductivity?: boolean;
    showProjects?: boolean;
    showClients?: boolean;
    timezone?: string;
    preferredName?: string;
  }) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update dashboard settings');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/sample-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create sample data');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateSettings, createSampleData, loading, error };
};
