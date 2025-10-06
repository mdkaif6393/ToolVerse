import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Folder, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileCode,
  FileImage,
  FileText,
  Archive,
  RefreshCw,
  Eye,
  Download,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List
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

interface FolderStructure {
  [key: string]: FileItem[] | FolderStructure;
}

const AdvancedFolderUpload = ({ onFolderSelect }: { onFolderSelect: (files: FileItem[]) => void }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // File type detection
  const getFileCategory = (fileName: string, mimeType: string): FileItem['category'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml'].includes(ext || '')) {
      return 'code';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext || '')) {
      return 'image';
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext || '')) {
      return 'document';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return 'archive';
    }
    return 'other';
  };

  // File validation
  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'text/', 'application/json', 'application/javascript', 'application/typescript',
      'image/', 'application/pdf', 'application/zip', 'application/x-zip-compressed'
    ];
    
    if (file.size > maxSize) return false;
    return allowedTypes.some(type => file.type.startsWith(type)) || 
           Boolean(file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs|html|css|scss|json|xml|yaml|yml|md|txt)$/i));
  };

  // Process uploaded files
  const processFiles = useCallback(async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const fileItems: FileItem[] = [];
    const structure: FolderStructure = {};
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValid = validateFile(file);
      
      const fileItem: FileItem = {
        name: file.name,
        path: (file as any).webkitRelativePath || file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        file,
        isValid,
        category: getFileCategory(file.name, file.type)
      };
      
      fileItems.push(fileItem);
      
      // Build folder structure
      const pathParts = fileItem.path.split('/');
      let current = structure;
      
      for (let j = 0; j < pathParts.length - 1; j++) {
        const folder = pathParts[j];
        if (!current[folder]) {
          current[folder] = {};
        }
        current = current[folder] as FolderStructure;
      }
      
      const fileName = pathParts[pathParts.length - 1];
      if (!current[fileName]) {
        current[fileName] = [];
      }
      (current[fileName] as FileItem[]).push(fileItem);
      
      setUploadProgress(((i + 1) / files.length) * 100);
    }
    
    setSelectedFiles(fileItems);
    setFolderStructure(structure);
    setIsUploading(false);
    
    toast({
      title: "📁 Folder Uploaded Successfully!",
      description: `${fileItems.length} files processed. ${fileItems.filter(f => f.isValid).length} valid files found.`,
    });
    
    onFolderSelect(fileItems.filter(f => f.isValid));
  }, [onFolderSelect, toast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];
    
    const processEntry = (entry: any, path = '') => {
      return new Promise<void>((resolve) => {
        if (entry.isFile) {
          entry.file((file: File) => {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            });
            files.push(file);
            resolve();
          });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          reader.readEntries((entries: any[]) => {
            Promise.all(entries.map(e => processEntry(e, path + entry.name + '/'))).then(() => resolve());
          });
        } else {
          resolve();
        }
      });
    };
    
    Promise.all(items.map(item => {
      const entry = item.webkitGetAsEntry();
      return entry ? processEntry(entry) : Promise.resolve();
    })).then(() => {
      if (files.length > 0) {
        const fileList = new DataTransfer();
        files.forEach(file => fileList.items.add(file));
        processFiles(fileList.files);
      }
    });
  }, [processFiles]);

  // File input handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Filter files
  const filteredFiles = selectedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get file icon
  const getFileIcon = (category: FileItem['category']) => {
    switch (category) {
      case 'code': return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'image': return <FileImage className="h-4 w-4 text-green-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'archive': return <Archive className="h-4 w-4 text-purple-500" />;
      default: return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get category stats
  const categoryStats = selectedFiles.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className={`transition-all duration-200 ${isDragOver ? 'border-primary bg-primary/5' : ''}`}>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <FolderOpen className="h-8 w-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragOver ? 'Drop folder here!' : 'Advanced Folder Upload'}
                </h3>
                <p className="text-muted-foreground">
                  Drag & drop a folder here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: Code files, Images, Documents, Archives (Max 50MB per file)
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Folder
                  </>
                )}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: "", directory: "" } as any)}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Analysis */}
      {selectedFiles.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                    <p className="text-2xl font-bold">{selectedFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Files</p>
                    <p className="text-2xl font-bold">{selectedFiles.filter(f => f.isValid).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Code Files</p>
                    <p className="text-2xl font-bold">{categoryStats.code || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Size</p>
                    <p className="text-2xl font-bold">
                      {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>File Explorer</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="code">Code Files</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="archive">Archives</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryStats).map(([category, count]) => (
                  <Badge key={category} variant="outline" className="capitalize">
                    {getFileIcon(category as FileItem['category'])}
                    <span className="ml-1">{category}: {count}</span>
                  </Badge>
                ))}
              </div>

              <Separator />

              {/* File List */}
              <ScrollArea className="h-96">
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                  {filteredFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        file.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      } ${viewMode === 'grid' ? 'flex-col text-center' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.category)}
                        {file.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center' : ''}`}>
                        <p className="font-medium text-sm truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={file.path}>
                          {file.path}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvancedFolderUpload;
