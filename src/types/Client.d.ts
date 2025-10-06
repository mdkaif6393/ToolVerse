export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  totalInvoiced: number;
  notes?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface ClientFolder {
  id: string;
  clientId: string;
  name: string;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  folderId?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}