import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FolderOpen, 
  GitBranch, 
  Archive, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Folder,
  FileCode,
  TestTube,
  FileText,
  Settings,
  Package,
  RefreshCw,
  Download,
  Eye,
  Zap
} from 'lucide-react';
import { ToolDetectionEngine, MultiToolAnalysis, DetectedTool } from '@/utils/toolDetection';

interface MultiToolUploadProps {
  onToolsDetected: (tools: DetectedTool[]) => void;
  onAnalysisComplete: (analysis: MultiToolAnalysis) => void;
}

const MultiToolUpload: React.FC<MultiToolUploadProps> = ({ 
  onToolsDetected, 
  onAnalysisComplete 
}) => {
  const { toast } = useToast();
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysis, setAnalysis] = useState<MultiToolAnalysis | null>(null);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [githubUrl, setGithubUrl] = useState('');

  // Handle ZIP file upload
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a ZIP file",
        variant: "destructive"
      });
      return;
    }

    await analyzeUploadedFile(file);
  };

  // Handle folder upload (multiple files)
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Create a virtual ZIP from folder files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    files.forEach(file => {
      // Preserve folder structure using webkitRelativePath
      const path = (file as any).webkitRelativePath || file.name;
      zip.file(path, file);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], 'uploaded-folder.zip', { type: 'application/zip' });
    
    await analyzeUploadedFile(zipFile);
  };

  // Analyze uploaded file
  const analyzeUploadedFile = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await ToolDetectionEngine.analyzeZipFile(file);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      console.log('Analysis result:', result);

      setAnalysis(result);
      onAnalysisComplete(result);

      // Auto-select all tools initially
      const toolPaths = new Set(result.detectedTools.map(tool => tool.path));
      setSelectedTools(toolPaths);

      toast({
        title: "Analysis Complete! 🎉",
        description: `Found ${result.totalTools} tools in your project`,
      });

    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the uploaded file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle GitHub import
  const handleGithubImport = async () => {
    if (!githubUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Extract repo info from URL
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = match;
      
      // For demo purposes, simulate GitHub import
      // In real implementation, this would use GitHub API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "GitHub Import",
        description: "GitHub import feature coming soon! For now, please download and upload as ZIP.",
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import from GitHub. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle tool selection
  const toggleToolSelection = (toolPath: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolPath)) {
      newSelected.delete(toolPath);
    } else {
      newSelected.add(toolPath);
    }
    setSelectedTools(newSelected);
  };

  // Select/Deselect all tools
  const toggleAllTools = () => {
    if (selectedTools.size === analysis?.detectedTools.length) {
      setSelectedTools(new Set());
    } else {
      setSelectedTools(new Set(analysis?.detectedTools.map(tool => tool.path) || []));
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get confidence icon
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle2 className="h-4 w-4" />;
    if (confidence >= 0.7) return <AlertTriangle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  // Create selected tools
  const createSelectedTools = () => {
    if (!analysis) return;
    
    const selectedToolsList = analysis.detectedTools.filter(tool => 
      selectedTools.has(tool.path)
    );
    
    onToolsDetected(selectedToolsList);
  };

  return (
    <div className="space-y-6">
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ZIP Upload */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => zipInputRef.current?.click()}>
          <CardHeader className="text-center">
            <Archive className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle className="text-lg">ZIP Upload</CardTitle>
            <CardDescription>
              Upload a ZIP file containing your tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={zipInputRef}
              onChange={handleZipUpload}
              accept=".zip"
              className="hidden"
            />
            <Button className="w-full" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Choose ZIP File
            </Button>
          </CardContent>
        </Card>

        {/* Folder Upload */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => folderInputRef.current?.click()}>
          <CardHeader className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle className="text-lg">Folder Upload</CardTitle>
            <CardDescription>
              Upload a folder with multiple tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderUpload}
              // @ts-ignore - webkitdirectory is not in TypeScript types
              webkitdirectory=""
              multiple
              className="hidden"
            />
            <Button className="w-full" variant="outline">
              <Folder className="mr-2 h-4 w-4" />
              Choose Folder
            </Button>
          </CardContent>
        </Card>

        {/* GitHub Import */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="text-center">
            <GitBranch className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle className="text-lg">GitHub Import</CardTitle>
            <CardDescription>
              Import directly from GitHub repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="url"
              placeholder="https://github.com/user/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleGithubImport}
              disabled={isAnalyzing}
            >
              <Download className="mr-2 h-4 w-4" />
              Import Repository
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-medium mb-2">Analyzing Project Structure...</h3>
                <Progress value={analysisProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {analysisProgress < 30 && "Extracting files..."}
                  {analysisProgress >= 30 && analysisProgress < 60 && "Detecting tools..."}
                  {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing dependencies..."}
                  {analysisProgress >= 90 && "Finalizing analysis..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Project Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.totalTools}</div>
                  <div className="text-sm text-muted-foreground">Tools Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.projectStructure.totalFiles}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analysis.projectStructure.toolDirectories}</div>
                  <div className="text-sm text-muted-foreground">Directories</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {analysis.projectStructure.type}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Project Type</div>
                </div>
              </div>

              {analysis.projectStructure.sharedDependencies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Shared Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.projectStructure.sharedDependencies.map((dep, index) => (
                      <Badge key={index} variant="secondary">{dep}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.projectStructure.buildSystems.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Build Systems</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.projectStructure.buildSystems.map((system, index) => (
                      <Badge key={index} variant="outline">{system}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="text-primary mt-0.5">•</div>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tool Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detected Tools ({analysis.detectedTools.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedTools.size} of {analysis.detectedTools.length} selected
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={toggleAllTools}
                  >
                    {selectedTools.size === analysis.detectedTools.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.detectedTools.map((tool, index) => (
                  <Card key={index} className={`transition-all ${
                    selectedTools.has(tool.path) ? 'ring-2 ring-primary ring-opacity-50' : ''
                  }`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTools.has(tool.path)}
                          onCheckedChange={() => toggleToolSelection(tool.path)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          {/* Tool Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-lg">{tool.name}</h3>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {tool.path === '.' ? '📁 Root Level' : `📂 ${tool.path}`}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {tool.language}
                                </Badge>
                                {tool.framework && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tool.framework}
                                  </Badge>
                                )}
                                {tool.path === '.' && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Mixed Project
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${getConfidenceColor(tool.confidence)}`}>
                              {getConfidenceIcon(tool.confidence)}
                              {Math.round(tool.confidence * 100)}%
                            </div>
                          </div>

                          {/* Tech Stack */}
                          {tool.techStack.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Tech Stack</h4>
                              <div className="flex flex-wrap gap-1">
                                {tool.techStack.map((tech, techIndex) => (
                                  <Badge key={techIndex} variant="outline" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Features */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              {tool.files.length} files
                            </div>
                            {tool.hasTests && (
                              <div className="flex items-center gap-1 text-green-600">
                                <TestTube className="h-3 w-3" />
                                Tests
                              </div>
                            )}
                            {tool.hasConfig && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Settings className="h-3 w-3" />
                                Config
                              </div>
                            )}
                            {tool.hasDocumentation && (
                              <div className="flex items-center gap-1 text-purple-600">
                                <FileText className="h-3 w-3" />
                                Docs
                              </div>
                            )}
                            {tool.entryPoint && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {tool.entryPoint}
                              </div>
                            )}
                          </div>

                          {/* Dependencies */}
                          {tool.dependencies.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Dependencies</h4>
                              <div className="flex flex-wrap gap-1">
                                {tool.dependencies.slice(0, 5).map((dep, depIndex) => (
                                  <Badge key={depIndex} variant="outline" className="text-xs">
                                    {dep}
                                  </Badge>
                                ))}
                                {tool.dependencies.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tool.dependencies.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {selectedTools.size > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Ready to create {selectedTools.size} tool{selectedTools.size !== 1 ? 's' : ''}
                  </div>
                  <Button 
                    onClick={createSelectedTools}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create {selectedTools.size} Tool{selectedTools.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiToolUpload;
