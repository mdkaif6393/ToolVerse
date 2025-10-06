import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolData {
  name: string;
  description: string;
  category: string;
  files: File[];
  version: string;
}

export const ToolCreationWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [toolData, setToolData] = useState<ToolData>({
    name: '',
    description: '',
    category: '',
    files: [],
    version: '1.0.0'
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedExtensions = ['.zip', '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.json', '.html', '.css', '.md'];
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!allowedExtensions.includes(extension)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Process and validate files
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        try {
          // For text files, validate content
          if (file.type.startsWith('text/') || ['.js', '.ts', '.jsx', '.tsx', '.py'].some(ext => file.name.endsWith(ext))) {
            const content = await file.text();
            
            // Basic syntax validation for code files
            if (file.name.endsWith('.json')) {
              JSON.parse(content); // Will throw if invalid JSON
            }
          }
          
          return file;
        } catch (error) {
          toast({
            title: "File Processing Error",
            description: `Error processing ${file.name}: ${error.message}`,
            variant: "destructive"
          });
          return null;
        }
      })
    );
    
    const validProcessedFiles = processedFiles.filter(Boolean) as File[];
    
    setToolData(prev => ({
      ...prev,
      files: [...prev.files, ...validProcessedFiles]
    }));
    
    if (validProcessedFiles.length > 0) {
      toast({
        title: "Files Uploaded",
        description: `Successfully processed ${validProcessedFiles.length} file(s)`
      });
    }
  };

  const saveToolToStorage = async () => {
    setUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', toolData.name);
      formData.append('description', toolData.description);
      formData.append('category', toolData.category);
      formData.append('version', toolData.version);
      formData.append('slug', toolData.name.toLowerCase().replace(/\s+/g, '-'));
      formData.append('language', detectLanguage(toolData.files));
      formData.append('is_public', 'true');
      
      // Append all files
      toolData.files.forEach((file) => {
        formData.append('files', file);
      });

      // Store in localStorage as backup
      const toolMetadata = {
        id: Date.now().toString(),
        name: toolData.name,
        description: toolData.description,
        category: toolData.category,
        version: toolData.version,
        fileCount: toolData.files.length,
        createdAt: new Date().toISOString()
      };
      
      const existingTools = JSON.parse(localStorage.getItem('userTools') || '[]');
      existingTools.push(toolMetadata);
      localStorage.setItem('userTools', JSON.stringify(existingTools));

      // API call for server storage
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Tool Created Successfully",
        description: `${toolData.name} has been saved and processed with ${toolData.files.length} files.`
      });

      // Reset form
      setToolData({
        name: '',
        description: '',
        category: '',
        files: [],
        version: '1.0.0'
      });
      setStep(1);

    } catch (error) {
      console.error('Tool creation error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to save tool. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const detectLanguage = (files: File[]): string => {
    const extensions = files.map(f => f.name.split('.').pop()?.toLowerCase());
    
    if (extensions.includes('tsx') || extensions.includes('jsx')) return 'React';
    if (extensions.includes('ts')) return 'TypeScript';
    if (extensions.includes('js')) return 'JavaScript';
    if (extensions.includes('py')) return 'Python';
    if (extensions.includes('go')) return 'Go';
    if (extensions.includes('rs')) return 'Rust';
    if (extensions.includes('java')) return 'Java';
    
    return 'Other';
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Tool Name"
              value={toolData.name}
              onChange={(e) => setToolData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Textarea
              placeholder="Tool Description"
              value={toolData.description}
              onChange={(e) => setToolData(prev => ({ ...prev, description: e.target.value }))}
            />
            <Input
              placeholder="Category"
              value={toolData.category}
              onChange={(e) => setToolData(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload tool files
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                </label>
              </div>
            </div>
            
            {toolData.files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files ({toolData.files.length}):</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {toolData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setToolData(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  Total size: {(toolData.files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Ready to Create Tool</h4>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Name:</strong> {toolData.name}</p>
                <p><strong>Category:</strong> {toolData.category}</p>
                <p><strong>Files:</strong> {toolData.files.length} file(s)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Tool - Step {step} of 3</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStep()}
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!toolData.name || !toolData.description)) ||
                (step === 2 && toolData.files.length === 0)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={saveToolToStorage}
              disabled={uploading}
            >
              {uploading ? 'Creating...' : 'Create Tool'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};