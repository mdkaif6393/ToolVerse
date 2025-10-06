import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'good' | 'warning' | 'critical';
}

interface ToolPerformance {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  totalRequests: number;
  successRate: number;
  lastUpdated: string;
}

const mockPerformanceData: ToolPerformance[] = [
  {
    id: '1',
    name: 'PDF Merger Pro',
    status: 'online',
    uptime: 99.8,
    responseTime: 145,
    errorRate: 0.2,
    activeUsers: 234,
    totalRequests: 15420,
    successRate: 99.8,
    lastUpdated: '2 minutes ago'
  },
  {
    id: '2',
    name: 'AI Text Summarizer',
    status: 'online',
    uptime: 99.5,
    responseTime: 320,
    errorRate: 0.5,
    activeUsers: 156,
    totalRequests: 8930,
    successRate: 99.5,
    lastUpdated: '1 minute ago'
  },
  {
    id: '3',
    name: 'Code Formatter Plus',
    status: 'maintenance',
    uptime: 95.2,
    responseTime: 89,
    errorRate: 4.8,
    activeUsers: 45,
    totalRequests: 12560,
    successRate: 95.2,
    lastUpdated: '5 minutes ago'
  },
  {
    id: '4',
    name: 'Image Optimizer',
    status: 'online',
    uptime: 99.9,
    responseTime: 67,
    errorRate: 0.1,
    activeUsers: 445,
    totalRequests: 22100,
    successRate: 99.9,
    lastUpdated: '30 seconds ago'
  }
];

const systemMetrics: PerformanceMetric[] = [
  {
    name: 'Average Response Time',
    value: 155,
    unit: 'ms',
    trend: 'down',
    change: -12,
    status: 'good'
  },
  {
    name: 'System Uptime',
    value: 99.1,
    unit: '%',
    trend: 'stable',
    change: 0,
    status: 'good'
  },
  {
    name: 'Error Rate',
    value: 1.4,
    unit: '%',
    trend: 'up',
    change: 0.3,
    status: 'warning'
  },
  {
    name: 'Active Users',
    value: 880,
    unit: 'users',
    trend: 'up',
    change: 15,
    status: 'good'
  },
  {
    name: 'Total Requests',
    value: 58010,
    unit: 'req',
    trend: 'up',
    change: 8,
    status: 'good'
  },
  {
    name: 'Success Rate',
    value: 98.6,
    unit: '%',
    trend: 'down',
    change: -0.4,
    status: 'warning'
  }
];

const ToolPerformanceDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'critical': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor tool performance and system health in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time Range:</span>
            </div>
            <div className="flex gap-1">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="tools">🛠️ Tools</TabsTrigger>
          <TabsTrigger value="metrics">📈 Metrics</TabsTrigger>
          <TabsTrigger value="alerts">🚨 Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Health</p>
                    <p className="text-2xl font-bold text-green-600">Excellent</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Tools</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {mockPerformanceData.filter(t => t.status === 'online').length}/{mockPerformanceData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tools running</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {mockPerformanceData.reduce((sum, tool) => sum + tool.activeUsers, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMetrics.map((metric, index) => (
              <Card key={index} className={`${getMetricStatusColor(metric.status)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                  {metric.change !== 0 && (
                    <p className={`text-xs mt-1 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Performance chart would be rendered here</p>
                  <p className="text-sm text-muted-foreground">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-4">
            {mockPerformanceData.map((tool) => (
              <Card key={tool.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(tool.status)}`}>
                        {getStatusIcon(tool.status)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Last updated: {tool.lastUpdated}</p>
                      </div>
                    </div>
                    <Badge variant={tool.status === 'online' ? 'default' : tool.status === 'maintenance' ? 'secondary' : 'destructive'}>
                      {tool.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                      <div className="flex items-center gap-2">
                        <Progress value={tool.uptime} className="flex-1" />
                        <span className="text-sm font-medium">{tool.uptime}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                      <p className="text-lg font-bold">{tool.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-lg font-bold">{tool.activeUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-lg font-bold">{tool.successRate}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Requests: {tool.totalRequests.toLocaleString()}</span>
                      <span className={`font-medium ${tool.errorRate < 1 ? 'text-green-600' : tool.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        Error Rate: {tool.errorRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Tool Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Online</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockPerformanceData.filter(t => t.status === 'online').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Maintenance</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockPerformanceData.filter(t => t.status === 'maintenance').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm">Offline</span>
                    </div>
                    <span className="text-sm font-medium">
                      {mockPerformanceData.filter(t => t.status === 'offline').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Response Time</span>
                      <span>155ms</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Uptime</span>
                      <span>99.1%</span>
                    </div>
                    <Progress value={99.1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>98.6%</span>
                    </div>
                    <Progress value={98.6} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">High Error Rate Detected</h4>
                    <p className="text-sm text-muted-foreground">Code Formatter Plus is experiencing elevated error rates (4.8%)</p>
                    <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Maintenance Window Scheduled</h4>
                    <p className="text-sm text-muted-foreground">Code Formatter Plus will undergo maintenance tonight at 2:00 AM UTC</p>
                    <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                  <Badge variant="outline">Info</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Performance Improvement</h4>
                    <p className="text-sm text-muted-foreground">Image Optimizer response time improved by 15% after recent optimization</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                  <Badge variant="default">Success</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolPerformanceDashboard;
