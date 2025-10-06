import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/services/websocket";
import { useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useInvoices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe } = useWebSocket();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/invoices`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const result = await response.json();
      return result.data?.invoices?.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientId: invoice.client_name || invoice.client_id,
        status: invoice.status,
        totalAmount: invoice.total_amount,
        currency: invoice.currency,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paidDate: invoice.paid_date
      })) || [];
    },
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery({
    queryKey: ["invoices-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/stats/overview`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return {
        totalRevenue: result.data?.total_amount || 0,
        overdue: result.data?.overdue_invoices || 0,
        sent: result.data?.pending_invoices || 0,
        draft: result.data?.draft_invoices || 0,
        paid: result.data?.paid_invoices || 0
      };
    },
    refetchInterval: 30000,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-stats"] });
      toast({ title: "Success", description: "Invoice created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const processPayment = useMutation({
    mutationFn: async ({ invoiceId, paymentData }: { invoiceId: string; paymentData: any }) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error('Failed to process payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-stats"] });
      toast({ title: "Success", description: "Payment processed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ invoiceId, updateData }: { invoiceId: string; updateData: any }) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-stats"] });
      toast({ title: "Success", description: "Invoice updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-stats"] });
      toast({ title: "Success", description: "Invoice deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async ({ invoiceId, emailData }: { invoiceId: string; emailData: any }) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) throw new Error('Failed to send invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Success", description: "Invoice sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const duplicateInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to duplicate invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Success", description: "Invoice duplicated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getInvoiceDetails = async (invoiceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`);
    if (!response.ok) throw new Error('Failed to fetch invoice details');
    return response.json();
  };

  const getInvoiceItems = async (invoiceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/items`);
    if (!response.ok) throw new Error('Failed to fetch invoice items');
    return response.json();
  };

  const getInvoicePayments = async (invoiceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/payments`);
    if (!response.ok) throw new Error('Failed to fetch invoice payments');
    return response.json();
  };

  const getInvoiceActivities = async (invoiceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/activities`);
    if (!response.ok) throw new Error('Failed to fetch invoice activities');
    return response.json();
  };

  const downloadInvoicePDF = async (invoiceId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/pdf`);
    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  };

  useEffect(() => {
    const handleInvoiceUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-stats"] });
      
      if (data.invoice) {
        toast({ 
          title: "Invoice Updated", 
          description: `${data.invoice.invoice_number} has been updated` 
        });
      }
    };

    subscribe('payment_received', handleInvoiceUpdate);
    subscribe('invoice_overdue_alert', handleInvoiceUpdate);
    subscribe('invoice_created', handleInvoiceUpdate);

    return () => {
      unsubscribe('payment_received', handleInvoiceUpdate);
      unsubscribe('invoice_overdue_alert', handleInvoiceUpdate);
      unsubscribe('invoice_created', handleInvoiceUpdate);
    };
  }, [subscribe, unsubscribe, queryClient, toast]);

  return { 
    invoices, 
    stats, 
    isLoading, 
    error, 
    createInvoice, 
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    duplicateInvoice,
    processPayment,
    getInvoiceDetails,
    getInvoiceItems,
    getInvoicePayments,
    getInvoiceActivities,
    downloadInvoicePDF
  };
};
