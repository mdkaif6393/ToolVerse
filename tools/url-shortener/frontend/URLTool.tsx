import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Link, Copy, BarChart3, X, QrCode, Calendar, Lock, Globe, TrendingUp } from "lucide-react";

interface URLToolProps {
  onClose?: () => void;
}

const URLTool: React.FC<URLToolProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'shorten' | 'analytics' | 'bulk'>('shorten');
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [useExpiration, setUseExpiration] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState<any>(null);
  
  // Analytics states
  const [analyticsCode, setAnalyticsCode] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  
  // Bulk states
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const { toast } = useToast();

  const shortenUrl = async () => {
    if (!originalUrl.trim()) {
      toast({
        title: "❌ URL Required",
        description: "Please enter a URL to shorten",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(originalUrl);
    } catch {
      toast({
        title: "❌ Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive"
      });
      return;
    }

    setIsShortening(true);
    
    try {
      const response = await fetch('/api/tools/url-shortener/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias.trim(),
          description: description.trim(),
          password: usePassword ? password : '',
          expirationDate: useExpiration ? expirationDate : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Shortening failed');
      }

      const result = await response.json();
      setShortenedUrl(result.data);

      toast({
        title: "✅ URL Shortened!",
        description: "Your short URL is ready to use",
      });

      // Clear form
      setOriginalUrl('');
      setCustomAlias('');
      setDescription('');
      setPassword('');
      setExpirationDate('');

    } catch (error) {
      console.error('URL shortening error:', error);
      toast({
        title: "❌ Shortening Failed",
        description: error instanceof Error ? error.message : "Failed to shorten URL",
        variant: "destructive"
      });
    } finally {
      setIsShortening(false);
    }
  };

  const getAnalytics = async () => {
    if (!analyticsCode.trim()) {
      toast({
        title: "❌ Short Code Required",
        description: "Please enter a short code to view analytics",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAnalytics(true);
    
    try {
      const response = await fetch(`/api/tools/url-shortener/analytics/${analyticsCode}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load analytics');
      }

      const result = await response.json();
      setAnalyticsData(result.data);

      toast({
        title: "📊 Analytics Loaded!",
        description: "Analytics data retrieved successfully",
      });

    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "❌ Analytics Failed",
        description: error instanceof Error ? error.message : "Failed to load analytics",
        variant: "destructive"
      });
      setAnalyticsData(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const processBulkUrls = async () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim());
    
    if (urls.length === 0) {
      toast({
        title: "❌ No URLs",
        description: "Please enter URLs to process",
        variant: "destructive"
      });
      return;
    }

    if (urls.length > 100) {
      toast({
        title: "❌ Too Many URLs",
        description: "Maximum 100 URLs allowed for bulk processing",
        variant: "destructive"
      });
      return;
    }

    setIsBulkProcessing(true);
    
    try {
      const urlObjects = urls.map(url => ({ originalUrl: url.trim() }));
      
      const response = await fetch('/api/tools/url-shortener/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlObjects })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk processing failed');
      }

      const result = await response.json();
      setBulkResults(result.data);

      toast({
        title: "✅ Bulk Processing Complete!",
        description: `${result.data.summary.successful}/${result.data.summary.total} URLs processed successfully`,
      });

    } catch (error) {
      console.error('Bulk processing error:', error);
      toast({
        title: "❌ Bulk Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process URLs",
        variant: "destructive"
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied!",
      description: "URL copied to clipboard",
    });
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Link className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              URL Shortener
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create short, memorable URLs with analytics and custom options
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
          variant={activeTab === 'shorten' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('shorten')}
          className="flex-1"
        >
          <Link className="mr-2 h-4 w-4" />
          Shorten URL
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className="flex-1"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
        <Button
          variant={activeTab === 'bulk' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('bulk')}
          className="flex-1"
        >
          <Globe className="mr-2 h-4 w-4" />
          Bulk Process
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {activeTab === 'shorten' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>URL Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Original URL *
                    </label>
                    <Input
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      placeholder="https://example.com/very-long-url"
                      type="url"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Alias (optional)
                    </label>
                    <Input
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      placeholder="my-custom-link"
                      pattern="[a-zA-Z0-9_-]{3,20}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      3-20 characters, letters, numbers, hyphens, and underscores only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description (optional)
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this link..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <label className="text-sm font-medium">Password Protection</label>
                    </div>
                    <Switch checked={usePassword} onCheckedChange={setUsePassword} />
                  </div>
                  
                  {usePassword && (
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <label className="text-sm font-medium">Expiration Date</label>
                    </div>
                    <Switch checked={useExpiration} onCheckedChange={setUseExpiration} />
                  </div>
                  
                  {useExpiration && (
                    <Input
                      type="datetime-local"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={shortenUrl}
                disabled={isShortening || !originalUrl.trim()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
              >
                {isShortening ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Shortening...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-5 w-5" />
                    Shorten URL
                  </>
                )}
              </Button>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>View Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Short Code
                    </label>
                    <Input
                      value={analyticsCode}
                      onChange={(e) => setAnalyticsCode(e.target.value)}
                      placeholder="Enter short code (e.g., abc123)"
                    />
                  </div>

                  <Button
                    onClick={getAnalytics}
                    disabled={isLoadingAnalytics || !analyticsCode.trim()}
                    className="w-full"
                  >
                    {isLoadingAnalytics ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Get Analytics
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'bulk' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Bulk URL Processing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URLs (one per line)
                    </label>
                    <Textarea
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bulkUrls.split('\n').filter(url => url.trim()).length}/100 URLs
                    </p>
                  </div>

                  <Button
                    onClick={processBulkUrls}
                    disabled={isBulkProcessing || bulkUrls.split('\n').filter(url => url.trim()).length === 0}
                    className="w-full"
                  >
                    {isBulkProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Process URLs
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {activeTab === 'shorten' && shortenedUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Shortened URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Short URL:</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(shortenedUrl.shortUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUrl(shortenedUrl.shortUrl)}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="font-mono text-lg text-green-900 dark:text-green-100 break-all">
                    {shortenedUrl.shortUrl}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Short Code:</span>
                    <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                      {shortenedUrl.shortCode}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(shortenedUrl.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {shortenedUrl.description && (
                  <div>
                    <span className="font-medium text-sm">Description:</span>
                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                      {shortenedUrl.description}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {shortenedUrl.hasPassword && (
                    <Badge variant="outline" className="text-orange-600">
                      <Lock className="h-3 w-3 mr-1" />
                      Password Protected
                    </Badge>
                  )}
                  {shortenedUrl.expirationDate && (
                    <Badge variant="outline" className="text-red-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expires {new Date(shortenedUrl.expirationDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openUrl(shortenedUrl.qrCode)}
                    className="flex-1"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab('analytics');
                      setAnalyticsCode(shortenedUrl.shortCode);
                    }}
                    className="flex-1"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'analytics' && analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.analytics.totalClicks}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Clicks</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.analytics.uniqueClicks}</div>
                    <div className="text-sm text-green-800 dark:text-green-200">Unique Clicks</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold">{analyticsData.analytics.clicksToday}</div>
                    <div className="text-gray-600 dark:text-gray-400">Today</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold">{analyticsData.analytics.clicksThisWeek}</div>
                    <div className="text-gray-600 dark:text-gray-400">This Week</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold">{analyticsData.analytics.clicksThisMonth}</div>
                    <div className="text-gray-600 dark:text-gray-400">This Month</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Top Referrers</h4>
                  <div className="space-y-1">
                    {analyticsData.analytics.topReferrers.map((referrer: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{referrer.name}</span>
                        <span className="font-medium">{referrer.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Top Devices</h4>
                  <div className="space-y-1">
                    {analyticsData.analytics.topDevices.map((device: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{device.name}</span>
                        <span className="font-medium">{device.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Original URL:</strong>
                    <div className="break-all mt-1">{analyticsData.url.originalUrl}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'bulk' && bulkResults && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Processing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm">
                    <strong>Summary:</strong> {bulkResults.summary.successful} successful, {bulkResults.summary.failed} failed out of {bulkResults.summary.total} URLs
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bulkResults.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {result.originalUrl}
                          </div>
                          {result.success ? (
                            <div className="text-xs text-green-600 dark:text-green-400 font-mono">
                              {result.shortUrl}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              {result.error}
                            </div>
                          )}
                        </div>
                        {result.success && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.shortUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to use URL Shortener:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Enter any long URL to create a short, memorable link</li>
                <li>• Add custom aliases for branded short URLs</li>
                <li>• Set passwords and expiration dates for security</li>
                <li>• Track clicks and analytics for your short URLs</li>
                <li>• Process multiple URLs at once with bulk operations</li>
                <li>• Generate QR codes for easy sharing</li>
                <li>• View detailed analytics including referrers and devices</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default URLTool;
