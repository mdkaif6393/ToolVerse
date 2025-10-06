import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitBranch, Tag, Clock, User, FileText, 
  Plus, Download, Eye, ArrowRight, 
  CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

interface ToolVersion {
  id: string;
  version: string;
  type: 'major' | 'minor' | 'patch';
  status: 'draft' | 'published' | 'deprecated';
  releaseDate: string;
  author: string;
  changelog: string;
  downloads: number;
  isActive: boolean;
  fileSize: string;
  compatibility: string[];
}

interface ToolVersioningProps {
  toolId: string;
  toolName: string;
  currentVersion: string;
}

const ToolVersioning: React.FC<ToolVersioningProps> = ({ toolId, toolName, currentVersion }) => {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: '',
    type: 'patch' as 'major' | 'minor' | 'patch',
    changelog: ''
  });

  // Mock version data
  const versions: ToolVersion[] = [
    {
      id: '1',
      version: '2.1.0',
      type: 'minor',
      status: 'published',
      releaseDate: '2024-01-15',
      author: 'John Doe',
      changelog: 'Added batch processing feature, improved performance by 30%, fixed memory leaks',
      downloads: 1250,
      isActive: true,
      fileSize: '2.4 MB',
      compatibility: ['Node.js 18+', 'React 18+', 'TypeScript 4.9+']
    },
    {
      id: '2',
      version: '2.0.1',
      type: 'patch',
      status: 'published',
      releaseDate: '2024-01-10',
      author: 'Jane Smith',
      changelog: 'Fixed critical security vulnerability, updated dependencies',
      downloads: 890,
      isActive: false,
      fileSize: '2.3 MB',
      compatibility: ['Node.js 16+', 'React 17+', 'TypeScript 4.5+']
    },
    {
      id: '3',
      version: '2.0.0',
      type: 'major',
      status: 'published',
      releaseDate: '2024-01-01',
      author: 'John Doe',
      changelog: 'Complete rewrite with TypeScript, new UI components, breaking API changes',
      downloads: 2100,
      isActive: false,
      fileSize: '2.1 MB',
      compatibility: ['Node.js 16+', 'React 17+', 'TypeScript 4.5+']
    },
    {
      id: '4',
      version: '1.5.2',
      type: 'patch',
      status: 'deprecated',
      releaseDate: '2023-12-15',
      author: 'Jane Smith',
      changelog: 'Bug fixes and minor improvements',
      downloads: 3200,
      isActive: false,
      fileSize: '1.8 MB',
      compatibility: ['Node.js 14+', 'React 16+']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50 border-green-200';
      case 'draft': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'deprecated': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'text-red-600 bg-red-50';
      case 'minor': return 'text-blue-600 bg-blue-50';
      case 'patch': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <RefreshCw className="h-4 w-4" />;
      case 'deprecated': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateVersion = () => {
    // Mock version creation
    console.log('Creating new version:', newVersion);
    setIsCreatingVersion(false);
    setNewVersion({ version: '', type: 'patch', changelog: '' });
  };

  const generateNextVersion = (type: 'major' | 'minor' | 'patch') => {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Version Management</h2>
          <p className="text-muted-foreground">Manage versions and releases for {toolName}</p>
        </div>
        <Dialog open={isCreatingVersion} onOpenChange={setIsCreatingVersion}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="version-type">Version Type</Label>
                <Select 
                  value={newVersion.type} 
                  onValueChange={(value: 'major' | 'minor' | 'patch') => {
                    setNewVersion(prev => ({
                      ...prev,
                      type: value,
                      version: generateNextVersion(value)
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patch">Patch (Bug fixes)</SelectItem>
                    <SelectItem value="minor">Minor (New features)</SelectItem>
                    <SelectItem value="major">Major (Breaking changes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version-number">Version Number</Label>
                <Input
                  id="version-number"
                  value={newVersion.version}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 2.1.1"
                />
              </div>

              <div>
                <Label htmlFor="changelog">Changelog</Label>
                <Textarea
                  id="changelog"
                  value={newVersion.changelog}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, changelog: e.target.value }))}
                  placeholder="Describe the changes in this version..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingVersion(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create Version
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Version Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Current Version
            </CardTitle>
            <Badge variant="default" className="text-lg px-3 py-1">
              v{currentVersion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="font-semibold">1,250</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Released</p>
                <p className="font-semibold">Jan 15, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Author</p>
                <p className="font-semibold">John Doe</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id} className="relative">
                {/* Timeline connector */}
                {index < versions.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                )}
                
                <div className="flex items-start gap-4">
                  {/* Version indicator */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    version.isActive ? 'bg-primary border-primary' : 'bg-background border-border'
                  }`}>
                    {version.isActive ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Tag className={`h-5 w-5 ${version.isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    )}
                  </div>

                  {/* Version details */}
                  <div className="flex-1 min-w-0">
                    <Card className={version.isActive ? 'ring-2 ring-primary ring-opacity-50' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">v{version.version}</h3>
                            <Badge className={getTypeColor(version.type)}>
                              {version.type}
                            </Badge>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${getStatusColor(version.status)}`}>
                              {getStatusIcon(version.status)}
                              {version.status}
                            </div>
                            {version.isActive && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{version.changelog}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Released</p>
                            <p className="font-medium">{new Date(version.releaseDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Author</p>
                            <p className="font-medium">{version.author}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Downloads</p>
                            <p className="font-medium">{version.downloads.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{version.fileSize}</p>
                          </div>
                        </div>

                        {version.compatibility.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground mb-2">Compatibility:</p>
                            <div className="flex flex-wrap gap-2">
                              {version.compatibility.map((comp, compIndex) => (
                                <Badge key={compIndex} variant="outline" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Versions</p>
                <p className="text-2xl font-bold">{versions.length}</p>
              </div>
              <GitBranch className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {versions.reduce((sum, v) => sum + v.downloads, 0).toLocaleString()}
                </p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latest Release</p>
                <p className="text-2xl font-bold">
                  {Math.floor((Date.now() - new Date(versions[0].releaseDate).getTime()) / (1000 * 60 * 60 * 24))}d ago
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ToolVersioning;
