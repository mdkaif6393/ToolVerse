import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, X, Scissors } from "lucide-react";

interface SplitterToolProps {
  onClose?: () => void;
}

const SplitterTool: React.FC<SplitterToolProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [splitType, setSplitType] = useState<'pages' | 'range'>('pages');
  const [pageRange, setPageRange] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        toast({
          title: "📄 PDF Selected",
          description: `${selectedFile.name} ready to split`,
        });
      } else {
        toast({
          title: "❌ Invalid File",
          description: "Please select a PDF file",
          variant: "destructive"
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
      setFile(droppedFiles[0]);
      toast({
        title: "📄 PDF Dropped",
        description: `${droppedFiles[0].name} ready to split`,
      });
    } else {
      toast({
        title: "❌ Invalid File",
        description: "Please drop a PDF file",
        variant: "destructive"
      });
    }
  };

  const splitPDF = async () => {
    if (!file) {
      toast({
        title: "❌ No File Selected",
        description: "Please select a PDF file first",
        variant: "destructive"
      });
      return;
    }

    if (splitType === 'range' && !pageRange.trim()) {
      toast({
        title: "❌ Page Range Required",
        description: "Please enter page ranges (e.g., 1-5, 10-15)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('splitType', splitType);
      if (splitType === 'range') {
        formData.append('pageRanges', pageRange);
      }

      toast({
        title: "✂️ Splitting PDF...",
        description: "Processing your PDF file",
      });

      const response = await fetch('/api/tools/pdf-splitter/split', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Split failed');
      }

      // Handle ZIP file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'split-pdfs.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ PDF Split Successfully!",
        description: `Split files downloaded as ZIP archive`,
      });

      // Clear form after successful split
      setFile(null);
      setPageRange('');

    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "❌ Split Failed",
        description: error instanceof Error ? error.message : "Failed to split PDF",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Scissors className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              PDF Splitter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Split PDF into separate pages or extract specific page ranges
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
            Upload PDF File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <Scissors className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop PDF file here' : 'Drag & drop PDF file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files (PDF only)
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Maximum 100MB
              </Badge>
            </div>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Split Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={splitType === 'pages' ? 'default' : 'outline'}
              onClick={() => setSplitType('pages')}
              className="h-12"
            >
              Split by Pages
            </Button>
            <Button
              variant={splitType === 'range' ? 'default' : 'outline'}
              onClick={() => setSplitType('range')}
              className="h-12"
            >
              Split by Range
            </Button>
          </div>

          {splitType === 'range' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page Range (e.g., 1-5, 10-15)
              </label>
              <Input
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="1-5, 10-15"
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use commas to separate multiple ranges
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={splitPDF}
          disabled={!file || isProcessing}
          className="px-8 py-3 text-lg font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Splitting PDF...
            </>
          ) : (
            <>
              <Scissors className="mr-2 h-5 w-5" />
              Split PDF
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
            How to use PDF Splitter:
          </h3>
          <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
            <li>• Upload a PDF file (drag & drop or click to browse)</li>
            <li>• Choose split method: by pages or by custom ranges</li>
            <li>• For ranges, use format like "1-5, 10-15" for multiple ranges</li>
            <li>• Click "Split PDF" to process the file</li>
            <li>• Download the ZIP file containing all split PDFs</li>
            <li>• Maximum file size: 100MB</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SplitterTool;
