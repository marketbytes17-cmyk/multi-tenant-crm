import { z } from "zod";

export const RepSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid work email address."),
  notifyOnNewLead: z.boolean(),
  notifyOnFollowUp: z.boolean(),
  dailyDigest: z.boolean(),
});

export type RepSettingsInput = z.infer<typeof RepSettingsSchema>;
