import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, X, Copy, Palette } from "lucide-react";

interface QRToolProps {
  onClose?: () => void;
}

const QRTool: React.FC<QRToolProps> = ({ onClose }) => {
  const [text, setText] = useState('');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [size, setSize] = useState(256);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchItems, setBatchItems] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const { toast } = useToast();

  const generateQR = async () => {
    if (!text.trim()) {
      toast({
        title: "❌ Text Required",
        description: "Please enter text to generate QR code",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tools/qr-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          format,
          width: size,
          height: size,
          color: {
            dark: darkColor,
            light: lightColor
          },
          errorCorrectionLevel: errorLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setQrResult(result.dataUrl);

      toast({
        title: "✅ QR Code Generated!",
        description: "Your QR code is ready",
      });

    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = async () => {
    if (!text.trim()) return;

    try {
      const response = await fetch(`/api/tools/qr-generator/generate?download=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          format,
          width: size,
          height: size,
          color: {
            dark: darkColor,
            light: lightColor
          },
          errorCorrectionLevel: errorLevel
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "📥 Downloaded!",
        description: "QR code downloaded successfully",
      });

    } catch (error) {
      toast({
        title: "❌ Download Failed",
        description: "Failed to download QR code",
        variant: "destructive"
      });
    }
  };

  const generateBatch = async () => {
    const items = batchItems.split('\n').filter(item => item.trim());
    
    if (items.length === 0) {
      toast({
        title: "❌ No Items",
        description: "Please enter items for batch generation",
        variant: "destructive"
      });
      return;
    }

    if (items.length > 100) {
      toast({
        title: "❌ Too Many Items",
        description: "Maximum 100 items allowed for batch generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tools/qr-generator/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          format,
          width: size,
          height: size
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-codes.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Batch Generated!",
        description: `${items.length} QR codes generated and downloaded`,
      });

    } catch (error) {
      console.error('Batch generation error:', error);
      toast({
        title: "❌ Batch Failed",
        description: error instanceof Error ? error.message : "Failed to generate batch QR codes",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (qrResult) {
      navigator.clipboard.writeText(qrResult);
      toast({
        title: "📋 Copied!",
        description: "QR code data URL copied to clipboard",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              QR Code Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create high-quality QR codes for URLs, text, and more
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <Button
          variant={activeTab === 'single' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('single')}
          className="flex-1"
        >
          Single QR Code
        </Button>
        <Button
          variant={activeTab === 'batch' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('batch')}
          className="flex-1"
        >
          Batch Generation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {activeTab === 'single' ? (
            <Card>
              <CardHeader>
                <CardTitle>QR Code Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Text or URL
                  </label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text, URL, or any content..."
                    className="min-h-[100px]"
                    maxLength={4296}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {text.length}/4296 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Batch Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Items (one per line)
                  </label>
                  <Textarea
                    value={batchItems}
                    onChange={(e) => setBatchItems(e.target.value)}
                    placeholder="Enter items, one per line..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {batchItems.split('\n').filter(item => item.trim()).length}/100 items
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <Select value={format} onValueChange={(value: 'png' | 'jpeg' | 'svg') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Size (px)</label>
                  <Input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value) || 256)}
                    min={64}
                    max={1024}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dark Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Light Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Error Correction</label>
                <Select value={errorLevel} onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => setErrorLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%)</SelectItem>
                    <SelectItem value="M">Medium (15%)</SelectItem>
                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                    <SelectItem value="H">High (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={activeTab === 'single' ? generateQR : generateBatch}
            disabled={isGenerating || (activeTab === 'single' ? !text.trim() : batchItems.split('\n').filter(item => item.trim()).length === 0)}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-lg font-medium"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-5 w-5" />
                {activeTab === 'single' ? 'Generate QR Code' : 'Generate Batch'}
              </>
            )}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {activeTab === 'single' && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {qrResult ? (
                  <div className="space-y-4">
                    <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <img
                        src={qrResult}
                        alt="Generated QR Code"
                        className="max-w-full h-auto"
                        style={{ maxWidth: '300px' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadQR} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Enter text and click "Generate QR Code" to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                How to use QR Generator:
              </h3>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>• Enter text, URL, or any content you want to encode</li>
                <li>• Customize format, size, colors, and error correction level</li>
                <li>• Click "Generate QR Code" to create your QR code</li>
                <li>• Download the QR code or copy the data URL</li>
                <li>• Use "Batch Generation" for multiple QR codes at once</li>
                <li>• Maximum text length: 4,296 characters</li>
                <li>• Batch limit: 100 items per generation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRTool;
