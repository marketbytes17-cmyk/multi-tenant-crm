import { z } from "zod";

export const InviteRepSchema = z.object({
  name: z.string().min(2, "Rep name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  sendInviteEmail: z.boolean().default(true),
});

export type InviteRepInput = z.infer<typeof InviteRepSchema>;

export const AddNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
});

export type AddNoteInput = z.infer<typeof AddNoteSchema>;

export const ClosedLostReasonSchema = z.object({
  reason: z.string().min(3, "Please enter a valid reason for closing as lost"),
});

export type ClosedLostReasonInput = z.infer<typeof ClosedLostReasonSchema>;

export const ClientSettingsSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  notifyOnNewLead: z.boolean(),
  dailySummaryDigest: z.boolean(),
  leadAssignmentMode: z.enum(["manual", "round_robin"]),
});

export type ClientSettingsInput = z.infer<typeof ClientSettingsSchema>;
