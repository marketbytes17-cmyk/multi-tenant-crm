import { z } from "zod";

export const AddClientSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid contact email format"),
  contactPhone: z.string().min(6, "Contact phone is required"),
  adminEmail: z.string().email("Invalid admin login email format"),
  password: z.string().optional(),
  autoGeneratePassword: z.boolean().default(true),
});

export type AddClientInput = z.infer<typeof AddClientSchema>;

export const EditClientSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid contact email format"),
  contactPhone: z.string().min(6, "Contact phone is required"),
  status: z.enum(["active", "inactive"]),
});

export type EditClientInput = z.infer<typeof EditClientSchema>;

export const AddMappingSchema = z.object({
  pageId: z.string().min(1, "Meta Page ID is required"),
  pageName: z.string().min(1, "Page name is required"),
  adId: z.string().optional(),
  clientId: z.string().min(1, "Please select a client organization"),
});

export type AddMappingInput = z.infer<typeof AddMappingSchema>;

export const SuperAdminSettingsSchema = z.object({
  platformName: z.string().min(2, "Platform name is required"),
  supportEmail: z.string().email("Invalid support email format"),
  webhookRetryLimit: z.number().min(1).max(10),
  defaultNotificationEmail: z.string().email("Invalid email format"),
});

export type SuperAdminSettingsInput = z.infer<typeof SuperAdminSettingsSchema>;
