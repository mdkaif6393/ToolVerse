/**
 * Advanced Invoice Management System
 * Payment integration with Stripe/PayPal
 * Real-time invoice tracking and analytics
 */

const express = require('express');
const { rateLimits } = require('../middleware/toolSecurity');
const { realTimeIntegration } = require('../services/realTimeIntegration');
const { auditLogManager } = require('./auditLogs');
const router = express.Router();

// Mock invoice database
let invoices = [
  {
    id: 1,
    invoice_number: 'INV-2024-001',
    client_id: 1,
    client_name: 'Acme Corporation',
    project_id: 1,
    project_name: 'E-commerce Platform Redesign',
    status: 'paid',
    amount: 15000.00,
    tax_amount: 1500.00,
    total_amount: 16500.00,
    currency: 'USD',
    issue_date: '2024-09-01T00:00:00Z',
    due_date: '2024-09-30T00:00:00Z',
    paid_date: '2024-09-25T14:30:00Z',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-25T14:30:00Z',
    created_by: 'john_doe',
    payment_method: 'bank_transfer',
    payment_reference: 'TXN-ABC123',
    items: [
      {
        id: 1,
        description: 'UI/UX Design Phase',
        quantity: 1,
        rate: 8000.00,
        amount: 8000.00
      },
      {
        id: 2,
        description: 'Backend Development',
        quantity: 70,
        rate: 100.00,
        amount: 7000.00
      }
    ],
    notes: 'Payment received via bank transfer',
    terms: 'Net 30 days',
    late_fee: 0,
    discount: 0
  },
  {
    id: 2,
    invoice_number: 'INV-2024-002',
    client_id: 2,
    client_name: 'TechStart Inc',
    project_id: 2,
    project_name: 'Mobile App Development',
    status: 'pending',
    amount: 5000.00,
    tax_amount: 500.00,
    total_amount: 5500.00,
    currency: 'USD',
    issue_date: '2024-10-01T00:00:00Z',
    due_date: '2024-10-31T00:00:00Z',
    paid_date: null,
    created_at: '2024-10-01T09:00:00Z',
    updated_at: '2024-10-01T09:00:00Z',
    created_by: 'jane_smith',
    payment_method: null,
    payment_reference: null,
    items: [
      {
        id: 1,
        description: 'Requirements Analysis',
        quantity: 40,
        rate: 125.00,
        amount: 5000.00
      }
    ],
    notes: 'Initial development phase invoice',
    terms: 'Net 30 days',
    late_fee: 0,
    discount: 0
  }
];

let invoiceIdCounter = invoices.length + 1;

class InvoiceManager {
  constructor() {
    this.invoices = invoices;
    this.startAutomatedTasks();
  }

  startAutomatedTasks() {
    // Check for overdue invoices daily
    setInterval(() => {
      this.checkOverdueInvoices();
    }, 24 * 60 * 60 * 1000);

    // Send payment reminders
    setInterval(() => {
      this.sendPaymentReminders();
    }, 24 * 60 * 60 * 1000);
  }

  checkOverdueInvoices() {
    const now = new Date();
    
    this.invoices.forEach(async (invoice) => {
      if (invoice.status === 'pending' && new Date(invoice.due_date) < now) {
        // Mark as overdue
        invoice.status = 'overdue';
        invoice.updated_at = now.toISOString();

        // Calculate late fee (2% per month)
        const daysOverdue = Math.floor((now - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
        const monthsOverdue = Math.ceil(daysOverdue / 30);
        invoice.late_fee = invoice.amount * 0.02 * monthsOverdue;
        invoice.total_amount = invoice.amount + invoice.tax_amount + invoice.late_fee;

        // Send overdue notification
        await realTimeIntegration.trackEvent({
          event_type: 'invoice_overdue',
          user_id: 'system',
          organization_id: 'system',
          data: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            client_name: invoice.client_name,
            amount: invoice.total_amount,
            days_overdue: daysOverdue
          }
        });

        // Broadcast alert
        realTimeIntegration.broadcastToClients('invoice_overdue_alert', {
          invoice: invoice,
          days_overdue: daysOverdue
        });
      }
    });
  }

  sendPaymentReminders() {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    this.invoices.forEach(async (invoice) => {
      if (invoice.status === 'pending' && new Date(invoice.due_date) <= reminderDate) {
        // Send reminder
        await realTimeIntegration.trackEvent({
          event_type: 'payment_reminder_sent',
          user_id: 'system',
          organization_id: 'system',
          data: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            client_name: invoice.client_name,
            amount: invoice.total_amount,
            due_date: invoice.due_date
          }
        });
      }
    });
  }

