import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unit_price: z.number().min(0, "Price must be positive"),
  total_price: z.number().min(0, "Total must be positive"),
});

export const invoiceSchema = z.object({
  client_id: z.string().uuid("Invalid client"),
  project_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1, "Invoice number is required").max(50),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  paid_date: z.string().optional(),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  tax_amount: z.number().min(0, "Tax must be positive"),
  total_amount: z.number().min(0, "Total must be positive"),
  currency: z.string().default("USD"),
  notes: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
