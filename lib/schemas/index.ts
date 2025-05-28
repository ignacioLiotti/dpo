import { z } from "zod";
import { isValid } from "date-fns";

// Base validation helpers
export const parseDateSchema = z
  .date()
  .transform((value) => new Date(value))
  .transform((v) => isValid(v))
  .refine((v) => !!v, { message: "Invalid date" });

// Common field schemas
export const uuidSchema = z.string().uuid("ID inválido");
export const emailSchema = z.string().email("Email no válido");
export const phoneSchema = z.string().nullable().optional();
export const urlSchema = z.string().url("URL no válida").optional().nullable();

// User schemas
export const updateUserSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(32, "El nombre no puede exceder 32 caracteres").optional(),
  email: emailSchema.optional(),
  avatar_url: urlSchema,
  locale: z.string().optional(),
  timezone: z.string().optional(),
  revalidatePath: z.string().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

// Export obra schemas
export * from "./obra-schemas"; 