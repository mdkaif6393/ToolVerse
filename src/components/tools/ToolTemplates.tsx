import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, 
  Brain, 
  Image, 
  Calculator, 
  Code, 
  Palette,
  Zap,
  Play,
  Eye
} from "lucide-react";

interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  features: string[];
  techStack: string[];
  codePreview: string;
  fullCode: string;
}

const templates: ToolTemplate[] = [
  {
    id: 'pdf-merger',
    name: 'PDF Merger Tool',
    description: 'Merge multiple PDF files into a single document',
    category: 'PDF Tools',
    icon: FileText,
    difficulty: 'Beginner',
    estimatedTime: '15 mins',
    features: ['Drag & Drop Upload', 'Multiple File Support', 'Download Result'],
    techStack: ['React', 'PDF-lib', 'TypeScript'],
    codePreview: `import { PDFDocument } from 'pdf-lib';

const mergePDFs = async (files) => {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const pdf = await PDFDocument.load(file);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
};`,
    fullCode: `// Complete PDF Merger Tool implementation would go here`
  },
  {
    id: 'text-analyzer',
    name: 'AI Text Analyzer',
    description: 'Analyze text for sentiment, keywords, and readability',
    category: 'AI Tools',
    icon: Brain,
    difficulty: 'Intermediate',
    estimatedTime: '30 mins',
    features: ['Sentiment Analysis', 'Keyword Extraction', 'Readability Score'],
    techStack: ['React', 'Natural', 'Chart.js'],
    codePreview: `import natural from 'natural';

const analyzeText = (text) => {
  const sentiment = natural.SentimentAnalyzer.getSentiment(
    natural.WordTokenizer().tokenize(text)
  );
  
  const keywords = natural.TfIdf();
  keywords.addDocument(text);
  
  return { sentiment, keywords };
};`,
    fullCode: `// Complete Text Analyzer implementation would go here`
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress and optimize images for web use',
    category: 'Design Tools',
    icon: Image,
    difficulty: 'Beginner',
    estimatedTime: '20 mins',
    features: ['Multiple Formats', 'Quality Control', 'Batch Processing'],
    techStack: ['React', 'Canvas API', 'File API'],
    codePreview: `const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};`,
    fullCode: `// Complete Image Compressor implementation would go here`
  },
  {
    id: 'calculator',
    name: 'Advanced Calculator',
    description: 'Scientific calculator with history and functions',
    category: 'Productivity',
    icon: Calculator,
    difficulty: 'Intermediate',
    estimatedTime: '45 mins',
    features: ['Scientific Functions', 'History', 'Memory Storage'],
    techStack: ['React', 'Math.js', 'LocalStorage'],
    codePreview: `import { evaluate } from 'mathjs';

const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  
  const calculate = () => {
    try {
      const result = evaluate(expression);
      setHistory(prev => [...prev, { expression, result }]);
      setExpression(result.toString());
    } catch (error) {
      setExpression('Error');
    }
  };
  
  return (
    // Calculator UI
  );
};`,
    fullCode: `// Complete Calculator implementation would go here`
  }
];

interface ToolTemplatesProps {
  onSelectTemplate: (template: ToolTemplate) => void;
}

export const ToolTemplates = ({ onSelectTemplate }: ToolTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (template: ToolTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleUseTemplate = (template: ToolTemplate) => {
    onSelectTemplate(template);
    setPreviewOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2 dark:text-white">Choose a Template</h3>
          <p className="text-muted-foreground dark:text-gray-300">
            Start with a pre-built template and customize it for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow dark:bg-white/5 dark:border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg dark:text-white">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground dark:text-gray-300">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="dark:border-white/20">
                      {template.category}
                    </Badge>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="dark:bg-white/10">
                      {template.estimatedTime}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 dark:text-white">Features:</h5>
                    <ul className="text-sm text-muted-foreground dark:text-gray-300 space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 dark:text-white">Tech Stack:</h5>
                    <div className="flex gap-1 flex-wrap">
                      {template.techStack.map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs dark:border-white/20">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="flex-1 dark:border-white/20"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-black dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              {selectedTemplate && <selectedTemplate.icon className="h-5 w-5" />}
              {selectedTemplate?.name} - Code Preview
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 dark:text-white">Template Info</h4>
                  <div className="space-y-2 text-sm">
                    <p className="dark:text-gray-300">{selectedTemplate.description}</p>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                        {selectedTemplate.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="dark:bg-white/10">
                        {selectedTemplate.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 dark:text-white">What you'll build</h4>
                  <ul className="text-sm space-y-1">
                    {selectedTemplate.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 dark:text-gray-300">
                        <Zap className="h-3 w-3 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 dark:text-white">Code Preview</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{selectedTemplate.codePreview}</code>
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};