import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, X, Merge } from "lucide-react";

interface MergeToolProps {
  onClose?: () => void;
}

const MergeTool: React.FC<MergeToolProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf'
      );
      
      if (newFiles.length !== e.target.files.length) {
        toast({
          title: "⚠️ Invalid Files",
          description: "Only PDF files are allowed",
          variant: "destructive"
        });
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast({
          title: "📄 Files Added",
          description: `${newFiles.length} PDF file(s) added successfully`,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      toast({
        title: "📄 Files Dropped",
        description: `${droppedFiles.length} PDF file(s) added successfully`,
      });
    } else {
      toast({
        title: "❌ Invalid Files",
        description: "Please drop only PDF files",
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "🗑️ File Removed",
      description: "File removed from merge list",
    });
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      toast({
        title: "❌ Insufficient Files",
        description: "Please select at least 2 PDF files to merge",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      toast({
        title: "🔄 Processing...",
        description: "Merging your PDF files",
      });

      const response = await fetch('/api/tools/merge-tool/merge', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Merge failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Success!",
        description: "PDF files merged successfully and downloaded",
      });

      // Clear files after successful merge
      setFiles([]);

    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "❌ Merge Failed",
        description: error instanceof Error ? error.message : "Failed to merge PDF files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    toast({
      title: "🗑️ Files Cleared",
      description: "All files removed from merge list",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Merge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              PDF Merger
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Combine multiple PDF documents into a single file
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload PDF Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop PDF files here' : 'Drag & drop PDF files'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files (PDF only)
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Maximum 10 files, 50MB each
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Selected Files ({files.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearAllFiles}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Button */}
      <div className="flex justify-center">
        <Button
          onClick={mergePDFs}
          disabled={files.length < 2 || isProcessing}
          className="px-8 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Merging PDFs...
            </>
          ) : (
            <>
              <Merge className="mr-2 h-5 w-5" />
              Merge {files.length} PDF{files.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use PDF Merger:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Upload at least 2 PDF files (drag & drop or click to browse)</li>
            <li>• Files will be merged in the order they appear in the list</li>
            <li>• Click "Merge PDFs" to combine all files into one document</li>
            <li>• The merged PDF will be automatically downloaded</li>
            <li>• Maximum file size: 50MB per file, up to 10 files total</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MergeTool;
