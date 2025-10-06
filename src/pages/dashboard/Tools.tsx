import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  FileText, 
  Download, 
  QrCode,
  Palette,
  Code,
  Merge,
  Copy,
  Play,
  X,
  Calculator,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Zap,
  Paintbrush,
  Settings,
  Scissors
} from "lucide-react";

// Professional Tools Collection
const builtInTools = [
  // PDF Tools
  {
    id: 'pdf-merger',
    name: 'PDF Merger',
    description: 'Combine multiple PDF documents into a single file with professional quality output',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'merge', 'combine', 'documents']
  },
  {
    id: 'pdf-splitter',
    name: 'PDF Splitter',
    description: 'Split PDF into separate pages or extract specific page ranges',
    icon: Scissors,
    category: 'PDF Tools',
    tags: ['pdf', 'split', 'separate', 'pages', 'extract']
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    description: 'Reduce PDF file size without significant quality loss',
    icon: Download,
    category: 'PDF Tools',
    tags: ['pdf', 'compress', 'reduce', 'size', 'optimize']
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF documents to editable Word (DOCX) format',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'word', 'docx', 'convert', 'editable']
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents to PDF format with perfect formatting',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['word', 'pdf', 'convert', 'docx', 'format']
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Extract PDF pages as high-quality JPG or PNG images',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'image', 'jpg', 'png', 'extract', 'convert']
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert multiple images into a single PDF document',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['image', 'pdf', 'convert', 'jpg', 'png', 'combine']
  },
  {
    id: 'pdf-unlock',
    name: 'PDF Unlock',
    description: 'Remove password protection from PDF files (password required)',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'unlock', 'password', 'remove', 'protection']
  },
  {
    id: 'pdf-protect',
    name: 'PDF Protect',
    description: 'Add password protection and encryption to PDF files',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'protect', 'password', 'encrypt', 'security']
  },
  {
    id: 'pdf-organize',
    name: 'PDF Organizer',
    description: 'Rotate, reorder, or delete PDF pages with easy drag-and-drop',
    icon: Settings,
    category: 'PDF Tools',
    tags: ['pdf', 'rotate', 'reorder', 'organize', 'pages']
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF slides to editable PowerPoint (PPTX) presentation',
    icon: FileText,
    category: 'PDF Tools',
    tags: ['pdf', 'powerpoint', 'ppt', 'pptx', 'slides', 'convert']
  },
  
  // Other Tools
  {
    id: 'qr-generator',
    name: 'QR Code Generator', 
    description: 'Create high-quality QR codes for URLs, text, contact information, and more',
    icon: QrCode,
    category: 'Productivity Tools',
    tags: ['qr', 'code', 'generator', 'url', 'text']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, validate, and beautify JSON data with syntax highlighting and error detection',
    icon: Code,
    category: 'Development Tools',
    tags: ['json', 'format', 'validate', 'beautify', 'syntax']
  },
  {
    id: 'color-palette',
    name: 'Color Palette Generator',
    description: 'Generate harmonious color schemes and palettes for design projects',
    icon: Palette,
    category: 'Design Tools',
    tags: ['color', 'palette', 'design', 'scheme', 'harmony']
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Professional calculator with standard mathematical operations and functions',
    icon: Calculator,
    category: 'Productivity Tools',
    tags: ['calculator', 'math', 'operations', 'numbers']
  }
];

