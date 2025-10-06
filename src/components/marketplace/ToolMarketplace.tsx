import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Star, 
  Download, 
  TrendingUp, 
  Filter, 
  Heart, 
  Share2, 
  ExternalLink,
  DollarSign,
  Users,
  Calendar,
  Award,
  Zap,
  Shield,
  Code2,
  Palette,
  FileText,
  Briefcase,
  Brain,
  Crown,
  Verified,
  Eye,
  MessageSquare,
  GitFork,
  Package
} from "lucide-react";

interface MarketplaceTool {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
    reputation: number;
  };
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  downloads: number;
  price: number; // 0 for free
  featured: boolean;
  trending: boolean;
  lastUpdated: Date;
  version: string;
  screenshots: string[];
  techStack: string[];
  license: string;
  compatibility: string[];
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
  color: string;
}

const ToolMarketplace = () => {
  const [tools, setTools] = useState<MarketplaceTool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price'>('popular');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = () => {
    const mockCategories: Category[] = [
      { id: 'all', name: 'All Tools', icon: Package, count: 156, color: 'bg-gray-500' },
      { id: 'pdf', name: 'PDF Tools', icon: FileText, count: 28, color: 'bg-red-500' },
      { id: 'ai', name: 'AI Tools', icon: Brain, count: 35, color: 'bg-purple-500' },
      { id: 'productivity', name: 'Productivity', icon: Zap, count: 42, color: 'bg-green-500' },
      { id: 'design', name: 'Design', icon: Palette, count: 24, color: 'bg-pink-500' },
      { id: 'business', name: 'Business', icon: Briefcase, count: 18, color: 'bg-blue-500' },
      { id: 'development', name: 'Development', icon: Code2, count: 9, color: 'bg-orange-500' }
    ];

    const mockTools: MarketplaceTool[] = [
      {
        id: '1',
        name: 'PDF Master Pro',
        description: 'Advanced PDF manipulation tool with AI-powered features. Merge, split, compress, and convert PDFs with ease.',
        author: {
          name: 'TechCorp Solutions',
          avatar: '/api/placeholder/32/32',
          verified: true,
          reputation: 4.8
        },
        category: 'pdf',
        tags: ['pdf', 'merge', 'split', 'ai', 'ocr'],
        rating: 4.9,
        reviews: 1247,
        downloads: 25680,
        price: 29.99,
        featured: true,
        trending: true,
        lastUpdated: new Date('2024-09-15'),
        version: '2.1.0',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['React', 'TypeScript', 'PDF.js'],
        license: 'Commercial',
        compatibility: ['Web', 'Desktop', 'Mobile']
      },
      {
        id: '2',
        name: 'Smart Text Analyzer',
        description: 'AI-powered text analysis tool supporting Hindi and English. Sentiment analysis, keyword extraction, and more.',
        author: {
          name: 'AI Innovations',
          avatar: '/api/placeholder/32/32',
          verified: true,
          reputation: 4.6
        },
        category: 'ai',
        tags: ['ai', 'nlp', 'sentiment', 'hindi', 'english'],
        rating: 4.7,
        reviews: 892,
        downloads: 18450,
        price: 0,
        featured: false,
        trending: true,
        lastUpdated: new Date('2024-09-20'),
        version: '1.5.2',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['Python', 'FastAPI', 'Transformers'],
        license: 'MIT',
        compatibility: ['Web', 'API']
      },
      {
        id: '3',
        name: 'Task Flow Manager',
        description: 'Streamline your workflow with intelligent task management. Gantt charts, time tracking, team collaboration.',
        author: {
          name: 'ProductivityHub',
          avatar: '/api/placeholder/32/32',
          verified: false,
          reputation: 4.2
        },
        category: 'productivity',
        tags: ['tasks', 'workflow', 'gantt', 'collaboration'],
        rating: 4.4,
        reviews: 567,
        downloads: 12340,
        price: 19.99,
        featured: false,
        trending: false,
        lastUpdated: new Date('2024-08-30'),
        version: '1.2.1',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['Vue.js', 'Node.js', 'MongoDB'],
        license: 'Commercial',
        compatibility: ['Web', 'Desktop']
      },
      {
        id: '4',
        name: 'Design System Builder',
        description: 'Create consistent design systems with automated component generation. Supports Figma integration.',
        author: {
          name: 'DesignTools Inc',
          avatar: '/api/placeholder/32/32',
          verified: true,
          reputation: 4.9
        },
        category: 'design',
        tags: ['design-system', 'components', 'figma', 'tokens'],
        rating: 4.8,
        reviews: 423,
        downloads: 8920,
        price: 49.99,
        featured: true,
        trending: false,
        lastUpdated: new Date('2024-09-25'),
        version: '3.0.0',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['React', 'Storybook', 'Figma API'],
        license: 'Commercial',
        compatibility: ['Web', 'Figma Plugin']
      },
      {
        id: '5',
        name: 'Invoice Generator Pro',
        description: 'Professional invoice generation with multi-currency support, tax calculations, and payment integration.',
        author: {
          name: 'BizSoft Solutions',
          avatar: '/api/placeholder/32/32',
          verified: true,
          reputation: 4.5
        },
        category: 'business',
        tags: ['invoice', 'billing', 'payments', 'tax', 'multi-currency'],
        rating: 4.6,
        reviews: 734,
        downloads: 15670,
        price: 0,
        featured: false,
        trending: true,
        lastUpdated: new Date('2024-09-18'),
        version: '2.3.1',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['Next.js', 'Stripe', 'PostgreSQL'],
        license: 'Apache 2.0',
        compatibility: ['Web', 'Mobile', 'API']
      },
      {
        id: '6',
        name: 'Code Quality Checker',
        description: 'Comprehensive code analysis tool with support for 15+ programming languages. Security and performance insights.',
        author: {
          name: 'DevTools Pro',
          avatar: '/api/placeholder/32/32',
          verified: true,
          reputation: 4.7
        },
        category: 'development',
        tags: ['code-quality', 'security', 'performance', 'linting'],
        rating: 4.5,
        reviews: 312,
        downloads: 6890,
        price: 39.99,
        featured: false,
        trending: false,
        lastUpdated: new Date('2024-09-10'),
        version: '1.8.0',
        screenshots: ['/api/placeholder/400/300'],
        techStack: ['Rust', 'WebAssembly', 'TypeScript'],
        license: 'Commercial',
        compatibility: ['Web', 'CLI', 'IDE Plugin']
      }
    ];

    setCategories(mockCategories);
    setTools(mockTools);
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && tool.price === 0) ||
                        (priceFilter === 'paid' && tool.price > 0);
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        return a.price - b.price;
      default: // popular
        return b.downloads - a.downloads;
    }
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Package;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tool Marketplace
                <Badge variant="outline">156 tools</Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Discover, install, and share powerful tools with the community
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Publish Tool
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="my-tools">My Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tools, categories, or authors..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>

                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Price: Low to High</option>
                  </select>

                  <select 
                    value={priceFilter} 
                    onChange={(e) => setPriceFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free Only</option>
                    <option value="paid">Paid Only</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.slice(1).map(category => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer hover-lift transition-all ${
                    selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="pt-4 text-center">
                    <div className={`h-12 w-12 mx-auto mb-2 rounded-lg ${category.color} flex items-center justify-center`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.count} tools</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <Card key={tool.id} className="hover-lift cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {tool.featured && <Crown className="h-4 w-4 text-yellow-500" />}
                      {tool.trending && <TrendingUp className="h-4 w-4 text-green-500" />}
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.id === tool.category)?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {tool.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={tool.author.avatar} />
                      <AvatarFallback className="text-xs">{tool.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{tool.author.name}</span>
                    {tool.author.verified && <Verified className="h-4 w-4 text-blue-500" />}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{tool.rating}</span>
                        <span className="text-muted-foreground">({formatNumber(tool.reviews)})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>{formatNumber(tool.downloads)}</span>
                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      {formatPrice(tool.price)}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tool.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tool.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      {tool.price === 0 ? 'Install' : 'Buy Now'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tools Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or browse different categories
                  </p>
                  <Button onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setPriceFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.filter(tool => tool.featured).map(tool => (
              <Card key={tool.id} className="hover-lift cursor-pointer group border-2 border-yellow-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{tool.rating}</span>
                      <span className="text-muted-foreground">({formatNumber(tool.reviews)} reviews)</span>
                    </div>
                    <div className="font-bold text-lg text-primary">
                      {formatPrice(tool.price)}
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    {tool.price === 0 ? 'Install Now' : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.filter(tool => tool.trending).map(tool => (
              <Card key={tool.id} className="hover-lift cursor-pointer group border-2 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <Badge className="bg-green-100 text-green-800">Trending</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>{formatNumber(tool.downloads)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">+{Math.floor(Math.random() * 50 + 10)}%</span>
                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      {formatPrice(tool.price)}
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    {tool.price === 0 ? 'Install Now' : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-tools" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Published Tools</h3>
                <p className="text-muted-foreground mb-4">
                  Start sharing your tools with the community and earn revenue
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Publish Your First Tool
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolMarketplace;
