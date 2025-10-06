import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface InvoiceFiltersProps {
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export const InvoiceFilters = ({ onFilterChange, currentFilter }: InvoiceFiltersProps) => {
  const filters = [
    { value: "all", label: "All Invoices" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          {filters.find(f => f.value === currentFilter)?.label || "Filter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {filters.map((filter) => (
          <DropdownMenuItem
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};