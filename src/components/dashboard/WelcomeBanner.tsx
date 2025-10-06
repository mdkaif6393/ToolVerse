import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, ArrowRight, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useDashboardGreeting } from "@/hooks/useDashboard";
import { useDashboardWebSocket } from "@/services/websocket";
import { useEffect } from "react";

export const WelcomeBanner = () => {
  const { data, loading, error, refetch } = useDashboardGreeting();
  const { isConnected } = useDashboardWebSocket((updateData) => {
    // Auto-refresh greeting data when WebSocket receives updates
    refetch();
  });

  // Auto-refresh data every 30 seconds as fallback when WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  if (loading) {
    return (
      <Card className="gradient-primary text-white border-0 shadow-primary">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-white/20 rounded mb-4 w-1/4"></div>
            <div className="h-8 bg-white/20 rounded mb-2 w-1/2"></div>
            <div className="h-6 bg-white/20 rounded mb-6 w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="gradient-primary text-white border-0 shadow-primary">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome! 👋</h1>
              <p className="text-white/90 text-lg mb-4">
                Unable to load dashboard data. Please try again.
              </p>
              <Button onClick={refetch} variant="secondary" className="text-primary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;
  const greeting = data?.greeting;
  const user = data?.user;

  const getProductivityMessage = () => {
    if (!stats || !user?.settings.showProductivity) return '';
    
    const percentage = stats.monthlyProductivityPercentage;
    if (percentage === 0) {
      return "Your productivity is 0% this month - let's get started!";
    } else if (percentage > 0) {
      return `Your productivity is up ${percentage}% this month - keep up the great work!`;
    } else {
      return `Your productivity is down ${Math.abs(percentage)}% this month - let's improve together!`;
    }
  };

  const getProjectsMessage = () => {
    if (!stats || !user?.settings.showProjects) return '';
    return `You have ${stats.pendingProjects} pending projects`;
  };

  const getClientsMessage = () => {
    if (!stats || !user?.settings.showClients) return '';
    return `${stats.newClientInquiries} new client inquiries`;
  };

  const buildMessage = () => {
    const parts = [getProjectsMessage(), getClientsMessage()].filter(Boolean);
    const projectsAndClients = parts.length > 0 ? parts.join(' and ') + '.' : '';
    const productivity = getProductivityMessage();
    
    return [projectsAndClients, productivity].filter(Boolean).join(' ');
  };

  return (
    <Card className="gradient-primary text-white border-0 shadow-primary">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                <span className="text-sm font-medium opacity-90">Welcome back!</span>
              </div>
              <div className="flex items-center">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-300" />
                ) : (
                  <WifiOff className="h-4 w-4 text-yellow-300" />
                )}
                <span className="text-xs opacity-75 ml-1">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{greeting?.message || 'Welcome! 👋'}</h1>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              {buildMessage() || 'Ready to be productive today!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="text-primary hover:text-primary">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Quick Actions
              </Button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="hidden lg:block relative">
            <div className="w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};