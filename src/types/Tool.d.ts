export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'pdf' | 'business' | 'ai' | 'productivity';
  icon: string;
  isActive: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
}

export interface ToolUsage {
  toolId: string;
  userId: string;
  usedAt: Date;
  duration?: number;
  success: boolean;
}

export interface ToolStats {
  totalTools: number;
  totalUsage: number;
  favoriteTools: Tool[];
  recentlyUsed: Tool[];
  categoryStats: {
    category: string;
    count: number;
    usage: number;
  }[];
}

export interface PDFTool extends Tool {
  category: 'pdf';
  features: {
    merge: boolean;
    split: boolean;
    compress: boolean;
    convert: boolean;
    protect: boolean;
    extract: boolean;
  };
}

export interface AITool extends Tool {
  category: 'ai';
  features: {
    textGeneration: boolean;
    imageGeneration: boolean;
    translation: boolean;
    analysis: boolean;
    summarization: boolean;
  };
}