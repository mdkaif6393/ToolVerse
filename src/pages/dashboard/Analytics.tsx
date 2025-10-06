import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const Analytics = () => {
  const {
    summary,
    revenueTrends,
    clientGrowth,
    recentActivity,
    loading,
    error,
    lastUpdated,
    isConnected,
    refresh
  } = useAnalytics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <div className="flex items-center gap-1" title={isConnected ? "Live updates enabled" : "Offline - no live updates"}>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Track your business performance and insights
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.monthlyRevenue.value) : '$0'}
            </div>
            <div className="flex items-center mt-1">
              {summary && summary.monthlyRevenue.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary && summary.monthlyRevenue.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {summary ? formatPercentage(summary.monthlyRevenue.change) : '0%'}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.newClients.value : 0}
            </div>
            <div className="flex items-center mt-1">
              {summary && summary.newClients.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary && summary.newClients.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {summary ? formatPercentage(summary.newClients.change) : '0%'}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Project Completion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.projectCompletion.value.toFixed(1)}%` : '0%'}
            </div>
            <div className="flex items-center mt-1">
              {summary && summary.projectCompletion.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary && summary.projectCompletion.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {summary ? formatPercentage(summary.projectCompletion.change) : '0%'}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Project Value
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.avgProjectValue.value) : '$0'}
            </div>
            <div className="flex items-center mt-1">
              {summary && summary.avgProjectValue.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-sm font-medium ${
                summary && summary.avgProjectValue.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {summary ? formatPercentage(summary.avgProjectValue.change) : '0%'}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No revenue data available</p>
                  <p className="text-sm">Start creating invoices to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Growth */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Client Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {clientGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name === 'newClients' ? 'New Clients' : 'Total Clients']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="newClients" fill="#82ca9d" name="New Clients" />
                  <Bar dataKey="totalClients" fill="#8884d8" name="Total Clients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No client data available</p>
                  <p className="text-sm">Start adding clients to see growth</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-success/10">
              <div className="text-2xl font-bold text-success">
                {summary ? summary.summary.completedProjects : 0}
              </div>
              <div className="text-sm text-muted-foreground">Completed Projects</div>
              <Badge variant="secondary" className="mt-2">All Time</Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <div className="text-2xl font-bold text-warning">
                {summary ? summary.summary.activeProjects : 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
              <Badge variant="secondary" className="mt-2">In Progress</Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">
                {summary ? summary.summary.totalClients : 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
              <Badge variant="secondary" className="mt-2">All Time</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;