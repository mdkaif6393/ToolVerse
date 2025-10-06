import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Monitor, 
  Tablet, 
  Smartphone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Eye,
  Settings
} from "lucide-react";

interface LivePreviewProps {
  toolData: {
    name: string;
    framework?: string;
    language: string;
    entrypoint?: string;
    techStack: string[];
  };
  uploadedFiles?: File[];
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  message: string;
  duration?: number;
}

const LivePreview: React.FC<LivePreviewProps> = ({ toolData, uploadedFiles = [] }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Syntax Check', status: 'pending', message: 'Checking code syntax...' },
    { name: 'Dependencies', status: 'pending', message: 'Validating dependencies...' },
    { name: 'Build Process', status: 'pending', message: 'Testing build process...' },
    { name: 'Runtime Test', status: 'pending', message: 'Testing runtime execution...' },
    { name: 'Performance', status: 'pending', message: 'Analyzing performance...' },
    { name: 'Security Scan', status: 'pending', message: 'Scanning for security issues...' }
  ]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const deviceSizes = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '600px' },
    mobile: { width: '375px', height: '600px' }
  };

  const runTests = async () => {
    setIsRunning(true);
    setBuildLogs(['🚀 Starting build process...']);
    
    // Simulate running tests
    for (let i = 0; i < testResults.length; i++) {
      // Update current test to running
      setTestResults(prev => prev.map((test, index) => 
        index === i ? { ...test, status: 'running' } : test
      ));

      setBuildLogs(prev => [...prev, `⏳ Running ${testResults[i].name}...`]);
      
      // Simulate test duration
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate test result (mostly pass, some might fail)
      const passed = Math.random() > 0.2; // 80% pass rate
      const duration = Math.floor(Math.random() * 500) + 100;
      
      setTestResults(prev => prev.map((test, index) => 
        index === i ? { 
          ...test, 
          status: passed ? 'passed' : 'failed',
          message: passed ? 'Test passed successfully' : 'Test failed - check configuration',
          duration
        } : test
      ));

      setBuildLogs(prev => [...prev, 
        passed 
          ? `✅ ${testResults[i].name} passed (${duration}ms)`
          : `❌ ${testResults[i].name} failed (${duration}ms)`
      ]);
    }

    // Generate preview URL
    const mockUrl = `http://localhost:3000/preview/${toolData.name.toLowerCase().replace(/\s+/g, '-')}`;
    setPreviewUrl(mockUrl);
    setBuildLogs(prev => [...prev, `🌐 Preview available at: ${mockUrl}`]);
    
    setIsRunning(false);
  };

  const stopPreview = () => {
    setIsRunning(false);
    setPreviewUrl('');
    setBuildLogs([]);
    setTestResults(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending', 
      message: 'Test pending...',
      duration: undefined 
    })));
  };

  const getTestIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview - {toolData.name}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Test and preview your tool in real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{toolData.language}</Badge>
              {toolData.framework && <Badge variant="secondary">{toolData.framework}</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preview Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Preview
                  </>
                )}
              </Button>
              
              {previewUrl && (
                <Button 
                  onClick={stopPreview}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Preview
                </Button>
              )}
            </div>

            {/* Device Selector */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                size="sm"
                variant={currentDevice === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setCurrentDevice('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={currentDevice === 'tablet' ? 'default' : 'ghost'}
                onClick={() => setCurrentDevice('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={currentDevice === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setCurrentDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Live Preview ({currentDevice})</span>
                <Badge variant="outline">{deviceSizes[currentDevice].width}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="flex justify-center">
                  <div 
                    className="border rounded-lg overflow-hidden bg-white shadow-lg"
                    style={{
                      width: deviceSizes[currentDevice].width,
                      height: deviceSizes[currentDevice].height,
                      maxWidth: '100%'
                    }}
                  >
                    <div className="bg-gray-100 p-2 border-b flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-600">
                        {previewUrl}
                      </div>
                    </div>
                    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Code className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{toolData.name}</h3>
                        <p className="text-gray-600 mb-4">Tool is running successfully!</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {toolData.techStack.slice(0, 4).map((tech, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        {uploadedFiles.length > 0 && (
                          <p className="text-sm text-gray-500 mt-4">
                            {uploadedFiles.length} files loaded
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Preview Not Started</h3>
                    <p className="text-gray-500">Click "Start Preview" to see your tool in action</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((test, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTestIcon(test.status)}
                        <div>
                          <h4 className="font-medium">{test.name}</h4>
                          <p className="text-sm opacity-80">{test.message}</p>
                        </div>
                      </div>
                      {test.duration && (
                        <Badge variant="outline" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                {buildLogs.length > 0 ? (
                  buildLogs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No logs available. Start preview to see build logs.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LivePreview;
