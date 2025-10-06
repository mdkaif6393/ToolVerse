import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices } from "@/hooks/useInvoices";
import { CreateInvoiceModal } from "@/components/invoices/CreateInvoiceModal";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { useState } from "react";
import { 
  Plus, 
  Search, 
  Download,
  Eye,
  Send,
  MoreHorizontal,
  Calendar,
  DollarSign
} from "lucide-react";



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid": return "default";
    case "sent": return "secondary";
    case "draft": return "outline";
    case "overdue": return "destructive";
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

const Invoices = () => {
  const { invoices, stats, isLoading, error, processPayment } = useInvoices();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientId?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendInvoice = (invoiceId: string) => {
    // TODO: Implement send invoice functionality
    console.log('Send invoice:', invoiceId);
  };

  const handleDownloadPDF = (invoiceId: string) => {
    // TODO: Implement PDF download
    console.log('Download PDF:', invoiceId);
  };

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowDetailModal(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load invoices</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your client invoices
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.overdue || 0}</div>
                )}
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div className="h-8 w-8 bg-destructive/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.sent || 0}</div>
                )}
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="h-8 w-8 bg-warning/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-8 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.draft || 0}</div>
                )}
                <div className="text-sm text-muted-foreground">Draft</div>
              </div>
              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <InvoiceFilters 
          onFilterChange={setStatusFilter} 
          currentFilter={statusFilter} 
        />
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice: any) => (
                <div 
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">{invoice.clientId}</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm text-muted-foreground">Issue Date</div>
                      <div className="font-medium">{formatDate(invoice.issueDate)}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <div className="font-medium">{formatCurrency(invoice.totalAmount, invoice.currency)}</div>
                      <div className="text-sm text-muted-foreground">Due {formatDate(invoice.dueDate)}</div>
                    </div>
                    
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreateInvoiceModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
      
      <InvoiceDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
};

export default Invoices;