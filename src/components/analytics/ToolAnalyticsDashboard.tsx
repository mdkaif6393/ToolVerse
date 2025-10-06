import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase, Tool, ToolAnalytics } from "@/lib/supabase";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  Download, 
  Play, 
  Calendar,
  Users,
  Activity,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  totalUsage: number;
  topTools: Array<{
    name: string;
    views: number;
    downloads: number;
    usage: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    downloads: number;
    usage: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ToolAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchTools();
  }, [timeRange, selectedTool]);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, category')
        .eq('status', 'active');

      if (error) throw error;
      setTools((data || []) as Tool[]);
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch analytics data
      let query = supabase
        .from('tool_analytics')
        .select(`
          *,
          tools!inner(name, category)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (selectedTool !== 'all') {
        query = query.eq('tool_id', selectedTool);
      }

      const { data: analytics, error } = await query;

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(analytics || []);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (analytics: any[]): AnalyticsData => {
    // Calculate totals
    const totalViews = analytics.filter(a => a.event_type === 'view').length;
    const totalDownloads = analytics.filter(a => a.event_type === 'download').length;
    const totalUsage = analytics.filter(a => a.event_type === 'use').length;

    // Group by tool
    const toolStats = analytics.reduce((acc, item) => {
      const toolName = item.tools?.name || 'Unknown';
      if (!acc[toolName]) {
        acc[toolName] = { name: toolName, views: 0, downloads: 0, usage: 0 };
      }
      
      if (item.event_type === 'view') acc[toolName].views++;
      if (item.event_type === 'download') acc[toolName].downloads++;
      if (item.event_type === 'use') acc[toolName].usage++;
      
      return acc;
    }, {} as Record<string, any>);

    const topTools = Object.values(toolStats)
      .sort((a: any, b: any) => (b.views + b.downloads + b.usage) - (a.views + a.downloads + a.usage))
      .slice(0, 5);

    // Group by date
    const dailyStats = analytics.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, views: 0, downloads: 0, usage: 0 };
      }
      
      if (item.event_type === 'view') acc[date].views++;
      if (item.event_type === 'download') acc[date].downloads++;
      if (item.event_type === 'use') acc[date].usage++;
      
      return acc;
    }, {} as Record<string, any>);

    // Group by category
    const categoryStats = analytics.reduce((acc, item) => {
      const category = item.tools?.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEvents = Object.values(categoryStats).reduce((sum: number, count: number) => sum + count, 0);
    const categoryStatsArray = Object.entries(categoryStats).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: count as number,
      percentage: Math.round((Number(count) / totalEvents) * 100)
    }));

    return {
      totalViews,
      totalDownloads,
      totalUsage,
      topTools: topTools as any,
      dailyStats: Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date)) as Array<{
        date: string;
        views: number;
        downloads: number;
        usage: number;
      }>,
      categoryStats: categoryStatsArray
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">No analytics data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track tool usage and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {tools.map((tool) => (
                <SelectItem key={tool.id} value={tool.id}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tool Usage</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                <Line type="monotone" dataKey="downloads" stroke="#82ca9d" name="Downloads" />
                <Line type="monotone" dataKey="usage" stroke="#ffc658" name="Usage" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.topTools}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#8884d8" name="Views" />
              <Bar dataKey="downloads" fill="#82ca9d" name="Downloads" />
              <Bar dataKey="usage" fill="#ffc658" name="Usage" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolAnalyticsDashboard;
