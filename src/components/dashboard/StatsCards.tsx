import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, FileText, Brain, TrendingUp, DollarSign, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface StatsData {
  total_clients: number;
  active_projects: number;
  total_invoices: number;
  tools_used: number;
  total_revenue: number;
  growth_rate: number;
  client_change: string;
  project_change: string;
  invoice_change: string;
  tools_change: string;
  revenue_change: string;
  growth_change: string;
}

const fetchDashboardStats = async (): Promise<StatsData> => {
  try {
    const [clientsRes, projectsRes, invoicesRes, analyticsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/clients/stats/overview`),
      fetch(`${API_BASE_URL}/api/projects/stats/overview`),
      fetch(`${API_BASE_URL}/api/invoices/stats/overview`),
      fetch(`${API_BASE_URL}/api/analytics/dashboard-stats`)
    ]);

    const [clientsData, projectsData, invoicesData, analyticsData] = await Promise.all([
      clientsRes.ok ? clientsRes.json() : { data: { total_clients: 0, active_clients: 0 } },
      projectsRes.ok ? projectsRes.json() : { data: { total_projects: 0, active_projects: 0 } },
      invoicesRes.ok ? invoicesRes.json() : { data: { total_invoices: 0, total_revenue: 0 } },
      analyticsRes.ok ? analyticsRes.json() : { data: { tools_used: 0, growth_rate: 0 } }
    ]);

    return {
      total_clients: clientsData.data?.total_clients || 0,
      active_projects: projectsData.data?.active_projects || 0,
      total_invoices: invoicesData.data?.total_invoices || 0,
      tools_used: analyticsData.data?.tools_used || 0,
      total_revenue: invoicesData.data?.total_revenue || 0,
      growth_rate: analyticsData.data?.growth_rate || 0,
      client_change: "+0%",
      project_change: "+0%",
      invoice_change: "+0%",
      tools_change: "+0%",
      revenue_change: "+0%",
      growth_change: "+0%"
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      total_clients: 0,
      active_projects: 0,
      total_invoices: 0,
      tools_used: 0,
      total_revenue: 0,
      growth_rate: 0,
      client_change: "+0%",
      project_change: "+0%",
      invoice_change: "+0%",
      tools_change: "+0%",
      revenue_change: "+0%",
      growth_change: "+0%"
    };
  }
};

export const StatsCards = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="hover-lift">
            <CardContent className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center p-6 text-muted-foreground">
            Unable to load dashboard statistics
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Clients",
      value: stats.total_clients.toString(),
      change: stats.client_change,
      changeType: "positive" as const,
      icon: Users,
      description: "from last month"
    },
    {
      title: "Active Projects",
      value: stats.active_projects.toString(),
      change: stats.project_change,
      changeType: "positive" as const,
      icon: FolderOpen,
      description: "currently active"
    },
    {
      title: "Total Invoices",
      value: stats.total_invoices.toString(),
      change: stats.invoice_change,
      changeType: "positive" as const,
      icon: FileText,
      description: "generated"
    },
    {
      title: "Tools Used",
      value: stats.tools_used.toLocaleString(),
      change: stats.tools_change,
      changeType: "positive" as const,
      icon: Brain,
      description: "total operations"
    },
    {
      title: "Total Revenue",
      value: `$${stats.total_revenue.toLocaleString()}`,
      change: stats.revenue_change,
      changeType: "positive" as const,
      icon: DollarSign,
      description: "earned"
    },
    {
      title: "Growth Rate",
      value: `${stats.growth_rate}%`,
      change: stats.growth_change,
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "monthly growth"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsConfig.map((stat, index) => (
        <Card key={index} className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <stat.icon className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs">
              <span
                className={`font-medium ${
                  stat.changeType === "positive" 
                    ? "text-success" 
                    : "text-destructive"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground ml-1">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};