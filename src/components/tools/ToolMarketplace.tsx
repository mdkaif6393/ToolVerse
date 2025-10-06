import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  TrendingUp,
  Users,
  Clock,
  Zap,
  Heart,
  Share2,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  downloads: number;
  rating: number;
  reviews: number;
  author: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  price: 'free' | 'premium';
}

const mockTools: Tool[] = [
  {
    id: '1',
    name: 'PDF Merger Pro',
    description: 'Advanced PDF merging with batch processing and custom ordering',
    category: 'pdf',
    icon: 'FileText',
    version: '2.1.0',
    downloads: 15420,
    rating: 4.8,
    reviews: 342,
    author: 'ToolCraft Inc',
    tags: ['pdf', 'merge', 'batch'],
    featured: true,
    trending: true,
    price: 'premium'
  },
  {
    id: '2',
    name: 'AI Text Summarizer',
    description: 'Intelligent text summarization using advanced AI algorithms',
    category: 'ai',
    icon: 'Brain',
    version: '1.5.2',
    downloads: 8930,
    rating: 4.6,
    reviews: 156,
    author: 'AI Solutions',
    tags: ['ai', 'text', 'summarize'],
    featured: true,
    trending: false,
    price: 'free'
  },
  {
    id: '3',
    name: 'Code Formatter Plus',
    description: 'Multi-language code formatter with custom style configurations',
    category: 'development',
    icon: 'Code',
    version: '3.0.1',
    downloads: 12560,
    rating: 4.9,
    reviews: 289,
    author: 'DevTools Co',
    tags: ['code', 'format', 'style'],
    featured: false,
    trending: true,
    price: 'free'
  },
  {
    id: '4',
    name: 'Image Optimizer',
    description: 'Compress and optimize images without quality loss',
    category: 'design',
    icon: 'Image',
    version: '1.8.0',
    downloads: 22100,
    rating: 4.7,
    reviews: 445,
    author: 'PixelPerfect',
    tags: ['image', 'optimize', 'compress'],
    featured: true,
    trending: false,
    price: 'premium'
  }
];

const categoryConfig = {
  pdf: { emoji: '📄', name: 'PDF Tools', color: 'bg-red-100 text-red-800' },
  ai: { emoji: '🤖', name: 'AI Tools', color: 'bg-purple-100 text-purple-800' },
  development: { emoji: '💻', name: 'Development', color: 'bg-blue-100 text-blue-800' },
  design: { emoji: '🎨', name: 'Design', color: 'bg-pink-100 text-pink-800' },
  business: { emoji: '💼', name: 'Business', color: 'bg-green-100 text-green-800' },
  productivity: { emoji: '⚡', name: 'Productivity', color: 'bg-yellow-100 text-yellow-800' }
};

const ToolMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');

  const filteredTools = mockTools
    .filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const matchesPrice = priceFilter === 'all' || tool.price === priceFilter;
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.downloads - a.downloads;
        case 'recent': return b.version.localeCompare(a.version);
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const featuredTools = mockTools.filter(tool => tool.featured);
  const trendingTools = mockTools.filter(tool => tool.trending);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tool Marketplace
          </h1>
          <p className="text-muted-foreground">Discover, download, and deploy powerful tools</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Zap className="mr-2 h-4 w-4" />
          Submit Your Tool
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tools</p>
                <p className="text-2xl font-bold text-blue-600">{mockTools.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold text-green-600">
                  {(mockTools.reduce((sum, tool) => sum + tool.downloads, 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(mockTools.reduce((sum, tool) => sum + tool.rating, 0) / mockTools.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-orange-600">2.4K</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explore">🔍 Explore</TabsTrigger>
          <TabsTrigger value="featured">⭐ Featured</TabsTrigger>
          <TabsTrigger value="trending">🔥 Trending</TabsTrigger>
          <TabsTrigger value="categories">📂 Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tools, tags, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.emoji} {config.name}</option>
                    ))}
                  </select>
                  <select 
                    value={priceFilter} 
                    onChange={(e) => setPriceFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="recent">Recently Updated</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const categoryInfo = categoryConfig[tool.category as keyof typeof categoryConfig];
              
              return (
                <Card key={tool.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                  <div className="relative">
                    {tool.featured && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          ⭐ Featured
                        </Badge>
                      </div>
                    )}
                    {tool.trending && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white">
                          🔥 Trending
                        </Badge>
                      </div>
                    )}
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <div className="text-4xl">{categoryInfo?.emoji}</div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {tool.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">by {tool.author}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm mb-4 line-clamp-2">
                      {tool.description}
                    </CardDescription>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={categoryInfo?.color}>
                        {categoryInfo?.name}
                      </Badge>
                      <Badge variant={tool.price === 'free' ? 'default' : 'secondary'}>
                        {tool.price === 'free' ? '💚 Free' : '💎 Premium'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{tool.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{(tool.downloads / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{tool.reviews}</span>
                        </div>
                      </div>
                      <span className="text-xs">v{tool.version}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                        <Download className="mr-1 h-3 w-3" />
                        Install
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTools.map((tool) => (
              <Card key={tool.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{categoryConfig[tool.category as keyof typeof categoryConfig]?.emoji}</div>
                      <div>
                        <CardTitle className="text-xl">{tool.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">by {tool.author}</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      ⭐ Featured
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{tool.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{(tool.downloads / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                      View Details <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingTools.map((tool, index) => (
              <Card key={tool.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white text-xs">
                          🔥 Trending
                        </Badge>
                        <span className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 50 + 10)}% this week</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{(tool.downloads / 1000).toFixed(1)}K downloads</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const categoryTools = mockTools.filter(tool => tool.category === key);
              const totalDownloads = categoryTools.reduce((sum, tool) => sum + tool.downloads, 0);
              
              return (
                <Card key={key} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{config.emoji}</div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{config.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{categoryTools.length} tools available</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 mb-1">
                          <Download className="h-3 w-3" />
                          <span>{(totalDownloads / 1000).toFixed(1)}K total downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>
                            {(categoryTools.reduce((sum, tool) => sum + tool.rating, 0) / categoryTools.length).toFixed(1)} avg rating
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Explore <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolMarketplace;
