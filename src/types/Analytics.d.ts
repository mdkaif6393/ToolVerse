export interface DashboardStats {
  totalClients: number;
  totalProjects: number;
  invoicesGenerated: number;
  toolsUsed: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  revenue: ChartDataPoint[];
  projects: ChartDataPoint[];
  clients: ChartDataPoint[];
  toolUsage: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UsageMetrics {
  totalHours: number;
  billableHours: number;
  utilization: number;
  avgProjectDuration: number;
  completionRate: number;
}

export interface RevenueBreakdown {
  projectRevenue: number;
  toolRevenue: number;
  subscriptionRevenue: number;
  totalRevenue: number;
}

export interface TopPerformers {
  topClients: Array<{
    clientId: string;
    name: string;
    revenue: number;
    projects: number;
  }>;
  topProjects: Array<{
    projectId: string;
    name: string;
    revenue: number;
    completion: number;
  }>;
  topTools: Array<{
    toolId: string;
    name: string;
    usage: number;
    revenue: number;
  }>;
}