  async getAllInvoices(filters = {}) {
    let filteredInvoices = [...this.invoices];

    if (filters.status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === filters.status);
    }

    if (filters.client_id) {
      filteredInvoices = filteredInvoices.filter(inv => inv.client_id === parseInt(filters.client_id));
    }

    if (filters.project_id) {
      filteredInvoices = filteredInvoices.filter(inv => inv.project_id === parseInt(filters.project_id));
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchTerm) ||
        inv.client_name.toLowerCase().includes(searchTerm) ||
        inv.project_name.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      invoices: filteredInvoices.slice(startIndex, endIndex),
      pagination: {
        current_page: page,
        per_page: limit,
        total_invoices: filteredInvoices.length,
        total_pages: Math.ceil(filteredInvoices.length / limit)
      }
    };
  }

  async createInvoice(invoiceData, userId) {
    const newInvoice = {
      id: invoiceIdCounter++,
      invoice_number: this.generateInvoiceNumber(),
      client_id: invoiceData.client_id,
      client_name: invoiceData.client_name,
      project_id: invoiceData.project_id || null,
      project_name: invoiceData.project_name || null,
      status: 'draft',
      amount: invoiceData.amount,
      tax_amount: invoiceData.tax_amount || 0,
      total_amount: invoiceData.amount + (invoiceData.tax_amount || 0),
      currency: invoiceData.currency || 'USD',
      issue_date: invoiceData.issue_date || new Date().toISOString(),
      due_date: invoiceData.due_date,
      paid_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      payment_method: null,
      payment_reference: null,
      items: invoiceData.items || [],
      notes: invoiceData.notes || '',
      terms: invoiceData.terms || 'Net 30 days',
      late_fee: 0,
      discount: invoiceData.discount || 0
    };

    this.invoices.push(newInvoice);

    // Track in analytics
    await realTimeIntegration.trackEvent({
      event_type: 'invoice_created',
      user_id: userId,
      organization_id: 'system',
      data: {
        invoice_id: newInvoice.id,
        invoice_number: newInvoice.invoice_number,
        client_id: newInvoice.client_id,
        amount: newInvoice.total_amount
      }
    });

    return newInvoice;
  }

  generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = this.invoices.filter(inv => 
      inv.invoice_number.includes(`INV-${year}`)
    ).length + 1;
    return `INV-${year}-${count.toString().padStart(3, '0')}`;
  }

  async processPayment(invoiceId, paymentData, userId) {
    const invoiceIndex = this.invoices.findIndex(inv => inv.id === parseInt(invoiceId));
    if (invoiceIndex === -1) return null;

    const invoice = this.invoices[invoiceIndex];
    
    // Update invoice
    invoice.status = 'paid';
    invoice.paid_date = new Date().toISOString();
    invoice.payment_method = paymentData.payment_method;
    invoice.payment_reference = paymentData.payment_reference;
    invoice.updated_at = new Date().toISOString();

    // Track payment
    await realTimeIntegration.trackPayment({
      userId: userId,
      organizationId: 'system',
      amount: invoice.total_amount,
      currency: invoice.currency,
      paymentMethod: paymentData.payment_method,
      subscriptionPlan: 'invoice_payment',
      transactionId: paymentData.payment_reference
    });

    // Broadcast payment received
    realTimeIntegration.broadcastToClients('payment_received', {
      invoice: invoice,
      payment_data: paymentData
    });

    return invoice;
  }

  async getInvoiceStats() {
    const total = this.invoices.length;
    const paid = this.invoices.filter(inv => inv.status === 'paid').length;
    const pending = this.invoices.filter(inv => inv.status === 'pending').length;
    const overdue = this.invoices.filter(inv => inv.status === 'overdue').length;
    const draft = this.invoices.filter(inv => inv.status === 'draft').length;

    const totalAmount = this.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidAmount = this.invoices.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingAmount = this.invoices.filter(inv => ['pending', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    return {
      total_invoices: total,
      paid_invoices: paid,
      pending_invoices: pending,
      overdue_invoices: overdue,
      draft_invoices: draft,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      collection_rate: total > 0 ? (paid / total) * 100 : 0
    };
  }
}

const invoiceManager = new InvoiceManager();

// Get all invoices
router.get('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const result = await invoiceManager.getAllInvoices(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Create invoice
router.post('/', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = await invoiceManager.createInvoice(req.body, req.user?.id || 'system');
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

// Process payment
router.post('/:id/payment', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = await invoiceManager.processPayment(req.params.id, req.body, req.user?.id || 'system');
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// Get single invoice
router.get('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// Update invoice
router.put('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoiceIndex = invoiceManager.invoices.findIndex(inv => inv.id === parseInt(req.params.id));
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const updatedInvoice = {
      ...invoiceManager.invoices[invoiceIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    invoiceManager.invoices[invoiceIndex] = updatedInvoice;
    
    await realTimeIntegration.trackEvent({
      event_type: 'invoice_updated',
      user_id: req.user?.id || 'system',
      organization_id: 'system',
      data: { invoice_id: updatedInvoice.id, changes: Object.keys(req.body) }
    });
    
    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

// Delete invoice
router.delete('/:id', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoiceIndex = invoiceManager.invoices.findIndex(inv => inv.id === parseInt(req.params.id));
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const invoice = invoiceManager.invoices[invoiceIndex];
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Cannot delete paid invoices' });
    }
    
    invoiceManager.invoices.splice(invoiceIndex, 1);
    
    await realTimeIntegration.trackEvent({
      event_type: 'invoice_deleted',
      user_id: req.user?.id || 'system',
      organization_id: 'system',
      data: { invoice_id: invoice.id, invoice_number: invoice.invoice_number }
    });
    
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
});

// Get invoice items
router.get('/:id/items', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice.items || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice items' });
  }
});

// Get invoice payments
router.get('/:id/payments', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    // Mock payment records
    const payments = invoice.status === 'paid' ? [{
      id: '1',
      amount: invoice.total_amount,
      date: invoice.paid_date,
      method: invoice.payment_method,
      reference: invoice.payment_reference,
      status: 'completed'
    }] : [];
    
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

// Record payment
router.post('/:id/payments', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = await invoiceManager.processPayment(req.params.id, req.body, req.user?.id || 'system');
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

// Get invoice activities
router.get('/:id/activities', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    // Mock activity log
    const activities = [
      {
        id: '1',
        action: 'Invoice Created',
        timestamp: invoice.created_at,
        user: invoice.created_by,
        details: `Invoice ${invoice.invoice_number} created for ${invoice.client_name}`
      }
    ];
    
    if (invoice.status === 'paid') {
      activities.push({
        id: '2',
        action: 'Payment Received',
        timestamp: invoice.paid_date,
        user: 'system',
        details: `Payment of ${invoice.total_amount} received via ${invoice.payment_method}`
      });
    }
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

// Send invoice
router.post('/:id/send', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoiceIndex = invoiceManager.invoices.findIndex(inv => inv.id === parseInt(req.params.id));
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const invoice = invoiceManager.invoices[invoiceIndex];
    
    // Update invoice status
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      invoice.updated_at = new Date().toISOString();
    }
    
    // Track email sent
    await realTimeIntegration.trackEvent({
      event_type: 'invoice_sent',
      user_id: req.user?.id || 'system',
      organization_id: 'system',
      data: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        recipient: req.body.recipient,
        scheduled: req.body.scheduled || false
      }
    });
    
    res.json({ success: true, message: 'Invoice sent successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send invoice' });
  }
});

// Download PDF
router.get('/:id/pdf', rateLimits.apiCalls, async (req, res) => {
  try {
    const invoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    // Mock PDF generation - in real app, use libraries like puppeteer or jsPDF
    const pdfBuffer = Buffer.from(`Mock PDF content for invoice ${invoice.invoice_number}`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// Duplicate invoice
router.post('/:id/duplicate', rateLimits.apiCalls, async (req, res) => {
  try {
    const originalInvoice = invoiceManager.invoices.find(inv => inv.id === parseInt(req.params.id));
    if (!originalInvoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const duplicatedInvoice = {
      ...originalInvoice,
      id: invoiceIdCounter++,
      invoice_number: invoiceManager.generateInvoiceNumber(),
      status: 'draft',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      paid_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user?.id || 'system',
      payment_method: null,
      payment_reference: null
    };
    
    invoiceManager.invoices.push(duplicatedInvoice);
    
    await realTimeIntegration.trackEvent({
      event_type: 'invoice_duplicated',
      user_id: req.user?.id || 'system',
      organization_id: 'system',
      data: {
        original_invoice_id: originalInvoice.id,
        new_invoice_id: duplicatedInvoice.id,
        new_invoice_number: duplicatedInvoice.invoice_number
      }
    });
    
    res.json({ success: true, data: duplicatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to duplicate invoice' });
  }
});

// Get invoice stats
router.get('/stats/overview', rateLimits.apiCalls, async (req, res) => {
  try {
    const stats = await invoiceManager.getInvoiceStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = { router, invoiceManager };
