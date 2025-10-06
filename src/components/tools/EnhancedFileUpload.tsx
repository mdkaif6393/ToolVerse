import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileCode, 
  X, 
  CheckCircle, 
  AlertCircle,
  File,
  Archive,
  Github
} from "lucide-react";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  uploadType?: 'files' | 'zip' | 'folder';
}

export const EnhancedFileUpload = ({ 
  onFilesSelected, 
  acceptedTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.json'],
  maxSize = 10,
  multiple = true,
  uploadType = 'files'
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `${file.name} is larger than ${maxSize}MB`,
        variant: "destructive"
      });
      return false;
    }

    // Type check for non-zip uploads
    if (uploadType !== 'zip' && uploadType !== 'folder') {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(extension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadedFiles(validFiles);
      onFilesSelected(validFiles);
      setUploadProgress(100);
      
      toast({
        title: "Upload successful! 🎉",
        description: `${validFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onFilesSelected, maxSize, acceptedTypes, uploadType, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getIcon = () => {
    switch (uploadType) {
      case 'zip': return Archive;
      case 'folder': return File;
      default: return FileCode;
    }
  };

  const getTitle = () => {
    switch (uploadType) {
      case 'zip': return 'Drop ZIP file here';
      case 'folder': return 'Select folder';
      default: return 'Drop files here or click to browse';
    }
  };

  const getDescription = () => {
    switch (uploadType) {
      case 'zip': return 'Upload a ZIP file containing your tool';
      case 'folder': return 'Select a folder containing your project files';
      default: return `Supported: ${acceptedTypes.join(', ')} • Max ${maxSize}MB per file`;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-4">
      <Card
        className={`
          border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
            : 'border-muted-foreground/25 dark:border-white/20'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary/50'}
          dark:bg-white/5
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && document.getElementById('file-input')?.click()}
      >
        <div className="p-8 text-center">
          <input
            id="file-input"
            type="file"
            multiple={multiple}
            accept={uploadType === 'zip' ? '.zip' : acceptedTypes.join(',')}
            {...(uploadType === 'folder' ? { webkitdirectory: '' } as any : {})}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          
          <Icon className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          
          <h4 className="text-lg font-medium mb-2 dark:text-white">
            {getTitle()}
          </h4>
          
          <p className="text-muted-foreground mb-4 dark:text-gray-300">
            {getDescription()}
          </p>
          
          {!isUploading && (
            <Button variant="outline" className="dark:border-white/20">
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card className="dark:bg-white/5 dark:border-white/10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium dark:text-white">
                Uploaded Files ({uploadedFiles.length})
              </h5>
              <Badge variant="secondary" className="dark:bg-white/10">
                {(uploadedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(1)} MB
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium dark:text-white">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};