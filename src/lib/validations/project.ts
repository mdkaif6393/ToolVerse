import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  client_id: z.string().uuid("Invalid client"),
  status: z.enum(["active", "pending", "completed", "cancelled"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  start_date: z.string().min(1, "Start date is required"),
  due_date: z.string().optional(),
  billable_rate: z.number().min(0, "Rate must be positive").optional(),
  tags: z.array(z.string()).default([]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
