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
  FileCode
} from "lucide-react";

const ToolsAdmin = () => {
  const { allTools, isLoadingAll, addTool, updateTool, deleteTool } = useTools();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
  };

  // Handle file upload
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
      }

      // Create tool in database
      await addTool.mutateAsync({
        ...newTool,
        frontendUrl: frontendUrl || undefined
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
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tools Administration
          </h1>
          <p className="text-muted-foreground">Manage your tools and their configurations</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add New Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tool</DialogTitle>
              <DialogDescription>
                Choose your preferred method to create a new tool.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Single File
                </TabsTrigger>
                <TabsTrigger value="folder" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Advanced Folder
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Manual Setup
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <div className="space-y-4">
              {/* File Upload */}
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

              {/* Tool Name */}
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

              {/* Tool Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Tool Slug</Label>
                <Input
                  id="slug"
                  value={newTool.slug}
                  onChange={(e) => setNewTool(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tool-slug"
                />
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

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newTool.category}
                  onValueChange={(value) => setNewTool(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newTool.status}
                  onValueChange={(value: 'active' | 'inactive' | 'draft') => 
                    setNewTool(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
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
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tool
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                        {tool.frontendUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(tool.frontendUrl!, '_blank')}
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
