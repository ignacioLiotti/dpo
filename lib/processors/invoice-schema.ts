import { z } from "zod";

export const invoiceSchema = z.object({
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  vendor_name: z.string().nullable(),
  vendor_address: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_address: z.string().nullable(),
  total_amount: z.number().nullable(),
  currency: z.string().nullable(),
  tax_amount: z.number().nullable(),
  tax_rate: z.number().nullable(),
  tax_type: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  payment_instructions: z.string().nullable(),
  notes: z.string().nullable(),
  language: z.string().nullable(),
  line_items: z.array(z.object({
    description: z.string().nullable(),
    quantity: z.number().nullable(),
    unit_price: z.number().nullable(),
    total_price: z.number().nullable(),
    tax_amount: z.number().nullable(),
  })).nullable(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;