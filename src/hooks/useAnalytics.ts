import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../services/websocket';

export interface AnalyticsSummary {
  monthlyRevenue: {
    value: number;
    change: number;
  };
  newClients: {
    value: number;
    change: number;
  };
  projectCompletion: {
    value: number;
    change: number;
  };
  avgProjectValue: {
    value: number;
    change: number;
  };
  summary: {
    totalClients: number;
    activeProjects: number;
    completedProjects: number;
  };
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  invoiceCount: number;
}

export interface ClientGrowth {
  month: string;
  newClients: number;
  totalClients: number;
}

export interface RecentActivity {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    value: number;
    updated_at: string;
    clients?: { name: string };
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    updated_at: string;
    clients?: { name: string };
  }>;
  clients: Array<{
    id: string;
    name: string;
    company: string;
    status: string;
    created_at: string;
  }>;
}

export const useAnalytics = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [clientGrowth, setClientGrowth] = useState<ClientGrowth[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  const fetchAnalyticsSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/dashboard-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch analytics summary');

      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchRevenueTrends = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/revenue-trends', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch revenue trends');

      const result = await response.json();
      if (result.success) {
        setRevenueTrends(result.data);
      }
    } catch (err) {
      console.error('Error fetching revenue trends:', err);
    }
  }, []);

  const fetchClientGrowth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/client-growth', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch client growth');

      const result = await response.json();
      if (result.success) {
        setClientGrowth(result.data);
      }
    } catch (err) {
      console.error('Error fetching client growth:', err);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/recent-activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recent activity');

      const result = await response.json();
      if (result.success) {
        setRecentActivity(result.data);
      }
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchAnalyticsSummary(),
        fetchRevenueTrends(),
        fetchClientGrowth(),
        fetchRecentActivity()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyticsSummary, fetchRevenueTrends, fetchClientGrowth, fetchRecentActivity]);

  // Handle real-time updates
  const handleAnalyticsUpdate = useCallback((data: any) => {
    console.log('Analytics update received:', data);
    
    // Refresh all data when we receive an update
    fetchAllData();
  }, [fetchAllData]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (isConnected) {
      subscribe('analytics_update', handleAnalyticsUpdate);
      
      return () => {
        unsubscribe('analytics_update', handleAnalyticsUpdate);
      };
    }
  }, [isConnected, subscribe, unsubscribe, handleAnalyticsUpdate]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Helper functions for creating new records
  const createClient = useCallback(async (clientData: {
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) throw new Error('Failed to create client');

      const result = await response.json();
      if (result.success) {
        // Data will be refreshed via WebSocket update
        return result.data;
      }
    } catch (err) {
      console.error('Error creating client:', err);
      throw err;
    }
  }, []);

  const createProject = useCallback(async (projectData: {
    client_id: string;
    name: string;
    description?: string;
    value?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) throw new Error('Failed to create project');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  }, []);

  const updateProjectStatus = useCallback(async (projectId: string, status: string, completion_percentage?: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`/api/business-analytics/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, completion_percentage })
      });

      if (!response.ok) throw new Error('Failed to update project');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  }, []);

  const createInvoice = useCallback(async (invoiceData: {
    client_id: string;
    project_id?: string;
    invoice_number: string;
    amount: number;
    due_date?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('/api/business-analytics/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('Failed to create invoice');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  }, []);

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`/api/business-analytics/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update invoice');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    summary,
    revenueTrends,
    clientGrowth,
    recentActivity,
    
    // State
    loading,
    error,
    lastUpdated,
    isConnected,
    
    // Actions
    refresh,
    createClient,
    createProject,
    updateProjectStatus,
    createInvoice,
    updateInvoiceStatus
  };
};
