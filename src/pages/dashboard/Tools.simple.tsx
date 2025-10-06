import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as LucideIcons from "lucide-react";
import { useTools } from "@/hooks/useTools";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Settings, 
  Zap, 
  Play,
  ExternalLink,
  Code,
  Terminal,
  RefreshCw
} from "lucide-react";

const Tools = () => {
  const { tools, isLoading } = useTools();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isToolRunning, setIsToolRunning] = useState(false);

  // Handle tool usage
  const handleUseTool = async (tool: any) => {
    setSelectedTool(tool);
    setIsToolRunning(true);

    try {
      // Simulate tool initialization
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: `🚀 ${tool.name} Started!`,
        description: "Tool is now running in a new window",
      });

      // In a real implementation, this would:
      // 1. Load the tool's code from uploaded files
      // 2. Create a sandboxed environment  
      // 3. Execute the tool with proper security
      // 4. Open tool interface in new window/iframe
      
      setTimeout(() => {
        setIsToolRunning(false);
        // Open tool in new window (demo)
        window.open(`/tools/${tool.slug}`, '_blank');
        
        toast({
          title: "✅ Tool Ready!",
          description: `${tool.name} is now ready to use`,
        });
      }, 1000);

    } catch (error) {
      setIsToolRunning(false);
      toast({
        title: "❌ Tool Failed to Start",
        description: "There was an error starting the tool. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  // Filter tools based on search
  const filteredCategories = Object.entries(toolsByCategory).reduce((acc, [category, categoryTools]) => {
    const filtered = categoryTools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof tools>);

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return LucideIcons.Zap;
    // @ts-ignore - Dynamic icon lookup
    return LucideIcons[iconName] || LucideIcons.Zap;
  };

  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { title: string; icon: string; description: string; color: string }> = {
      pdf: { 
        title: "📄 PDF Tools", 
        icon: "FileText", 
        description: "Manipulate, merge, and convert PDF documents",
        color: "bg-red-500/10 border-red-200 dark:border-red-800"
      },
      business: { 
        title: "💼 Business Tools", 
        icon: "Briefcase", 
        description: "Streamline business processes and workflows",
        color: "bg-blue-500/10 border-blue-200 dark:border-blue-800"
      },
      ai: { 
        title: "🤖 AI Tools", 
        icon: "Brain", 
        description: "AI-powered analysis and generation tools",
        color: "bg-purple-500/10 border-purple-200 dark:border-purple-800"
      },
      productivity: { 
        title: "⚡ Productivity Tools", 
        icon: "Zap", 
        description: "Boost your efficiency and get things done",
        color: "bg-green-500/10 border-green-200 dark:border-green-800"
      },
      design: { 
        title: "🎨 Design Tools", 
        icon: "Palette", 
        description: "Create and optimize visual content",
        color: "bg-pink-500/10 border-pink-200 dark:border-pink-800"
      },
      development: { 
        title: "💻 Development Tools", 
        icon: "Code", 
        description: "Code analysis and development utilities",
        color: "bg-orange-500/10 border-orange-200 dark:border-orange-800"
      }
    };
    return categories[category] || { 
      title: category, 
      icon: "Zap", 
      description: "Various tools",
      color: "bg-gray-500/10 border-gray-200 dark:border-gray-800"
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tools Marketplace
          </h1>
          <p className="text-muted-foreground">Discover and use powerful tools to boost your productivity</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={() => navigate('/dashboard/tools-admin')} variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Zap className="mr-2 h-4 w-4" />
            Create Tool
          </Button>
        </div>
      </div>

      {/* How to Use Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
          <Play className="mr-2 h-5 w-5" />
          🎯 Tools कैसे Use करें?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="font-medium text-blue-700">Tool Select करें</p>
              <p className="text-blue-600">नीचे से कोई भी tool choose करें</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="font-medium text-blue-700">"Use Tool" Click करें</p>
              <p className="text-blue-600">Tool card में green button दबाएं</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="font-medium text-blue-700">Tool Loading होगा</p>
              <p className="text-blue-600">कुछ seconds wait करें</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <p className="font-medium text-blue-700">New Window में Open</p>
              <p className="text-blue-600">Tool का interface ready!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tool Running Dialog */}
      <Dialog open={isToolRunning} onOpenChange={setIsToolRunning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Starting {selectedTool?.name}...
            </DialogTitle>
            <DialogDescription>
              Please wait while we initialize your tool. This may take a few seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <span className="text-sm text-muted-foreground">70%</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tools by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading tools...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredCategories).map(([category, categoryTools]) => {
            const categoryInfo = getCategoryInfo(category);
            const IconComponent = getIconComponent(categoryInfo.icon);
            
            return (
              <div key={category} className={`rounded-lg border p-6 ${categoryInfo.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-semibold">{categoryInfo.title}</h2>
                      <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{categoryTools.length} tools</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTools.map((tool) => {
                    const ToolIcon = getIconComponent(tool.icon);
                    return (
                      <Card key={tool.id} className="hover:shadow-md transition-shadow group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <ToolIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{tool.name}</CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                v{tool.version}
                              </Badge>
                              <Badge 
                                variant={tool.status === 'enabled' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {tool.status}
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                              onClick={() => handleUseTool(tool)}
                              disabled={tool.status !== 'enabled'}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Use Tool
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tools;
