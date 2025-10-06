import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, RefreshCw, X, Eye, EyeOff, Key } from "lucide-react";

interface PasswordToolProps {
  onClose?: () => void;
}

const PasswordTool: React.FC<PasswordToolProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'checker' | 'passphrase'>('generator');
  const [length, setLength] = useState([12]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [customCharacters, setCustomCharacters] = useState('');
  const [generatedPasswords, setGeneratedPasswords] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPasswords, setShowPasswords] = useState(true);
  
  // Password checker states
  const [checkPassword, setCheckPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Passphrase states
  const [wordCount, setWordCount] = useState([4]);
  const [separator, setSeparator] = useState('-');
  const [includeNumbersInPassphrase, setIncludeNumbersInPassphrase] = useState(false);
  const [capitalize, setCapitalize] = useState(false);
  const [passphraseCount, setPassphraseCount] = useState(1);
  const [generatedPassphrases, setGeneratedPassphrases] = useState<any[]>([]);
  
  const { toast } = useToast();

  const generatePasswords = async () => {
    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols && !customCharacters) {
      toast({
        title: "❌ Invalid Options",
        description: "Please select at least one character type or provide custom characters",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tools/password-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length: length[0],
          includeUppercase,
          includeLowercase,
          includeNumbers,
          includeSymbols,
          excludeSimilar,
          excludeAmbiguous,
          customCharacters,
          count
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedPasswords(result.passwords);

      toast({
        title: "✅ Passwords Generated!",
        description: `Generated ${result.passwords.length} secure password(s)`,
      });

    } catch (error) {
      console.error('Password generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate passwords",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkPasswordStrength = async () => {
    if (!checkPassword.trim()) {
      toast({
        title: "❌ Password Required",
        description: "Please enter a password to check its strength",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    
    try {
      const response = await fetch('/api/tools/password-generator/check-strength', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: checkPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Strength check failed');
      }

      const result = await response.json();
      setPasswordStrength(result);

      toast({
        title: "✅ Password Analyzed!",
        description: `Strength: ${result.strength.level}`,
      });

    } catch (error) {
      console.error('Password check error:', error);
      toast({
        title: "❌ Check Failed",
        description: error instanceof Error ? error.message : "Failed to check password strength",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const generatePassphrases = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tools/password-generator/passphrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordCount: wordCount[0],
          separator,
          includeNumbers: includeNumbersInPassphrase,
          capitalize,
          count: passphraseCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Passphrase generation failed');
      }

      const result = await response.json();
      setGeneratedPassphrases(result.passphrases);

      toast({
        title: "✅ Passphrases Generated!",
        description: `Generated ${result.passphrases.length} secure passphrase(s)`,
      });

    } catch (error) {
      console.error('Passphrase generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate passphrases",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied!",
      description: "Password copied to clipboard",
    });
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Password Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate secure passwords and analyze password strength
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
          variant={activeTab === 'generator' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('generator')}
          className="flex-1"
        >
          <Key className="mr-2 h-4 w-4" />
          Password Generator
        </Button>
        <Button
          variant={activeTab === 'checker' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('checker')}
          className="flex-1"
        >
          <Shield className="mr-2 h-4 w-4" />
          Strength Checker
        </Button>
        <Button
          variant={activeTab === 'passphrase' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('passphrase')}
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Passphrase
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {activeTab === 'generator' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Password Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Length: {length[0]} characters
                    </label>
                    <Slider
                      value={length}
                      onValueChange={setLength}
                      min={4}
                      max={128}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Count: {count} password(s)
                    </label>
                    <Input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      min={1}
                      max={100}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Include Uppercase (A-Z)</label>
                      <Switch checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Include Lowercase (a-z)</label>
                      <Switch checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Include Numbers (0-9)</label>
                      <Switch checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Include Symbols (!@#$%)</label>
                      <Switch checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Exclude Similar (il1Lo0O)</label>
                      <Switch checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Exclude Ambiguous ({}[]())</label>
                      <Switch checked={excludeAmbiguous} onCheckedChange={setExcludeAmbiguous} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Characters (optional)
                    </label>
                    <Input
                      value={customCharacters}
                      onChange={(e) => setCustomCharacters(e.target.value)}
                      placeholder="Enter custom character set..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={generatePasswords}
                disabled={isGenerating}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-5 w-5" />
                    Generate Passwords
                  </>
                )}
              </Button>
            </>
          )}

          {activeTab === 'checker' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Password Strength Checker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter Password to Check
                    </label>
                    <Input
                      type="password"
                      value={checkPassword}
                      onChange={(e) => setCheckPassword(e.target.value)}
                      placeholder="Enter password..."
                    />
                  </div>

                  <Button
                    onClick={checkPasswordStrength}
                    disabled={isChecking || !checkPassword.trim()}
                    className="w-full"
                  >
                    {isChecking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Check Strength
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'passphrase' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Passphrase Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Word Count: {wordCount[0]} words
                    </label>
                    <Slider
                      value={wordCount}
                      onValueChange={setWordCount}
                      min={2}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Separator</label>
                    <Input
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      placeholder="-"
                      maxLength={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Count: {passphraseCount} passphrase(s)
                    </label>
                    <Input
                      type="number"
                      value={passphraseCount}
                      onChange={(e) => setPassphraseCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Include Numbers</label>
                      <Switch checked={includeNumbersInPassphrase} onCheckedChange={setIncludeNumbersInPassphrase} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Capitalize Words</label>
                      <Switch checked={capitalize} onCheckedChange={setCapitalize} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={generatePassphrases}
                disabled={isGenerating}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate Passphrases
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {activeTab === 'generator' && generatedPasswords.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Passwords</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedPasswords.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <Badge 
                            style={{ backgroundColor: item.strength.color }}
                            className="text-white"
                          >
                            {item.strength.level}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.password)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                        {showPasswords ? item.password : '•'.repeat(item.password.length)}
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Strength: {item.strength.score}%</span>
                          <span>Length: {item.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStrengthColor(item.strength.score)}`}
                            style={{ width: `${item.strength.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'checker' && passwordStrength && (
            <Card>
              <CardHeader>
                <CardTitle>Strength Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2" style={{ color: passwordStrength.strength.color }}>
                      {passwordStrength.strength.score}%
                    </div>
                    <Badge 
                      style={{ backgroundColor: passwordStrength.strength.color }}
                      className="text-white text-lg px-4 py-1"
                    >
                      {passwordStrength.strength.level}
                    </Badge>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getStrengthColor(passwordStrength.strength.score)}`}
                      style={{ width: `${passwordStrength.strength.score}%` }}
                    ></div>
                  </div>

                  {passwordStrength.strength.feedback.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Suggestions:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {passwordStrength.strength.feedback.map((feedback: string, index: number) => (
                          <li key={index}>• {feedback}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {passwordStrength.analysis && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Length:</span> {passwordStrength.analysis.length}
                      </div>
                      <div>
                        <span className="font-medium">Entropy:</span> {passwordStrength.analysis.entropy?.toFixed(1)} bits
                      </div>
                      <div>
                        <span className="font-medium">Crack Time:</span> {passwordStrength.analysis.estimatedCrackTime}
                      </div>
                      <div>
                        <span className="font-medium">Character Types:</span> {
                          [
                            passwordStrength.analysis.hasLowercase && 'a-z',
                            passwordStrength.analysis.hasUppercase && 'A-Z',
                            passwordStrength.analysis.hasNumbers && '0-9',
                            passwordStrength.analysis.hasSymbols && '!@#'
                          ].filter(Boolean).join(', ')
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'passphrase' && generatedPassphrases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Passphrases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedPassphrases.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <Badge 
                            style={{ backgroundColor: item.strength.color }}
                            className="text-white"
                          >
                            {item.strength.level}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.passphrase)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                        {item.passphrase}
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Strength: {item.strength.score}%</span>
                          <span>Words: {item.wordCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStrengthColor(item.strength.score)}`}
                            style={{ width: `${item.strength.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Security Tips:
              </h3>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Use passwords with at least 12 characters</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid common words, names, or personal information</li>
                <li>• Use unique passwords for each account</li>
                <li>• Consider using passphrases for better memorability</li>
                <li>• Store passwords securely in a password manager</li>
                <li>• Enable two-factor authentication when available</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PasswordTool;
