export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientPhone?: string;
  projectId?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  template: 'modern' | 'classic' | 'minimal' | 'professional';
  primaryColor: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoPosition?: 'left' | 'center' | 'right';
  showPaymentInstructions: boolean;
  showTerms: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceData {
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  projectId?: string;
  dueDate: Date;
  items: Omit<InvoiceItem, 'id' | 'invoiceId'>[];
  taxRate?: number;
  notes?: string;
  terms?: string;
  paymentInstructions?: string;
  templateId?: string;
  currency?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id: string;
  status?: Invoice['status'];
}

export interface InvoiceFilters {
  status?: Invoice['status'][];
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'paypal' | 'other';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  invoiceId: string;
  action: string;
  timestamp: string;
  user: string;
  userId: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface InvoiceEmail {
  id: string;
  invoiceId: string;
  recipient: string;
  subject: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  trackingId?: string;
}