import { supabase } from '@/lib/supabase';

// Scalable Storage Strategy for Production
export class ScalableToolStorage {
  
  // Strategy 1: Hierarchical Bucket Structure
  static async createHierarchicalPath(toolId: string, userId: string, category: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Hierarchical path: users/userId/category/year/month/day/toolId/
    return `users/${userId}/${category}/${year}/${month}/${day}/${toolId}`;
  }

  // Strategy 2: Multiple Buckets by Category
  static getBucketByCategory(category: string): string {
    const bucketMap = {
      'pdf': 'tools-pdf',
      'ai': 'tools-ai', 
      'business': 'tools-business',
      'design': 'tools-design',
      'development': 'tools-dev',
      'productivity': 'tools-productivity'
    };
    return bucketMap[category as keyof typeof bucketMap] || 'tools-general';
  }

  // Strategy 3: File Size Based Storage
  static getBucketByFileSize(fileSize: number): string {
    if (fileSize < 1024 * 1024) return 'tools-small'; // < 1MB
    if (fileSize < 10 * 1024 * 1024) return 'tools-medium'; // < 10MB
    return 'tools-large'; // >= 10MB
  }

  // Strategy 4: User-based Buckets (Enterprise)
  static getUserBucket(userId: string, isPremium: boolean): string {
    return isPremium ? `tools-premium-${userId}` : `tools-free-${userId}`;
  }

  // Production Upload Method
  static async uploadToolFile(
    file: File, 
    toolId: string, 
    userId: string, 
    category: string,
    strategy: 'hierarchical' | 'category' | 'size' | 'user' = 'hierarchical'
  ): Promise<{
    publicUrl: string;
    filePath: string;
    bucket: string;
    metadata: any;
  }> {
    
    let bucket: string;
    let filePath: string;
    
    switch (strategy) {
      case 'hierarchical':
        bucket = 'tools-main';
        const hierarchicalPath = await this.createHierarchicalPath(toolId, userId, category);
        filePath = `${hierarchicalPath}/${file.name}`;
        break;
        
      case 'category':
        bucket = this.getBucketByCategory(category);
        filePath = `${userId}/${toolId}/${file.name}`;
        break;
        
      case 'size':
        bucket = this.getBucketByFileSize(file.size);
        filePath = `${category}/${userId}/${toolId}/${file.name}`;
        break;
        
      case 'user':
        bucket = this.getUserBucket(userId, false); // Check premium status
        filePath = `${category}/${toolId}/${file.name}`;
        break;
        
      default:
        bucket = 'tools-main';
        filePath = `${toolId}/${file.name}`;
    }

    // Upload with metadata
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          toolId,
          userId,
          category,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
          mimeType: file.type
        }
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      publicUrl,
      filePath,
      bucket,
      metadata: {
        toolId,
        userId,
        category,
        strategy,
        uploadedAt: new Date().toISOString()
      }
    };
  }

  // Batch Upload for Multiple Files
  static async uploadMultipleFiles(
    files: File[],
    toolId: string,
    userId: string,
    category: string
  ): Promise<Array<{
    file: File;
    result: any;
    success: boolean;
    error?: string;
  }>> {
    
    const results = await Promise.allSettled(
      files.map(file => 
        this.uploadToolFile(file, toolId, userId, category, 'hierarchical')
      )
    );

    return results.map((result, index) => ({
      file: files[index],
      result: result.status === 'fulfilled' ? result.value : null,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason.message : undefined
    }));
  }

  // File Management Methods
  static async deleteToolFiles(toolId: string, userId: string): Promise<void> {
    // Delete from multiple possible locations
    const possiblePaths = [
      `users/${userId}/**/${toolId}/**`,
      `${userId}/${toolId}/**`,
      `tools/${toolId}**`
    ];

    for (const pathPattern of possiblePaths) {
      try {
        const { data: files } = await supabase.storage
          .from('tools-main')
          .list(pathPattern.split('/**')[0]);
        
        if (files && files.length > 0) {
          const filePaths = files.map(file => `${pathPattern.split('/**')[0]}/${file.name}`);
          await supabase.storage.from('tools-main').remove(filePaths);
        }
      } catch (error) {
        console.warn(`Failed to delete from path ${pathPattern}:`, error);
      }
    }
  }

  // Storage Analytics
  static async getStorageAnalytics(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<string, number>;
    storageUsed: string;
  }> {
    // This would require custom database queries
    // Implementation depends on your analytics needs
    return {
      totalFiles: 0,
      totalSize: 0,
      filesByCategory: {},
      storageUsed: '0 MB'
    };
  }
}

// CDN Integration for Better Performance
export class CDNIntegration {
  
  // CloudFlare R2 Integration
  static async uploadToR2(file: File, path: string): Promise<string> {
    // Implementation for CloudFlare R2
    // Better for global distribution
    return '';
  }

  // AWS S3 Integration
  static async uploadToS3(file: File, path: string): Promise<string> {
    // Implementation for AWS S3
    // Better for enterprise scaling
    return '';
  }

  // Multi-CDN Strategy
  static async uploadWithFallback(file: File, path: string): Promise<string> {
    try {
      // Try primary CDN
      return await this.uploadToR2(file, path);
    } catch (error) {
      // Fallback to Supabase
      console.warn('Primary CDN failed, using Supabase:', error);
      // Fallback implementation
      return '';
    }
  }
}

// Database Schema for File Tracking
export interface FileMetadata {
  id: string;
  tool_id: string;
  user_id: string;
  original_name: string;
  stored_path: string;
  bucket_name: string;
  file_size: number;
  mime_type: string;
  upload_strategy: string;
  cdn_url?: string;
  backup_urls?: string[];
  created_at: string;
  accessed_at?: string;
  access_count: number;
}

// Usage Examples
export const StorageExamples = {
  
  // Small Scale (Current)
  smallScale: async (file: File, toolSlug: string) => {
    const filePath = `tools/${toolSlug}-${Date.now()}.${file.name.split('.').pop()}`;
    return await supabase.storage.from('tools').upload(filePath, file);
  },

  // Medium Scale (Recommended)
  mediumScale: async (file: File, toolId: string, userId: string, category: string) => {
    return await ScalableToolStorage.uploadToolFile(file, toolId, userId, category, 'hierarchical');
  },

  // Large Scale (Enterprise)
  largeScale: async (files: File[], toolId: string, userId: string, category: string) => {
    return await ScalableToolStorage.uploadMultipleFiles(files, toolId, userId, category);
  }
};
