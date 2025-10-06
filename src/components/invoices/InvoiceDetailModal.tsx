import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useCallback } from "react";
import { 
  Download, Send, Edit, Trash2, Copy, CreditCard, FileText, Calendar, DollarSign, User, Building, Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle, XCircle, Plus, Minus, Save, X, Eye, History, MessageSquare, Printer, Share2, RefreshCw, Calculator, TrendingUp, Bell, Settings, Filter, Search, ExternalLink, Zap, Shield, Globe, Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, InvoiceItem, PaymentRecord, ActivityLog } from "@/types/Invoice.d";
import { useInvoices } from "@/hooks/useInvoices";

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  layout: 'modern' | 'classic' | 'minimal';
  primaryColor: string;
}

interface TaxCalculation {
  rate: number;
  amount: number;
  type: 'percentage' | 'fixed';
}

interface DiscountCalculation {
  rate: number;
  amount: number;
  type: 'percentage' | 'fixed';
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid": return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "sent": return <Clock className="h-4 w-4 text-blue-500" />;
    case "draft": return <FileText className="h-4 w-4 text-gray-500" />;
    case "overdue": return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "cancelled": return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid": return "default";
    case "sent": return "secondary";
    case "draft": return "outline";
    case "overdue": return "destructive";
    case "cancelled": return "destructive";
    default: return "outline";
  }
};

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const InvoiceDetailModal = ({ open, onOpenChange, invoiceId }: InvoiceDetailModalProps) => {
  const { toast } = useToast();
  const { getInvoiceDetails, getInvoiceItems, getInvoicePayments, getInvoiceActivities, updateInvoice, sendInvoice, duplicateInvoice, deleteInvoice, processPayment } = useInvoices();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Partial<Invoice>>({});
  const [editedItems, setEditedItems] = useState<InvoiceItem[]>([]);
  
  // Payment states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  // Email states
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("default");
  const [scheduleEmail, setScheduleEmail] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  
  // UI states
  const [activeTab, setActiveTab] = useState("details");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [open, invoiceId]);

  const fetchInvoiceDetails = useCallback(async () => {
    if (!invoiceId) return;
    
    setIsLoading(true);
    try {
      const [invoiceData, itemsData, paymentsData, activitiesData] = await Promise.all([
        getInvoiceDetails(invoiceId),
        getInvoiceItems(invoiceId),
        getInvoicePayments(invoiceId),
        getInvoiceActivities(invoiceId)
      ]);

      if (invoiceData?.data) {
        const inv = invoiceData.data;
        setInvoice(inv);
        setEditedInvoice(inv);
        setEmailRecipient(inv.clientEmail || "");
        setEmailSubject(`Invoice ${inv.invoiceNumber} - ${inv.clientName}`);
        setEmailMessage(`Dear ${inv.clientName},\n\nPlease find attached invoice ${inv.invoiceNumber} for ${formatCurrency(inv.totalAmount)}.\n\nDue date: ${formatDate(inv.dueDate)}\n\nThank you for your business.`);
        setTaxRate(inv.taxRate || 0);
      }

      setItems(itemsData?.data || []);
      setEditedItems(itemsData?.data || []);
      setPayments(paymentsData?.data || []);
      setActivities(activitiesData?.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, getInvoiceDetails, getInvoiceItems, getInvoicePayments, getInvoiceActivities, toast]);

  const handleSaveChanges = async () => {
    if (!invoice) return;

    setIsSaving(true);
    try {
      const updatedData = {
        ...editedInvoice,
        items: editedItems,
        subtotal: calculateSubtotal(),
        taxAmount: calculateTax(),
        totalAmount: calculateTotal(),
        updatedAt: new Date().toISOString()
      };

      await updateInvoice.mutateAsync({
        invoiceId: invoice.id,
        updateData: updatedData
      });

      setInvoice({ ...invoice, ...updatedData });
      setItems(editedItems);
      setIsEditing(false);
      setLastUpdated(new Date());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice || !emailRecipient) return;

    try {
      const emailData = {
        recipient: emailRecipient,
        subject: emailSubject,
        message: emailMessage,
        template: emailTemplate,
        scheduled: scheduleEmail,
        scheduledDate: scheduledDate || undefined
      };

      await sendInvoice.mutateAsync({
        invoiceId: invoice.id,
        emailData
      });

      if (scheduleEmail) {
        toast({
          title: "Success",
          description: `Invoice scheduled to send on ${formatDate(scheduledDate)}`
        });
      } else {
        toast({
          title: "Success",
          description: "Invoice sent successfully"
        });
      }
      
      fetchInvoiceDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > getRemainingBalance()) {
      toast({
        title: "Invalid Amount",
        description: `Payment amount must be between $0.01 and ${formatCurrency(getRemainingBalance())}`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const paymentData = {
        amount,
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
        date: new Date().toISOString()
      };

      await processPayment.mutateAsync({
        invoiceId: invoice.id,
        paymentData
      });

      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      fetchInvoiceDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDuplicateInvoice = async () => {
    if (!invoice) return;

    try {
      await duplicateInvoice.mutateAsync(invoice.id);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate invoice",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;

    if (invoice.status === 'paid') {
      toast({
        title: "Cannot Delete",
        description: "Paid invoices cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      try {
        await deleteInvoice.mutateAsync(invoice.id);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete invoice",
          variant: "destructive"
        });
      }
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      invoiceId: invoice?.id || "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setEditedItems([...editedItems, newItem]);
  };

  const removeItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = editedItems.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setEditedItems(updated);
  };

  const calculateSubtotal = () => {
    return editedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return subtotal * (discountRate / 100);
    }
    return discountRate;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return (subtotal - discount) * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const getTotalPaid = () => {
    return payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemainingBalance = () => {
    return (invoice?.totalAmount || 0) - getTotalPaid();
  };

  const getPaymentProgress = () => {
    const total = invoice?.totalAmount || 0;
    const paid = getTotalPaid();
    return total > 0 ? (paid / total) * 100 : 0;
  };

  const getDaysUntilDue = () => {
    if (!invoice?.dueDate) return 0;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleShareInvoice = async () => {
    if (navigator.share && invoice) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice for ${formatCurrency(invoice.totalAmount)}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard" });
      }
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (isEditing && autoCalculate) {
      const timer = setTimeout(() => {
        setEditedInvoice(prev => ({
          ...prev,
          subtotal: calculateSubtotal(),
          taxAmount: calculateTax(),
          totalAmount: calculateTotal()
        }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editedItems, taxRate, discountRate, discountType, isEditing, autoCalculate]);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading invoice details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(invoice?.status || "")}
            Invoice {invoice?.invoiceNumber}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(invoice?.status || "")}>
              {invoice?.status?.charAt(0).toUpperCase() + invoice?.status?.slice(1)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {!isOnline && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're offline. Changes will be saved when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <TabsContent value="overview" className="space-y-6">
              {/* Invoice Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">{formatCurrency(invoice?.totalAmount || 0)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalPaid())}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(getRemainingBalance())}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Payment Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Paid: {formatCurrency(getTotalPaid())}</span>
                      <span>{getPaymentProgress().toFixed(1)}%</span>
                    </div>
                    <Progress value={getPaymentProgress()} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>{formatCurrency(invoice?.totalAmount || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Due Date Alert */}
              {invoice && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        getDaysUntilDue() < 0 ? 'bg-red-100' :
                        getDaysUntilDue() <= 7 ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          getDaysUntilDue() < 0 ? 'text-red-600' :
                          getDaysUntilDue() <= 7 ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {getDaysUntilDue() < 0 ? `Overdue by ${Math.abs(getDaysUntilDue())} days` :
                           getDaysUntilDue() === 0 ? 'Due today' :
                           `Due in ${getDaysUntilDue()} days`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due date: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" onClick={handleSendInvoice} disabled={!emailRecipient}>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareInvoice}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">Invoice Information</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3" />
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Invoice Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedInvoice.invoiceNumber || invoice?.invoiceNumber || ""}
                          onChange={(e) => setEditedInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{invoice?.invoiceNumber}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Issue Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedInvoice.issueDate ? new Date(editedInvoice.issueDate).toISOString().split('T')[0] : ""}
                          onChange={(e) => setEditedInvoice(prev => ({ ...prev, issueDate: new Date(e.target.value) }))}
                          className="mt-1"
                        />
                      ) : (
                        <p>{formatDate(invoice?.issueDate || new Date())}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Due Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedInvoice.dueDate ? new Date(editedInvoice.dueDate).toISOString().split('T')[0] : ""}
                          onChange={(e) => setEditedInvoice(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                          className="mt-1"
                        />
                      ) : (
                        <p>{formatDate(invoice?.dueDate || new Date())}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Currency</Label>
                      {isEditing ? (
                        <Select value={editedInvoice.currency || invoice?.currency || 'USD'} onValueChange={(value) => setEditedInvoice(prev => ({ ...prev, currency: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p>{invoice?.currency || 'USD'}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Auto Calculate</Label>
                    <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
                  </div>
                  
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Client Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedInvoice.clientName || invoice?.clientName || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">{invoice?.clientName || invoice?.clientId}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedInvoice.clientEmail || invoice?.clientEmail || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p>{invoice?.clientEmail || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedInvoice.clientPhone || invoice?.clientPhone || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, clientPhone: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p>{invoice?.clientPhone || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedInvoice.clientAddress || invoice?.clientAddress || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, clientAddress: e.target.value }))}
                        className="mt-1"
                        rows={2}
                      />
                    ) : (
                      <p>{invoice?.clientAddress || 'N/A'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Invoice Items
                    </span>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(isEditing ? editedItems : items).map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {isEditing ? (
                          <>
                            <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <Input
                              type="number"
                              placeholder="Rate"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                            <div className="w-24 text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p className="font-medium">{item.description}</p>
                            </div>
                            <div className="w-20 text-center">{item.quantity}</div>
                            <div className="w-24 text-right">{formatCurrency(item.unitPrice)}</div>
                            <div className="w-24 text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(isEditing ? calculateSubtotal() : invoice?.subtotal || 0)}</span>
                    </div>
                    
                    {/* Discount */}
                    {isEditing && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>Discount:</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={discountRate}
                              onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                              className="w-16 h-6 text-xs"
                              min="0"
                            />
                            <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                              <SelectTrigger className="w-16 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">$</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <span>-{formatCurrency(calculateDiscount())}</span>
                      </div>
                    )}
                    
                    {/* Tax */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Tax:</span>
                        {isEditing && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={taxRate}
                              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                              className="w-16 h-6 text-xs"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs">%</span>
                          </div>
                        )}
                      </div>
                      <span>{formatCurrency(isEditing ? calculateTax() : invoice?.taxAmount || 0)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(isEditing ? calculateTotal() : invoice?.totalAmount || 0)}</span>
                    </div>
                    
                    {getTotalPaid() > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Amount Paid:</span>
                          <span>-{formatCurrency(getTotalPaid())}</span>
                        </div>
                        <div className="flex justify-between font-bold text-orange-600">
                          <span>Balance Due:</span>
                          <span>{formatCurrency(getRemainingBalance())}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedInvoice.notes || invoice?.notes || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add notes for the client..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {invoice?.notes || 'No notes added'}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedInvoice.terms || invoice?.terms || ""}
                        onChange={(e) => setEditedInvoice(prev => ({ ...prev, terms: e.target.value }))}
                        placeholder="Payment terms and conditions..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {invoice?.terms || 'Net 30 days'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Invoice</p>
                      <p className="text-xl font-bold">{formatCurrency(invoice?.totalAmount || 0)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(getTotalPaid())}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Balance Due</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(getRemainingBalance())}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Record Payment */}
              {getRemainingBalance() > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Record Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment-amount">Amount</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          max={getRemainingBalance()}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Max: {formatCurrency(getRemainingBalance())}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="payment-reference">Reference/Transaction ID</Label>
                        <Input
                          id="payment-reference"
                          placeholder="TXN123456"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment-notes">Notes (Optional)</Label>
                        <Input
                          id="payment-notes"
                          placeholder="Payment notes..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRecordPayment} 
                        disabled={!paymentAmount || isProcessingPayment}
                        className="flex-1"
                      >
                        {isProcessingPayment ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Record Payment
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setPaymentAmount(getRemainingBalance().toString())}
                        disabled={getRemainingBalance() <= 0}
                      >
                        Full Amount
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.method} • {payment.reference}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{formatDate(payment.date)}</p>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="send" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email-recipient">Recipient Email</Label>
                      <Input
                        id="email-recipient"
                        type="email"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        placeholder="client@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-template">Email Template</Label>
                      <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="reminder">Payment Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      rows={6}
                      placeholder="Add a personal message..."
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="schedule-email"
                      checked={scheduleEmail}
                      onCheckedChange={setScheduleEmail}
                    />
                    <Label htmlFor="schedule-email">Schedule for later</Label>
                  </div>
                  
                  {scheduleEmail && (
                    <div>
                      <Label htmlFor="scheduled-date">Send Date & Time</Label>
                      <Input
                        id="scheduled-date"
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendInvoice} 
                      disabled={!emailRecipient || (scheduleEmail && !scheduledDate)}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {scheduleEmail ? 'Schedule Invoice' : 'Send Invoice'}
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" onClick={handlePrintInvoice}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No activity recorded</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {activity.user} • {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={handleDuplicateInvoice}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Invoice
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handlePrintInvoice}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleShareInvoice}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Invoice
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Public Link
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Invoice Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-reminders</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Late fees</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Online payments</Label>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      Notification Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Financial Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Payment Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calculator className="h-4 w-4 mr-2" />
                      Tax Calculator
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Currency Converter
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invoice?.status !== 'paid' && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-orange-600 hover:text-orange-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Invoice
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={handleDeleteInvoice}
                      disabled={invoice?.status === 'paid'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Invoice
                    </Button>
                    {invoice?.status === 'paid' && (
                      <p className="text-xs text-muted-foreground">
                        Paid invoices cannot be deleted for audit purposes.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};