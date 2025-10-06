import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTools } from "@/hooks/useTools";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import LivePreview from "@/components/tools/LivePreview";
import ToolAnalytics from "@/components/tools/ToolAnalytics";
import DependencyManager from "@/components/tools/DependencyManager";
import ToolVersioning from "@/components/tools/ToolVersioning";
import MultiToolUpload from "@/components/tools/MultiToolUpload";
import EnhancedFileUpload from "@/components/tools/EnhancedFileUpload";
import { DetectedTool, MultiToolAnalysis } from "@/utils/toolDetection";
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Power, 
  PowerOff, 
  Trash2,
  Upload,
  FileCode,
  CheckCircle,
  X,
  RefreshCw,
  Settings,
  Monitor,
  Package,
  Archive,
  BarChart3,
  GitBranch,
  Zap,
  TestTube,
  Activity
} from "lucide-react";

const ToolsAdmin = () => {
  const { allTools, isLoadingAll, updateToolStatus, createTool, deleteTool } = useTools();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Helper functions for file analysis
  const getLanguageFromFiles = (files: File[]): string => {
    const extensions = files.map(f => f.name.split('.').pop()?.toLowerCase());
    if (extensions.includes('ts') || extensions.includes('tsx')) return 'TypeScript';
    if (extensions.includes('js') || extensions.includes('jsx')) return 'JavaScript';
    if (extensions.includes('py')) return 'Python';
    if (extensions.includes('go')) return 'Go';
    if (extensions.includes('rs')) return 'Rust';
    if (extensions.includes('java')) return 'Java';
    return 'Unknown';
  };

  const getFrameworkFromFiles = (files: File[]): string => {
    const fileNames = files.map(f => f.name.toLowerCase());
    if (fileNames.some(f => f.includes('react') || f.includes('jsx') || f.includes('tsx'))) return 'React';
    if (fileNames.some(f => f.includes('vue'))) return 'Vue.js';
    if (fileNames.some(f => f.includes('angular'))) return 'Angular';
    if (fileNames.some(f => f.includes('next'))) return 'Next.js';
    if (fileNames.some(f => f.includes('django'))) return 'Django';
    if (fileNames.some(f => f.includes('flask'))) return 'Flask';
    return 'Unknown';
  };

  const getTechStackFromFiles = (files: File[]): string[] => {
    const stack: string[] = [];
    const language = getLanguageFromFiles(files);
    const framework = getFrameworkFromFiles(files);
    
    if (language !== 'Unknown') stack.push(language);
    if (framework !== 'Unknown') stack.push(framework);
    
    return stack;
  };

  const [showPreview, setShowPreview] = useState(false);
  const [detectedTools, setDetectedTools] = useState<DetectedTool[]>([]);
  const [multiToolAnalysis, setMultiToolAnalysis] = useState<MultiToolAnalysis | null>(null);
  const [selectedUploadMethod, setSelectedUploadMethod] = useState<'single' | 'multi' | 'manual'>('manual');
  const [isCreatingMultipleTools, setIsCreatingMultipleTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newTool, setNewTool] = useState({
    slug: "",
    name: "",
    description: "",
    category: "productivity",
    icon: "Zap",
    version: "1.0.0",
    permissions: ["user"],
    ui_component: "",
    status: "disabled" as const,
    manifest: {},
    metadata: {},
    entrypoint: null as string | null
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const allowedFileTypes = [
    '.js', '.jsx', '.ts', '.tsx', // JavaScript/TypeScript
    '.py', '.pyx', // Python
    '.go', // Go
    '.rs', // Rust
    '.java', '.kt', // Java/Kotlin
    '.cpp', '.c', '.h', // C/C++
    '.php', // PHP
    '.rb', // Ruby
    '.cs', // C#
    '.html', '.css', '.json', '.xml', '.yaml', '.yml', // Config files
    '.md', '.txt' // Documentation
  ];

  // ZIP Upload Handler
  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { ToolDetectionEngine } = await import('@/utils/toolDetection');
      const analysis = await ToolDetectionEngine.analyzeZipFile(file);
      setMultiToolAnalysis(analysis);
      setDetectedTools(analysis.detectedTools);
      
      toast({
        title: "ZIP Analysis Complete! 🎉",
        description: `Found ${analysis.totalTools} tools in your project`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze ZIP file. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Folder Upload Handler
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      // Convert FileList to analysis format
      const mockAnalysis: MultiToolAnalysis = {
        projectStructure: {
          type: files.length > 10 ? 'monorepo' : 'multi-tool',
          totalFiles: files.length,
          rootFiles: files.filter(f => !f.webkitRelativePath.includes('/')).map(f => f.name),
          hasPackageJson: files.some(f => f.name === 'package.json'),
          hasRequirementsTxt: files.some(f => f.name === 'requirements.txt'),
          buildSystem: files.some(f => f.name === 'package.json') ? 'npm' : 'unknown'
        },
        detectedTools: [{
          name: files[0].webkitRelativePath.split('/')[0] || 'Folder Project',
          path: '.',
          confidence: 0.8,
          language: getLanguageFromFiles(files),
          framework: getFrameworkFromFiles(files),
          techStack: getTechStackFromFiles(files),
          entryPoint: files.find(f => f.name.includes('index') || f.name.includes('main'))?.name,
          hasTests: files.some(f => f.name.includes('test') || f.name.includes('spec')),
          hasConfig: files.some(f => f.name.includes('config')),
          hasDocumentation: files.some(f => f.name.toLowerCase().includes('readme')),
          dependencies: [],
          category: 'development',
          description: 'A tool created from folder upload',
          files: files.map(f => f.name)
        }],
        totalTools: 1,
        recommendations: ['Consider organizing files into separate tool directories for better structure']
      };

      setMultiToolAnalysis(mockAnalysis);
      setDetectedTools(mockAnalysis.detectedTools);
      
      toast({
        title: "Folder Analysis Complete! 📁",
        description: `Analyzed ${files.length} files from your folder`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze folder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const invalidFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !allowedFileTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: `Some files have unsupported formats: ${invalidFiles.map(f => f.name).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(files);
    
    // Auto-populate tool name from first file
    if (files.length > 0) {
      const firstFile = files[0];
      const baseName = firstFile.name.split('.')[0];
      const toolName = baseName.split(/[-_]/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      setNewTool(prev => ({
        ...prev,
        name: toolName,
        slug: baseName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ui_component: baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[-_]/g, ''),
        entrypoint: firstFile.name,
        description: `A tool created from ${firstFile.name}`
      }));
    }
  };

  const handleCreateTool = async () => {
    if (!newTool.slug || !newTool.name) {
      toast({
        title: "Validation Error",
        description: "Tool slug and name are required",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const toolData = {
        ...newTool,
        manifest: {
          version: newTool.version,
          files: uploadedFiles.map(f => f.name),
          file_names: uploadedFiles.map(f => f.name)
        }
      };

      await createTool.mutateAsync(toolData);
      
      // Reset form
      setIsCreateDialogOpen(false);
      setUploadedFiles([]);
      setShowPreview(false);
      setDetectedTools([]);
      setMultiToolAnalysis(null);
      setSelectedUploadMethod('manual');
      setNewTool({
        slug: "",
        name: "",
        description: "",
        category: "productivity",
        icon: "Zap",
        version: "1.0.0",
        permissions: ["user"],
        ui_component: "",
        status: "disabled",
        manifest: {},
        metadata: {},
        entrypoint: null
      });

      toast({
        title: "Success! 🎉",
        description: "Tool created successfully!",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tool. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredTools = allTools?.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tools Administration</h1>
          <p className="text-muted-foreground">Manage and configure platform tools</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create New Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Tool</DialogTitle>
              <DialogDescription>
                Add a new tool to the platform with files and configuration
              </DialogDescription>
            </DialogHeader>

            <Tabs value={selectedUploadMethod} onValueChange={(value) => setSelectedUploadMethod(value as 'single' | 'multi' | 'manual')} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Manual Setup
                </TabsTrigger>
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Smart Upload
                </TabsTrigger>
                <TabsTrigger value="multi" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  ZIP/Multi-Tool
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Manual File Upload</h3>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept={allowedFileTypes.join(',')}
                      className="hidden"
                    />
                    <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">Upload Code Files</h4>
                    <p className="text-muted-foreground mb-4">
                      Select your tool's source code files (.js, .ts, .py, .go, etc.)
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="single" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Smart File Upload</h3>
                  <div className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedFiles(files);
                        // Auto-populate from detected files
                        if (files.length > 0) {
                          const language = getLanguageFromFiles(files);
                          const framework = getFrameworkFromFiles(files);
                          const firstFile = files[0];
                          const baseName = firstFile.name.split('.')[0];
                          
                          setNewTool(prev => ({
                            ...prev,
                            name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
                            slug: baseName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                            description: `A ${language} tool${framework !== 'Unknown' ? ` built with ${framework}` : ''}`,
                            category: language === 'Python' ? 'ai' : language === 'JavaScript' || language === 'TypeScript' ? 'development' : 'productivity'
                          }));
                        }
                      }}
                      multiple
                      accept={allowedFileTypes.join(',')}
                      className="hidden"
                      id="smart-upload"
                    />
                    <FileCode className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h4 className="text-lg font-medium mb-2 text-green-800">Smart File Detection</h4>
                    <p className="text-green-700 mb-4">
                      Upload files - हम automatically detect करेंगे language और framework
                    </p>
                    <Button onClick={() => document.getElementById('smart-upload')?.click()} variant="outline" className="border-green-300">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="multi" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">ZIP/Folder Upload - Multi-Tool Detection</h3>
                  <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleZipUpload}
                      className="hidden"
                      id="zip-upload"
                    />
                    <input
                      type="file"
                      {...({ webkitdirectory: "" } as any)}
                      onChange={handleFolderUpload}
                      className="hidden"
                      id="folder-upload"
                    />
                    <Archive className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                    <h4 className="text-lg font-medium mb-2 text-blue-800">Upload Project Archive</h4>
                    <p className="text-blue-700 mb-4">
                      Upload ZIP file या folder - हम automatically multiple tools detect करेंगे
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => document.getElementById('zip-upload')?.click()} variant="outline" className="border-blue-300">
                        <Archive className="mr-2 h-4 w-4" />
                        Upload ZIP
                      </Button>
                      <Button onClick={() => document.getElementById('folder-upload')?.click()} variant="outline" className="border-blue-300">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Folder
                      </Button>
                    </div>
                  </div>
                  
                  {multiToolAnalysis && (
                    <div className="mt-4 p-4 border rounded-lg bg-white">
                      <h4 className="font-medium mb-3">Analysis Results:</h4>
                      <div className="space-y-2">
                        <p><strong>Project Type:</strong> {multiToolAnalysis.projectStructure.type}</p>
                        <p><strong>Total Files:</strong> {multiToolAnalysis.projectStructure.totalFiles}</p>
                        <p><strong>Tools Found:</strong> {multiToolAnalysis.totalTools}</p>
                      </div>
                      
                      {detectedTools.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Detected Tools:</h5>
                          <div className="space-y-2">
                            {detectedTools.map((tool, index) => (
                              <div key={index} className="p-3 border rounded bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h6 className="font-medium">{tool.name}</h6>
                                    <p className="text-sm text-gray-600">{tool.description}</p>
                                    <div className="flex gap-2 mt-1">
                                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">{tool.language}</span>
                                      {tool.framework && (
                                        <span className="text-xs bg-green-100 px-2 py-1 rounded">{tool.framework}</span>
                                      )}
                                      <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                                        {Math.round(tool.confidence * 100)}% confidence
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

              {/* Tool Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tool Configuration</h3>
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="max-h-32 overflow-y-auto border rounded p-3 bg-muted/30">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            <span>{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                setUploadedFiles(newFiles);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tool Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tool Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">Tool Slug *</Label>
                    <Input
                      id="slug"
                      value={newTool.slug}
                      onChange={(e) => setNewTool({ ...newTool, slug: e.target.value })}
                      placeholder="pdf-merger-tool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Tool Name *</Label>
                    <Input
                      id="name"
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                      placeholder="PDF Merger Tool"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTool.description}
                    onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                    placeholder="A powerful tool for merging PDF files..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTool.category} onValueChange={(value) => setNewTool({ ...newTool, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Tools</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="ai">AI Tools</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newTool.version}
                      onChange={(e) => setNewTool({ ...newTool, version: e.target.value })}
                      placeholder="1.0.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ui_component">UI Component Name</Label>
                  <Input
                    id="ui_component"
                    value={newTool.ui_component}
                    onChange={(e) => setNewTool({ ...newTool, ui_component: e.target.value })}
                    placeholder="MergePdfTool"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTool} 
                disabled={!newTool.slug || !newTool.name || isUploading}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Tool
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools List */}
      <div className="space-y-4">
        {isLoadingAll ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading tools...</span>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{tool.name}</CardTitle>
                      <Badge variant={tool.status === 'enabled' ? 'default' : tool.status === 'disabled' ? 'secondary' : 'outline'}>
                        {tool.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {tool.description || "No description"}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Slug: <code className="bg-muted px-1 rounded">{tool.slug}</code></span>
                      <span>Version: {tool.version}</span>
                      <span>Component: {tool.ui_component || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.status === 'enabled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateToolStatus.mutate({ id: tool.id, status: 'disabled' })}
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
                    )}
                    {tool.status === 'disabled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateToolStatus.mutate({ id: tool.id, status: 'enabled' })}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    {tool.status !== 'hidden' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateToolStatus.mutate({ id: tool.id, status: 'hidden' })}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    {tool.status === 'hidden' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateToolStatus.mutate({ id: tool.id, status: 'disabled' })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tool</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{tool.name}"? This action cannot be undone.
                            <br /><br />
                            <strong>क्या आप वाकई "{tool.name}" को delete करना चाहते हैं? यह action undo नहीं हो सकता।</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTool.mutate(tool.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteTool.isPending}
                          >
                            {deleteTool.isPending ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Tool
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ToolsAdmin;
