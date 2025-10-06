import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InvoiceDetailModal } from './InvoiceDetailModal';

// Test component to demonstrate the enhanced Invoice Detail Modal
export const InvoiceDetailModalTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const testInvoices = [
    { id: '1', number: 'INV-2024-001', client: 'Acme Corporation', amount: 16500, status: 'paid' },
    { id: '2', number: 'INV-2024-002', client: 'TechStart Inc', amount: 5500, status: 'pending' }
  ];

  const openModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Enhanced Invoice Detail Modal Test</h2>
      
      <div className="grid gap-4">
        {testInvoices.map((invoice) => (
          <div key={invoice.id} className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{invoice.number}</h3>
              <p className="text-sm text-muted-foreground">{invoice.client}</p>
              <p className="text-sm">${invoice.amount.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.status}
              </span>
              <Button onClick={() => openModal(invoice.id)}>
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      <InvoiceDetailModal
        open={isOpen}
        onOpenChange={setIsOpen}
        invoiceId={selectedInvoiceId}
      />

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Enhanced Features:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Real-time payment progress tracking</li>
          <li>✅ Comprehensive overview dashboard</li>
          <li>✅ Advanced payment recording with validation</li>
          <li>✅ Smart email templates and scheduling</li>
          <li>✅ Auto-calculation with tax and discount support</li>
          <li>✅ Offline mode detection</li>
          <li>✅ Print and share functionality</li>
          <li>✅ Activity logging and audit trail</li>
          <li>✅ Industry-level invoice management</li>
          <li>✅ Responsive design for all devices</li>
        </ul>
      </div>
    </div>
  );
};

export default InvoiceDetailModalTest;