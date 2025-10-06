export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: Date;
  dueDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
  totalHours?: number;
  billableRate?: number;
  tags: string[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface CreateProjectData {
  name: string;
  description: string;
  clientId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: Date;
  dueDate?: Date;
  billableRate?: number;
  tags: string[];
}

export interface ProjectStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
}