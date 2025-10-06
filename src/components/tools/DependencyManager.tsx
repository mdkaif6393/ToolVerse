import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, 
  CheckCircle, XCircle, ArrowUp, Package, 
  ExternalLink, Download, RefreshCw, Zap
} from 'lucide-react';

interface DependencyManagerProps {
  toolId: string;
  dependencies: string[];
}

interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  vulnerabilities: Vulnerability[];
  license: string;
  size: string;
  alternatives: Alternative[];
  updateAvailable: boolean;
}

interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  description: string;
  fixedIn?: string;
}

interface Alternative {
  name: string;
  reason: string;
  benefits: string[];
  migrationEffort: 'low' | 'medium' | 'high';
}

const DependencyManager: React.FC<DependencyManagerProps> = ({ toolId, dependencies }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Mock dependency data
  const mockDependencies: Dependency[] = [
    {
      name: 'react',
      currentVersion: '18.2.0',
      latestVersion: '18.2.0',
      vulnerabilities: [],
      license: 'MIT',
      size: '42.2 KB',
      alternatives: [],
      updateAvailable: false
    },
    {
      name: 'lodash',
      currentVersion: '4.17.20',
      latestVersion: '4.17.21',
      vulnerabilities: [
        {
          id: 'CVE-2021-23337',
          severity: 'high',
          title: 'Command Injection in lodash',
          description: 'lodash versions prior to 4.17.21 are vulnerable to Command Injection via template.',
          fixedIn: '4.17.21'
        }
      ],
      license: 'MIT',
      size: '69.1 KB',
      alternatives: [
        {
          name: 'ramda',
          reason: 'Functional programming approach',
          benefits: ['Immutable', 'Smaller bundle size', 'Tree-shakeable'],
          migrationEffort: 'medium'
        }
      ],
      updateAvailable: true
    },
    {
      name: 'moment',
      currentVersion: '2.29.1',
      latestVersion: '2.29.4',
      vulnerabilities: [],
      license: 'MIT',
      size: '232.4 KB',
      alternatives: [
        {
          name: 'date-fns',
          reason: 'Lighter and more modern',
          benefits: ['Tree-shakeable', '87% smaller', 'TypeScript support'],
          migrationEffort: 'low'
        },
        {
          name: 'dayjs',
          reason: 'Drop-in replacement',
          benefits: ['2kB size', 'Same API', 'Immutable'],
          migrationEffort: 'low'
        }
      ],
      updateAvailable: true
    }
  ];

  const securityScore = calculateSecurityScore(mockDependencies);

  function calculateSecurityScore(deps: Dependency[]): number {
    const totalVulns = deps.reduce((sum, dep) => sum + dep.vulnerabilities.length, 0);
    const criticalVulns = deps.reduce((sum, dep) => 
      sum + dep.vulnerabilities.filter(v => v.severity === 'critical').length, 0
    );
    const highVulns = deps.reduce((sum, dep) => 
      sum + dep.vulnerabilities.filter(v => v.severity === 'high').length, 0
    );
    
    let score = 100;
    score -= criticalVulns * 25;
    score -= highVulns * 15;
    score -= (totalVulns - criticalVulns - highVulns) * 5;
    
    return Math.max(0, score);
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'moderate': return <ShieldAlert className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getMigrationEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{securityScore}%</p>
              </div>
              <div className={`p-2 rounded-full ${securityScore >= 80 ? 'bg-green-100' : securityScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {securityScore >= 80 ? (
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                ) : securityScore >= 60 ? (
                  <ShieldAlert className="h-6 w-6 text-yellow-600" />
                ) : (
                  <Shield className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <Progress value={securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Dependencies</p>
                <p className="text-2xl font-bold">{mockDependencies.length}</p>
              </div>
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updates Available</p>
                <p className="text-2xl font-bold">{mockDependencies.filter(d => d.updateAvailable).length}</p>
              </div>
              <ArrowUp className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Scan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Scan
            </CardTitle>
            <Button onClick={runSecurityScan} disabled={isScanning}>
              {isScanning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Run Scan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {isScanning && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning dependencies...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="vulnerabilities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {mockDependencies.filter(dep => dep.vulnerabilities.length > 0).map((dep, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dep.name}</CardTitle>
                  <Badge variant="outline">v{dep.currentVersion}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dep.vulnerabilities.map((vuln, vulnIndex) => (
                  <div key={vulnIndex} className={`p-3 rounded-lg border ${getSeverityColor(vuln.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(vuln.severity)}
                        <div>
                          <h4 className="font-medium">{vuln.title}</h4>
                          <p className="text-sm opacity-80 mt-1">{vuln.description}</p>
                          {vuln.fixedIn && (
                            <p className="text-sm mt-2">
                              <strong>Fixed in:</strong> v{vuln.fixedIn}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          
          {mockDependencies.filter(dep => dep.vulnerabilities.length > 0).length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-600 mb-2">No Vulnerabilities Found</h3>
                  <p className="text-muted-foreground">All dependencies are secure and up to date.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          {mockDependencies.filter(dep => dep.updateAvailable).map((dep, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{dep.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dep.currentVersion} → {dep.latestVersion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Update Available</Badge>
                    <Button size="sm">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-4">
          {mockDependencies.filter(dep => dep.alternatives.length > 0).map((dep, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{dep.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dep.alternatives.map((alt, altIndex) => (
                  <div key={altIndex} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{alt.name}</h4>
                        <p className="text-sm text-muted-foreground">{alt.reason}</p>
                      </div>
                      <Badge className={getMigrationEffortColor(alt.migrationEffort)}>
                        {alt.migrationEffort} effort
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Benefits:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {alt.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDependencies.map((dep, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{dep.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{dep.license}</Badge>
                      <span className="text-sm text-muted-foreground">{dep.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DependencyManager;
