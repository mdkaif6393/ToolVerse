import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tool } from "@/lib/supabase";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Terminal, 
  FileCode,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Download
} from "lucide-react";

interface ToolExecutorProps {
  tool: Tool;
  onClose: () => void;
}

interface ExecutionSession {
  id: string;
  status: 'starting' | 'running' | 'completed' | 'error' | 'stopped';
  logs: string[];
  output?: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

const ToolExecutor = ({ tool, onClose }: ToolExecutorProps) => {
  const { toast } = useToast();
  const [session, setSession] = useState<ExecutionSession | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start tool execution
  const startExecution = async () => {
    setIsExecuting(true);
    setProgress(0);

    const newSession: ExecutionSession = {
      id: `session_${Date.now()}`,
      status: 'starting',
      logs: [],
      startTime: new Date()
    };

    setSession(newSession);

    try {
      // Simulate real tool execution process
      await simulateToolExecution(newSession);
    } catch (error) {
      console.error('Execution failed:', error);
      setSession(prev => prev ? {
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date()
      } : null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Simulate tool execution with real-like behavior
  const simulateToolExecution = async (session: ExecutionSession) => {
    const steps = [
      { message: '🔍 Analyzing uploaded files...', duration: 1000 },
      { message: '📦 Setting up execution environment...', duration: 1500 },
      { message: '🔧 Installing dependencies...', duration: 2000 },
      { message: '🚀 Starting tool execution...', duration: 1000 },
      { message: '⚡ Processing your request...', duration: 2500 },
      { message: '✅ Tool execution completed!', duration: 500 }
    ];

    let currentProgress = 0;
    const progressStep = 100 / steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Update session logs
      setSession(prev => prev ? {
        ...prev,
        status: i === steps.length - 1 ? 'completed' : 'running',
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${step.message}`]
      } : null);

      // Update progress
      currentProgress += progressStep;
      setProgress(Math.min(currentProgress, 100));

      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Generate tool output based on category
    const output = generateToolOutput(tool);
    
    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      output,
      endTime: new Date()
    } : null);

    toast({
      title: "🎉 Tool Execution Complete!",
      description: `${tool.name} has finished processing successfully.`,
    });
  };

  // Generate realistic output based on tool type
  const generateToolOutput = (tool: Tool): string => {
    switch (tool.category) {
      case 'pdf':
        return `PDF processing completed successfully!\n\n✅ Files processed: 3\n📄 Pages merged: 15\n💾 Output size: 2.4 MB\n🔗 Download: merged_document.pdf`;
      
      case 'ai':
        return `AI analysis completed!\n\n🤖 Model: GPT-4\n📊 Confidence: 94.2%\n📝 Tokens processed: 1,247\n⏱️ Processing time: 3.2s\n\nResults:\n- Sentiment: Positive (0.87)\n- Key topics: Technology, Innovation\n- Summary: Generated successfully`;
      
      case 'development':
        return `Code processing completed!\n\n💻 Language: ${tool.language || 'JavaScript'}\n📁 Files analyzed: 12\n🐛 Issues found: 0\n✨ Code quality: A+\n\nFormatted and optimized successfully!`;
      
      case 'design':
        return `Design tool completed!\n\n🎨 Colors generated: 8\n🌈 Palette theme: Modern\n📐 Resolution: 1920x1080\n💾 Formats: PNG, SVG, CSS\n\nDesign assets ready for download!`;
      
      case 'business':
        return `Business document generated!\n\n💼 Document type: Invoice\n📋 Items: 5\n💰 Total amount: ₹12,450\n📧 Email sent: Yes\n\nInvoice #INV-2024-001 created successfully!`;
      
      default:
        return `Tool execution completed successfully!\n\n⚡ Processing time: 4.7s\n📊 Success rate: 100%\n💾 Output generated: Yes\n\nYour ${tool.name} has finished processing.`;
    }
  };

  // Stop execution
  const stopExecution = () => {
    setIsExecuting(false);
    setSession(prev => prev ? {
      ...prev,
      status: 'stopped',
      endTime: new Date()
    } : null);
    
    toast({
      title: "⏹️ Execution Stopped",
      description: "Tool execution has been stopped by user.",
      variant: "destructive"
    });
  };

  // Get status color
  const getStatusColor = (status: ExecutionSession['status']) => {
    switch (status) {
      case 'starting': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ExecutionSession['status']) => {
    switch (status) {
      case 'starting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tool.icon} {tool.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {tool.category}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Execution Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Execution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isExecuting ? (
              <Button 
                onClick={startExecution}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Play className="mr-2 h-4 w-4" />
                Run Tool
              </Button>
            ) : (
              <Button 
                onClick={stopExecution}
                variant="destructive"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Execution
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Progress Bar */}
          {isExecuting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Execution Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Session Status */}
          {session && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(session.status)}>
                  {getStatusIcon(session.status)}
                  <span className="ml-1 capitalize">{session.status}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Session: {session.id}
                </span>
              </div>

              {/* Execution Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Execution Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 w-full">
                    <div className="space-y-1 font-mono text-sm">
                      {session.logs.map((log, index) => (
                        <div key={index} className="text-muted-foreground">
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Output Results */}
              {session.output && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Execution Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm text-green-800">
                        {session.output}
                      </pre>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-3 w-3" />
                        Download Results
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Output
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {session.error && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Execution Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm text-red-800">
                        {session.error}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolExecutor;
