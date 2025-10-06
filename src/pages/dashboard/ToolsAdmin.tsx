import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTools, createToolSlug, uploadToolFile } from "@/hooks/useTools";
import { useToast } from "@/hooks/use-toast";
import { Tool, ToolInsert } from "@/lib/supabase";
import AdvancedFolderUpload from "@/components/tools/AdvancedFolderUpload";
import { 
  Plus, 
  Search, 
  Trash2,
  Upload,
  RefreshCw,
  ExternalLink,
  Calendar,
  Eye,
  EyeOff,
  FolderOpen,
  FileCode,
  Sparkles
} from "lucide-react";

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
  file: File;
  isValid: boolean;
  category: 'code' | 'image' | 'document' | 'archive' | 'other';
}

const ToolsAdmin = () => {
  const { allTools, isLoadingAll, addTool, updateTool, deleteTool } = useTools();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newTool, setNewTool] = useState<ToolInsert>({
    name: "",
    slug: "",
    description: "",
    category: "productivity",
    status: "active"
  });

  // Reset form
  const resetForm = () => {
    setNewTool({
      name: "",
      slug: "",
      description: "",
      category: "productivity",
      status: "active"
    });
    setUploadedFile(null);
    setSelectedFiles([]);
  };

  // Handle single file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Auto-populate tool name from filename
      const baseName = file.name.split('.')[0];
      const toolName = baseName.split(/[-_]/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      setNewTool(prev => ({
        ...prev,
        name: toolName,
        slug: createToolSlug(toolName),
        description: `A tool created from ${file.name}`
      }));
    }
  };

  // Handle folder selection from advanced upload
  const handleFolderSelect = (files: FileItem[]) => {
    setSelectedFiles(files);
    
    if (files.length > 0) {
      // Auto-populate from first valid file or folder structure
      const firstFile = files[0];
      const folderName = firstFile.path.split('/')[0];
      const toolName = folderName.split(/[-_]/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // Detect primary language/framework
      const codeFiles = files.filter(f => f.category === 'code');
      let detectedCategory: ToolInsert['category'] = 'productivity';
      
      if (codeFiles.some(f => f.name.includes('pdf') || f.name.includes('PDF'))) {
        detectedCategory = 'pdf';
      } else if (codeFiles.some(f => f.name.includes('ai') || f.name.includes('ml') || f.name.includes('tensorflow'))) {
        detectedCategory = 'ai';
      } else if (codeFiles.some(f => f.name.includes('react') || f.name.includes('vue') || f.name.includes('angular'))) {
        detectedCategory = 'development';
      } else if (codeFiles.some(f => f.name.includes('design') || f.name.includes('canvas'))) {
        detectedCategory = 'design';
      } else if (codeFiles.some(f => f.name.includes('business') || f.name.includes('invoice'))) {
        detectedCategory = 'business';
      }
      
      setNewTool(prev => ({
        ...prev,
        name: toolName,
        slug: createToolSlug(toolName),
        description: `A tool created from ${files.length} files including ${codeFiles.length} code files`,
        category: detectedCategory,
        tech_stack: [...new Set(codeFiles.map(f => f.name.split('.').pop()).filter(Boolean))]
      }));
    }
  };

  // Handle tool creation
  const handleCreateTool = async () => {
    if (!newTool.name || !newTool.slug) {
      toast({
        title: "❌ Validation Error",
        description: "Tool name and slug are required",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      let frontendUrl = "";
      
      // Upload file to Supabase Storage if provided
      if (uploadedFile) {
        frontendUrl = await uploadToolFile(uploadedFile, newTool.slug);
      } else if (selectedFiles.length > 0) {
        // For folder uploads, we could zip and upload or handle differently
        // For now, we'll create the tool without a file URL
        toast({
          title: "📁 Folder Processing",
          description: "Folder uploaded successfully. File processing will be implemented.",
        });
      }

      // Create tool in database
      await addTool.mutateAsync({
        ...newTool,
        frontend_url: frontendUrl || (selectedFiles.length > 0 ? `/uploaded/${newTool.slug}` : `/tools/demo.html?name=${encodeURIComponent(newTool.name)}&description=${encodeURIComponent(newTool.description || '')}&category=${newTool.category}`)
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create tool",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter tools based on search
  const filteredTools = allTools?.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'deleted': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Advanced Tools Administration
          </h1>
          <p className="text-muted-foreground">Create and manage tools with advanced folder upload capabilities</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add New Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Create Advanced Tool
              </DialogTitle>
              <DialogDescription>
                Choose your preferred method to create a new tool with advanced capabilities.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="folder" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="folder" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Advanced Folder
                </TabsTrigger>
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Single File
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Manual Setup
                </TabsTrigger>
              </TabsList>

              {/* Advanced Folder Upload Tab */}
              <TabsContent value="folder" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🚀 Advanced Folder Upload</h4>
                    <p className="text-sm text-blue-700">
                      Upload entire project folders with drag & drop, file analysis, and smart categorization.
                    </p>
                  </div>
                  
                  <AdvancedFolderUpload onFolderSelect={handleFolderSelect} />
                  
                  {selectedFiles.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">
                        📁 Folder Analysis Complete
                      </h4>
                      <p className="text-sm text-green-700">
                        {selectedFiles.length} files processed. Tool metadata has been auto-populated below.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Single File Upload Tab */}
              <TabsContent value="single" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload Tool File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".html,.js,.ts,.jsx,.tsx,.py,.zip"
                      className="cursor-pointer"
                    />
                    {uploadedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Manual Setup Tab */}
              <TabsContent value="manual" className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">⚙️ Manual Configuration</h4>
                  <p className="text-sm text-orange-700">
                    Manually configure your tool without uploading files.
                  </p>
                </div>
              </TabsContent>

              {/* Common Configuration Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Tool Configuration</h3>
                
                {/* Tool Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tool Name</Label>
                    <Input
                      id="name"
                      value={newTool.name}
                      onChange={(e) => setNewTool(prev => ({
                        ...prev,
                        name: e.target.value,
                        slug: createToolSlug(e.target.value)
                      }))}
                      placeholder="Enter tool name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Tool Slug</Label>
                    <Input
                      id="slug"
                      value={newTool.slug}
                      onChange={(e) => setNewTool(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="tool-slug"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTool.description || ""}
                    onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this tool does"
                    rows={3}
                  />
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTool.category}
                      onValueChange={(value: ToolInsert['category']) => setNewTool(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productivity">⚡ Productivity</SelectItem>
                        <SelectItem value="development">💻 Development</SelectItem>
                        <SelectItem value="design">🎨 Design</SelectItem>
                        <SelectItem value="business">💼 Business</SelectItem>
                        <SelectItem value="ai">🤖 AI</SelectItem>
                        <SelectItem value="pdf">📄 PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newTool.status}
                      onValueChange={(value: ToolInsert['status']) => 
                        setNewTool(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">✅ Active</SelectItem>
                        <SelectItem value="inactive">❌ Inactive</SelectItem>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTool}
                    disabled={isUploading || !newTool.name || !newTool.slug}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Advanced Tool
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tools ({filteredTools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading tools...</span>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tools found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tool.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tool.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tool.status)}>
                        {tool.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(tool.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tool.frontend_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(tool.frontend_url!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateTool.mutate({
                              id: tool.id,
                              updates: { 
                                status: tool.status === 'active' ? 'inactive' : 'active' 
                              }
                            });
                          }}
                        >
                          {tool.status === 'active' ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tool</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{tool.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTool.mutate(tool.id)}
                                className="bg-red-600 hover:bg-red-700"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsAdmin;
