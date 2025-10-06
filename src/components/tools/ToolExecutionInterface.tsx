import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  Terminal, 
  Activity,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface ToolExecutionInterfaceProps {
  tool: any;
  onExecutionStart?: (sessionId: string) => void;
  onExecutionStop?: () => void;
}

interface ExecutionSession {
  sessionId: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  executionUrl: string;
  port?: number;
  logs: string[];
  startTime: number;
  uptime: number;
}

const ToolExecutionInterface: React.FC<ToolExecutionInterfaceProps> = ({
  tool,
  onExecutionStart,
  onExecutionStop
}) => {
  const { toast } = useToast();
  const [session, setSession] = useState<ExecutionSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [progress, setProgress] = useState(0);

  // Poll for session status
  useEffect(() => {
    if (!session || session.status === 'stopped') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/execution/status/${session.sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSession(prev => prev ? {
            ...prev,
            status: data.status,
            logs: data.logs,
            uptime: data.uptime,
            port: data.port,
            url: data.url
          } : null);
        }
      } catch (error) {
        console.error('Failed to fetch session status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.sessionId]);

  // Progress animation for starting state
  useEffect(() => {
    if (isStarting) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isStarting]);

  const startToolExecution = async () => {
    setIsStarting(true);
    setProgress(0);

    try {
      const response = await fetch(`/api/execution/start/${tool.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const newSession: ExecutionSession = {
          sessionId: data.sessionId,
          status: 'starting',
          executionUrl: data.executionUrl,
          logs: [],
          startTime: Date.now(),
          uptime: 0
        };

        setSession(newSession);
        setProgress(100);

        toast({
          title: "🚀 Tool Execution Started!",
          description: `${tool.name} is initializing...`,
        });

        onExecutionStart?.(data.sessionId);

        // Wait for tool to be ready
        setTimeout(() => {
          setSession(prev => prev ? { ...prev, status: 'running' } : null);
          toast({
            title: "✅ Tool Ready!",
            description: `${tool.name} is now running and ready to use`,
          });
        }, 3000);

      } else {
        throw new Error(data.error || 'Failed to start tool execution');
      }

    } catch (error: any) {
      toast({
        title: "❌ Execution Failed",
        description: error.message || "Failed to start tool execution",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopToolExecution = async () => {
    if (!session) return;

    setIsStopping(true);

    try {
      const response = await fetch(`/api/execution/stop/${session.sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSession(null);
        toast({
          title: "🛑 Tool Stopped",
          description: `${tool.name} execution has been stopped`,
        });
        onExecutionStop?.();
      } else {
        throw new Error('Failed to stop tool execution');
      }

    } catch (error: any) {
      toast({
        title: "❌ Stop Failed",
        description: error.message || "Failed to stop tool execution",
        variant: "destructive"
      });
    } finally {
      setIsStopping(false);
    }
  };

  const openToolInterface = () => {
    if (session && session.status === 'running') {
      window.open(session.executionUrl, '_blank', 'width=1200,height=800');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-50 border-green-200';
      case 'starting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'stopped': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle2 className="h-4 w-4" />;
      case 'starting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{tool.name} - Execution</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time tool execution and monitoring
              </p>
            </div>
          </div>
          
          {session && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${getStatusColor(session.status)}`}>
              {getStatusIcon(session.status)}
              <span className="capitalize">{session.status}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Execution Controls */}
        <div className="flex items-center gap-2">
          {!session ? (
            <Button 
              onClick={startToolExecution}
              disabled={isStarting}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Tool
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={openToolInterface}
                disabled={session.status !== 'running'}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Interface
              </Button>
              
              <Button 
                onClick={stopToolExecution}
                disabled={isStopping}
                variant="destructive"
              >
                {isStopping ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Tool
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Starting Progress */}
        {isStarting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Initializing tool execution...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              {progress < 30 && "Setting up execution environment..."}
              {progress >= 30 && progress < 60 && "Installing dependencies..."}
              {progress >= 60 && progress < 90 && "Starting application..."}
              {progress >= 90 && "Almost ready..."}
            </p>
          </div>
        )}

        {/* Session Information */}
        {session && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {session.status === 'running' ? '🟢' : session.status === 'starting' ? '🟡' : '🔴'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {session.uptime > 0 ? formatUptime(session.uptime) : '0s'}
                </div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              
              {session.port && (
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">:{session.port}</div>
                  <div className="text-xs text-muted-foreground">Port</div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {session.logs.length}
                </div>
                <div className="text-xs text-muted-foreground">Log Entries</div>
              </div>
            </div>

            {/* Execution Logs */}
            {session.logs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <h4 className="font-medium">Execution Logs</h4>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>
                
                <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
                  {session.logs.slice(-10).map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">
                        [{new Date().toLocaleTimeString()}]
                      </span>{' '}
                      {log}
                    </div>
                  ))}
                  {session.status === 'running' && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-400">Tool is running...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(session.executionUrl, '_blank')}
                disabled={session.status !== 'running'}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Open in New Tab
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Refresh session status
                  fetch(`/api/execution/status/${session.sessionId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  }).then(res => res.json()).then(data => {
                    setSession(prev => prev ? { ...prev, ...data } : null);
                  });
                }}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Tool Information */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tool Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 capitalize">{tool.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>
              <span className="ml-2">v{tool.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <span className="ml-2">{tool.language || 'Auto-detected'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Framework:</span>
              <span className="ml-2">{tool.framework || 'None'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolExecutionInterface;
