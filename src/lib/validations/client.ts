import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional(),
  company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  address_street: z.string().max(200).optional(),
  address_city: z.string().max(100).optional(),
  address_state: z.string().max(100).optional(),
  address_zip: z.string().max(20).optional(),
  address_country: z.string().max(100).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