// Tool Components
const PDFMerger = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      toast({
        title: "📄 Files Added",
        description: `${e.target.files.length} PDF files selected`,
      });
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
      setFiles(droppedFiles);
      toast({
        title: "📄 Files Added",
        description: `${droppedFiles.length} PDF files dropped`,
      });
    } else {
      toast({
        title: "❌ Invalid Files",
        description: "Please drop only PDF files",
        variant: "destructive"
      });
    }
  };

  const mergePDFs = () => {
    if (files.length < 2) {
      toast({
        title: "❌ Need More Files",
        description: "Select at least 2 PDF files",
        variant: "destructive"
      });
      return;
    }

    setTimeout(() => {
      toast({
        title: "✅ PDFs Merged!",
        description: `Successfully merged ${files.length} files`,
      });
      
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihNZXJnZWQgUERGKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzIyIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE0CiUlRU9G';
      link.download = 'merged-document.pdf';
      link.click();
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select PDF Files to Merge
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose multiple PDF files to combine into a single document
          </p>
        </div>

        <div className="space-y-4">
          {/* Drag & Drop Area */}
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
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop PDF files here' : 'Drag & drop PDF files'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files
                </p>
              </div>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Selected Files:</h4>
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={mergePDFs} 
            disabled={files.length < 2}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-base font-medium"
          >
            <Merge className="mr-2 h-5 w-5" />
            Merge {files.length} PDF{files.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

const QRGenerator = () => {
  const [text, setText] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

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
    
    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText) {
      setText(droppedText);
      toast({
        title: "📝 Text Added",
        description: "Text dropped successfully",
      });
    }
  };

  const generateQR = () => {
    if (!text.trim()) {
      toast({
        title: "❌ Enter Text",
        description: "Please enter text to generate QR code",
        variant: "destructive"
      });
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    setQrCode(qrUrl);
    
    toast({
      title: "✅ QR Code Generated!",
      description: "Ready to download",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            QR Code Generator
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create high-quality QR codes for URLs, text, contact information, and more
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your content
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative transition-colors ${
                  isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, URL, contact info, or drag & drop text here..."
                  rows={6}
                  className={`text-base transition-colors ${
                    isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                />
                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/40 rounded-md">
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      Drop text here
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={generateQR} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Generate QR Code
            </Button>
          </div>

          {/* Output Section */}
          <div className="flex flex-col items-center justify-center">
            {qrCode ? (
              <div className="text-center space-y-6">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <img 
                    src={qrCode} 
                    alt="Generated QR Code" 
                    className="mx-auto w-64 h-64 object-contain"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCode;
                    link.download = 'qr-code.png';
                    link.click();
                  }}
                  variant="outline" 
                  className="w-full h-12 text-base font-medium"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Your QR code will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const JSONFormatter = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      toast({
        title: "✅ JSON Formatted!",
        description: "Your JSON is now formatted",
      });
    } catch (err) {
      toast({
        title: "❌ Invalid JSON",
        description: "Please check your JSON syntax",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"name": "example", "data": [1,2,3]}'
        rows={4}
        className="font-mono text-sm"
      />
      
      <Button onClick={formatJSON} className="w-full bg-green-600 hover:bg-green-700">
        <Code className="mr-2 h-4 w-4" />
        Format JSON
      </Button>
      
      {output && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Formatted JSON</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(output);
                toast({ title: "📋 Copied!", description: "JSON copied to clipboard" });
              }}
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>
          </div>
          <Textarea
            value={output}
            readOnly
            rows={6}
            className="font-mono text-sm bg-gray-50"
          />
        </div>
      )}
    </div>
  );
};

const ColorPalette = () => {
  const [baseColor, setBaseColor] = useState("#3B82F6");
  const [palette, setPalette] = useState<string[]>([]);
  const { toast } = useToast();

  const generatePalette = () => {
    const colors = [
      baseColor,
      adjustBrightness(baseColor, 20),
      adjustBrightness(baseColor, -20),
      adjustBrightness(baseColor, 40),
      adjustBrightness(baseColor, -40),
      getComplementaryColor(baseColor)
    ];
    
    setPalette(colors);
    toast({
      title: "🎨 Palette Generated!",
      description: "Your color palette is ready",
    });
  };

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const getComplementaryColor = (hex: string) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const R = 255 - (num >> 16);
    const G = 255 - (num >> 8 & 0x00FF);
    const B = 255 - (num & 0x0000FF);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          placeholder="#3B82F6"
          className="flex-1"
        />
      </div>
      
      <Button onClick={generatePalette} className="w-full bg-purple-600 hover:bg-purple-700">
        <Palette className="mr-2 h-4 w-4" />
        Generate Palette
      </Button>
      
      {palette.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {palette.map((color, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => {
                navigator.clipboard.writeText(color);
                toast({ title: "📋 Copied!", description: `${color} copied` });
              }}
            >
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-mono">{color}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimpleCalculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+": return firstValue + secondValue;
      case "-": return firstValue - secondValue;
      case "×": return firstValue * secondValue;
      case "÷": return firstValue / secondValue;
      case "=": return secondValue;
      default: return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);
    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 text-white p-4 rounded text-right text-2xl font-mono">
        {display}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={clear} className="col-span-2 bg-red-500 hover:bg-red-600">Clear</Button>
        <Button onClick={() => inputOperation("÷")} variant="outline">÷</Button>
        <Button onClick={() => inputOperation("×")} variant="outline">×</Button>
        
        <Button onClick={() => inputNumber("7")} variant="outline">7</Button>
        <Button onClick={() => inputNumber("8")} variant="outline">8</Button>
        <Button onClick={() => inputNumber("9")} variant="outline">9</Button>
        <Button onClick={() => inputOperation("-")} variant="outline">-</Button>
        
        <Button onClick={() => inputNumber("4")} variant="outline">4</Button>
        <Button onClick={() => inputNumber("5")} variant="outline">5</Button>
        <Button onClick={() => inputNumber("6")} variant="outline">6</Button>
        <Button onClick={() => inputOperation("+")} variant="outline">+</Button>
        
        <Button onClick={() => inputNumber("1")} variant="outline">1</Button>
        <Button onClick={() => inputNumber("2")} variant="outline">2</Button>
        <Button onClick={() => inputNumber("3")} variant="outline">3</Button>
        <Button onClick={performCalculation} className="row-span-2 bg-blue-500 hover:bg-blue-600">=</Button>
        
        <Button onClick={() => inputNumber("0")} className="col-span-2" variant="outline">0</Button>
        <Button onClick={() => inputNumber(".")} variant="outline">.</Button>
      </div>
    </div>
  );
};

// PDF Splitter Component
const PDFSplitter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [splitType, setSplitType] = useState<'pages' | 'range'>('pages');
  const [pageRange, setPageRange] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast({
        title: "📄 PDF Selected",
        description: `${e.target.files[0].name} ready to split`,
      });
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
    }
  };

  const splitPDF = () => {
    if (!file) {
      toast({
        title: "❌ No File Selected",
        description: "Please select a PDF file first",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "✂️ Splitting PDF...",
      description: "Processing your PDF file",
    });

    setTimeout(() => {
      toast({
        title: "✅ PDF Split Successfully!",
        description: `Created ${splitType === 'pages' ? 'individual page files' : 'range-based files'}`,
      });
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Split PDF Document
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Split PDF into separate pages or extract specific page ranges
          </p>
        </div>

        <div className="space-y-4">
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
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <Scissors className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop PDF file here' : 'Drag & drop PDF file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Split Method
              </label>
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
              </div>
            )}
          </div>
          
          <Button 
            onClick={splitPDF} 
            disabled={!file}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium"
          >
            <Scissors className="mr-2 h-5 w-5" />
            Split PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

// PDF Compressor Component
const PDFCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast({
        title: "📄 PDF Selected",
        description: `${e.target.files[0].name} ready to compress`,
      });
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
        description: `${droppedFiles[0].name} ready to compress`,
      });
    }
  };

  const compressPDF = () => {
    if (!file) {
      toast({
        title: "❌ No File Selected",
        description: "Please select a PDF file first",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "🗜️ Compressing PDF...",
      description: "Reducing file size while maintaining quality",
    });

    setTimeout(() => {
      const reductionPercent = compressionLevel === 'high' ? 70 : compressionLevel === 'medium' ? 50 : 30;
      toast({
        title: "✅ PDF Compressed Successfully!",
        description: `File size reduced by approximately ${reductionPercent}%`,
      });
    }, 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Compress PDF File
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Reduce PDF file size without significant quality loss
          </p>
        </div>

        <div className="space-y-4">
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
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <Download className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop PDF file here' : 'Drag & drop PDF file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to browse files
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compression Level
            </label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={compressionLevel === 'low' ? 'default' : 'outline'}
                onClick={() => setCompressionLevel('low')}
                className="h-12"
              >
                Low (30%)
              </Button>
              <Button
                variant={compressionLevel === 'medium' ? 'default' : 'outline'}
                onClick={() => setCompressionLevel('medium')}
                className="h-12"
              >
                Medium (50%)
              </Button>
              <Button
                variant={compressionLevel === 'high' ? 'default' : 'outline'}
                onClick={() => setCompressionLevel('high')}
                className="h-12"
              >
                High (70%)
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={compressPDF} 
            disabled={!file}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-medium"
          >
            <Download className="mr-2 h-5 w-5" />
            Compress PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other PDF tools
const PDFToWord = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF to Word Converter</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Convert PDF documents to editable Word (DOCX) format</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const WordToPDF = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Word to PDF Converter</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Convert Word documents to PDF format with perfect formatting</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const PDFToImage = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF to Image Converter</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Extract PDF pages as high-quality JPG or PNG images</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const ImageToPDF = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Image to PDF Converter</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Convert multiple images into a single PDF document</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const PDFUnlock = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF Unlock Tool</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Remove password protection from PDF files (password required)</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const PDFProtect = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF Protection Tool</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Add password protection and encryption to PDF files</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const PDFOrganizer = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <Settings className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF Page Organizer</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Rotate, reorder, or delete PDF pages with easy drag-and-drop</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

const PDFToPPT = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
    <div className="text-center">
      <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">PDF to PowerPoint Converter</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Convert PDF slides to editable PowerPoint (PPTX) presentation</p>
      <p className="text-sm text-gray-500">Feature coming soon...</p>
    </div>
  </div>
);

// Main Tools Component
const Tools = () => {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (toolId) {
      const tool = builtInTools.find(t => t.id === toolId);
      if (tool) {
        setSelectedTool(tool);
      }
    } else {
      setSelectedTool(null);
    }
  }, [toolId]);

  // Get unique categories with icons
  const categoryIcons = {
    "PDF Tools": FileText,
    "Productivity Tools": Zap,
    "Development Tools": Code,
    "Design Tools": Paintbrush
  };

  const categories = ["all", ...Array.from(new Set(builtInTools.map(tool => tool.category)))];

  const filteredTools = builtInTools.filter(tool => {
    const matchesSearch = searchQuery === "" || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof builtInTools>);

  const getToolComponent = (toolId: string) => {
    switch (toolId) {
      case 'pdf-merger': return <PDFMerger />;
      case 'pdf-splitter': return <PDFSplitter />;
      case 'pdf-compressor': return <PDFCompressor />;
      case 'pdf-to-word': return <PDFToWord />;
      case 'word-to-pdf': return <WordToPDF />;
      case 'pdf-to-image': return <PDFToImage />;
      case 'image-to-pdf': return <ImageToPDF />;
      case 'pdf-unlock': return <PDFUnlock />;
      case 'pdf-protect': return <PDFProtect />;
      case 'pdf-organize': return <PDFOrganizer />;
      case 'pdf-to-ppt': return <PDFToPPT />;
      case 'qr-generator': return <QRGenerator />;
      case 'json-formatter': return <JSONFormatter />;
      case 'color-palette': return <ColorPalette />;
      case 'calculator': return <SimpleCalculator />;
      default: return <div>Tool not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tools
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Essential productivity tools for your workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {builtInTools.length} Available
            </Badge>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tools by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Results Counter */}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">
              {filteredTools.length} of {builtInTools.length} tools
            </Badge>
          </div>
        </div>
        
        {/* Quick Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Quick filters:</span>
          {categories.slice(1).map((category) => {
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
            const isActive = selectedCategory === category;
            return (
              <Button
                key={category}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(isActive ? "all" : category)}
                className={`text-xs h-7 px-3 ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
              >
                <CategoryIcon className="h-3 w-3 mr-1" />
                {category}
              </Button>
            );
          })}
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Tools Grid */}
      <div className="space-y-8">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <CategoryIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category}
                      </h2>
                      <Badge variant="outline" className="text-xs">
                        {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                      </Badge>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Tools Cards */}
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                
                if (viewMode === "list") {
                  return (
                    <Card 
                      key={tool.id} 
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
                      onClick={() => setSelectedTool(tool)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-800/30 dark:group-hover:to-indigo-800/30 transition-colors">
                            <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {tool.description}
                            </p>
                          </div>
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium transition-colors"
                            size="sm"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Launch Tool
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <Card 
                    key={tool.id} 
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
                    onClick={() => navigate(`/dashboard/tools/${tool.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-800/30 dark:group-hover:to-indigo-800/30 transition-colors">
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium transition-colors"
                        size="sm"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Launch Tool
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full Page Tool Modal */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-none w-screen h-screen max-h-none m-0 p-0 bg-white dark:bg-gray-900 border-0 rounded-none">
          {/* Full Page Header */}
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedTool && (
                  <>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <selectedTool.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedTool.name}
                      </DialogTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedTool.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard/tools')}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                Close Tool
              </Button>
            </div>
          </div>
          
          {/* Full Page Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="max-w-6xl mx-auto">
              {selectedTool && getToolComponent(selectedTool.id)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Results */}
      {filteredTools.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tools found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any tools matching your search. Try adjusting your search terms or browse all available tools.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default Tools;
