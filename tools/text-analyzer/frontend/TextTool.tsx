import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, BarChart3, X, Brain, Key, BookOpen, TrendingUp, Globe, Users, Calendar } from "lucide-react";

interface TextToolProps {
  onClose?: () => void;
}

const TextTool: React.FC<TextToolProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'sentiment' | 'keywords' | 'readability'>('analyze');
  const [text, setText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeText = async (endpoint: string = 'analyze') => {
    if (!text.trim()) {
      toast({
        title: "❌ Text Required",
        description: "Please enter text to analyze",
        variant: "destructive"
      });
      return;
    }

    if (text.length > 100000) {
      toast({
        title: "❌ Text Too Long",
        description: "Maximum 100,000 characters allowed",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`/api/tools/text-analyzer/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.data);

      toast({
        title: "✅ Analysis Complete!",
        description: "Text analysis completed successfully",
      });

    } catch (error) {
      console.error('Text analysis error:', error);
      toast({
        title: "❌ Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze text",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'mixed': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getReadabilityColor = (level: string) => {
    if (level.includes('Easy')) return 'text-green-600';
    if (level.includes('Standard') || level.includes('Fairly')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Text Analyzer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive text analysis including sentiment, readability, and statistics
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
          variant={activeTab === 'analyze' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analyze')}
          className="flex-1"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Full Analysis
        </Button>
        <Button
          variant={activeTab === 'sentiment' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sentiment')}
          className="flex-1"
        >
          <Brain className="mr-2 h-4 w-4" />
          Sentiment
        </Button>
        <Button
          variant={activeTab === 'keywords' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('keywords')}
          className="flex-1"
        >
          <Key className="mr-2 h-4 w-4" />
          Keywords
        </Button>
        <Button
          variant={activeTab === 'readability' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('readability')}
          className="flex-1"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Readability
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text here for analysis..."
                  className="min-h-[300px] resize-none"
                  maxLength={100000}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{text.length}/100,000 characters</span>
                  <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => analyzeText(activeTab === 'analyze' ? 'analyze' : activeTab)}
            disabled={isAnalyzing || !text.trim()}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-lg font-medium"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Analyze Text
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {analysisResult && (
            <>
              {activeTab === 'analyze' && (
                <>
                  {/* Basic Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Text Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{analysisResult.basic?.words || 0}</div>
                          <div className="text-sm text-blue-800 dark:text-blue-200">Words</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{analysisResult.basic?.sentences || 0}</div>
                          <div className="text-sm text-green-800 dark:text-green-200">Sentences</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{analysisResult.basic?.paragraphs || 0}</div>
                          <div className="text-sm text-purple-800 dark:text-purple-200">Paragraphs</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{analysisResult.basic?.characters || 0}</div>
                          <div className="text-sm text-orange-800 dark:text-orange-200">Characters</div>
                        </div>
                      </div>

                      {analysisResult.basic?.averages && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Avg. words per sentence:</span>
                            <span className="font-medium">{analysisResult.basic.averages.wordsPerSentence}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg. characters per word:</span>
                            <span className="font-medium">{analysisResult.basic.averages.charactersPerWord}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Lexical diversity:</span>
                            <span className="font-medium">{(analysisResult.basic.lexicalDiversity * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sentiment Analysis */}
                  {analysisResult.sentiment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Sentiment Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <Badge className={`text-lg px-4 py-2 ${getSentimentColor(analysisResult.sentiment.overall)}`}>
                              {analysisResult.sentiment.overall.charAt(0).toUpperCase() + analysisResult.sentiment.overall.slice(1)}
                            </Badge>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              Confidence: {analysisResult.sentiment.confidence}%
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Positive</span>
                              <span className="text-sm font-medium">{analysisResult.sentiment.scores.positive}</span>
                            </div>
                            <Progress value={analysisResult.sentiment.percentages.positive} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Negative</span>
                              <span className="text-sm font-medium">{analysisResult.sentiment.scores.negative}</span>
                            </div>
                            <Progress value={analysisResult.sentiment.percentages.negative} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Neutral</span>
                              <span className="text-sm font-medium">{analysisResult.sentiment.scores.neutral}</span>
                            </div>
                            <Progress value={analysisResult.sentiment.percentages.neutral} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Keywords */}
                  {analysisResult.keywords && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Top Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResult.keywords.slice(0, 8).map((keyword: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="font-medium">{keyword.word}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {keyword.frequency}x
                                </Badge>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${keyword.score * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Readability */}
                  {analysisResult.readability && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Readability
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getReadabilityColor(analysisResult.readability.readabilityLevel)}`}>
                              {analysisResult.readability.readabilityLevel}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {analysisResult.readability.gradeLevel}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Flesch Score:</span>
                              <div className="text-gray-600 dark:text-gray-400">{analysisResult.readability.fleschReadingEase}</div>
                            </div>
                            <div>
                              <span className="font-medium">Grade Level:</span>
                              <div className="text-gray-600 dark:text-gray-400">{analysisResult.readability.fleschKincaidGrade}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeTab === 'sentiment' && analysisResult.overall && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Detailed Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <Badge className={`text-2xl px-6 py-3 ${getSentimentColor(analysisResult.overall)}`}>
                          {analysisResult.overall.charAt(0).toUpperCase() + analysisResult.overall.slice(1)}
                        </Badge>
                        <div className="text-lg text-gray-600 dark:text-gray-400 mt-3">
                          Confidence: {analysisResult.confidence}%
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-600 font-medium">Positive Words</span>
                            <span className="font-bold">{analysisResult.scores.positive}</span>
                          </div>
                          <Progress value={analysisResult.percentages.positive} className="h-3" />
                          <div className="text-xs text-gray-500 mt-1">{analysisResult.percentages.positive}% of total words</div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-red-600 font-medium">Negative Words</span>
                            <span className="font-bold">{analysisResult.scores.negative}</span>
                          </div>
                          <Progress value={analysisResult.percentages.negative} className="h-3" />
                          <div className="text-xs text-gray-500 mt-1">{analysisResult.percentages.negative}% of total words</div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 font-medium">Neutral Words</span>
                            <span className="font-bold">{analysisResult.scores.neutral}</span>
                          </div>
                          <Progress value={analysisResult.percentages.neutral} className="h-3" />
                          <div className="text-xs text-gray-500 mt-1">{analysisResult.percentages.neutral}% of total words</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'keywords' && analysisResult.keywords && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Keyword Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.keywords.map((keyword: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg">{keyword.word}</span>
                            <Badge variant="outline">#{index + 1}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <div className="font-medium">{keyword.frequency}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Density:</span>
                              <div className="font-medium">{keyword.density}%</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Score:</span>
                              <div className="font-medium">{keyword.score}</div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${keyword.score * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'readability' && analysisResult.fleschReadingEase !== undefined && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Readability Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getReadabilityColor(analysisResult.readabilityLevel)}`}>
                          {analysisResult.readabilityLevel}
                        </div>
                        <div className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                          {analysisResult.gradeLevel}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{analysisResult.fleschReadingEase}</div>
                          <div className="text-sm text-blue-800 dark:text-blue-200">Flesch Reading Ease</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{analysisResult.fleschKincaidGrade}</div>
                          <div className="text-sm text-green-800 dark:text-green-200">Grade Level</div>
                        </div>
                      </div>

                      {analysisResult.metrics && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Readability Metrics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Avg. Words/Sentence:</span>
                              <div className="font-medium">{analysisResult.metrics.avgWordsPerSentence}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg. Syllables/Word:</span>
                              <div className="font-medium">{analysisResult.metrics.avgSyllablesPerWord}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Syllables:</span>
                              <div className="font-medium">{analysisResult.metrics.totalSyllables}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">ARI Score:</span>
                              <div className="font-medium">{analysisResult.ariScore}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Instructions */}
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                How to use Text Analyzer:
              </h3>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>• Paste or type your text in the input area</li>
                <li>• Choose analysis type: Full, Sentiment, Keywords, or Readability</li>
                <li>• Click "Analyze Text" to get comprehensive insights</li>
                <li>• View statistics, sentiment scores, and keyword rankings</li>
                <li>• Check readability levels and grade recommendations</li>
                <li>• Maximum text length: 100,000 characters</li>
                <li>• Get detailed metrics for content optimization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextTool;
