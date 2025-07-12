import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import type { z } from "zod";
import { invoicePrompt } from "./invoice-prompt";
import { invoiceSchema, type InvoiceData } from "./invoice-schema";

export interface GetDocumentRequest {
  documentUrl?: string;
  documentBuffer?: Buffer;
  fileName: string;
  fileType?: string;
}

export class InvoiceProcessor {
  private isDataQualityPoor(result: z.infer<typeof invoiceSchema>): boolean {
    return !result.total_amount ||
           !result.currency ||
           !result.vendor_name ||
           (!result.invoice_date && !result.due_date);
  }

  private async processDocument({ documentUrl, documentBuffer, fileName, fileType }: GetDocumentRequest) {
    if (!documentUrl && !documentBuffer) {
      throw new Error("Document URL or buffer is required");
    }

    const { fileData, mimeType } = this.prepareDocumentData(documentUrl, documentBuffer, fileName, fileType);

    try {
      const result = await this.extractWithMistral(fileData, mimeType);
      
      // Check quality and use fallback if needed
      if (this.isDataQualityPoor(result.object)) {
        const fallbackResult = await this.fallbackExtract({ documentUrl, documentBuffer, fileName, fileType });
        return this.mergeResults(result.object, fallbackResult);
      }

      return result.object;
    } catch (error) {
      // Emergency fallback
      return this.fallbackExtract({ documentUrl, documentBuffer, fileName, fileType });
    }
  }

  private prepareDocumentData(documentUrl?: string, documentBuffer?: Buffer, fileName?: string, fileType?: string) {
    let mimeType: string;
    if (fileType) {
      mimeType = fileType;
    } else if (fileName?.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (fileName?.toLowerCase().match(/\.(png|jpg|jpeg)$/)) {
      mimeType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    } else {
      mimeType = 'application/pdf';
    }

    let fileData: string;
    if (documentBuffer) {
      const base64 = documentBuffer.toString('base64');
      fileData = `data:${mimeType};base64,${base64}`;
    } else if (documentUrl) {
      fileData = documentUrl;
    } else {
      throw new Error("No document data provided");
    }

    return { fileData, mimeType };
  }

  private async extractWithMistral(fileData: string, mimeType: string) {
    return generateObject({
      model: mistral("mistral-medium-latest"),
      schema: invoiceSchema,
      abortSignal: AbortSignal.timeout(45000),
      messages: [
        {
          role: "system",
          content: invoicePrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract invoice data from this document:"
            },
            {
              type: "file",
              data: fileData,
              mimeType: mimeType,
            },
          ],
        },
      ],
      providerOptions: {
        mistral: {
          documentPageLimit: 10,
        },
      },
    });
  }

  private async fallbackExtract({ documentUrl, documentBuffer, fileName, fileType }: GetDocumentRequest) {
    if (!documentUrl && !documentBuffer) {
      throw new Error("Document URL or buffer is required");
    }

    // Extract text using OCR
    const ocrText = await this.extractOcrText(documentUrl, documentBuffer, fileName, fileType);
    
    // Process with LLM
    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: invoiceSchema,
      abortSignal: AbortSignal.timeout(45000),
      messages: [
        {
          role: "system",
          content: invoicePrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract invoice data from this OCR text:\n\n${ocrText}`,
            },
          ],
        },
      ],
    });

    return result.object;
  }

  private async extractOcrText(documentUrl?: string, documentBuffer?: Buffer, fileName?: string, fileType?: string): Promise<string> {
    const isImageFile = fileType?.startsWith('image/') || fileName?.toLowerCase().match(/\.(png|jpg|jpeg)$/);
    const buffer = documentBuffer || Buffer.from(await (await fetch(documentUrl!)).arrayBuffer());

    if (isImageFile) {
      return this.extractTextWithOpenAI(buffer, fileName!);
    } else {
      return this.extractTextWithMistral(buffer, fileName!);
    }
  }

  private async extractTextWithOpenAI(buffer: Buffer, fileName: string): Promise<string> {
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');
    
    const base64 = buffer.toString('base64');
    const mimeType = fileName.toLowerCase().match(/\.png$/) ? 'image/png' : 'image/jpeg';
    
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return only the text content, preserving structure and formatting. Focus on readable text, numbers, and important details.'
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`
            }
          ]
        }
      ],
      temperature: 0.1
    });
    
    return text.trim();
  }

  private async extractTextWithMistral(buffer: Buffer, fileName: string): Promise<string> {
    const { mistral } = await import('@ai-sdk/mistral');
    const { generateText } = await import('ai');
    
    const base64 = buffer.toString('base64');
    const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png';
    const fileData = `data:${mimeType};base64,${base64}`;
    
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this document. Return only the text content, preserving structure and formatting. Focus on readable text, numbers, dates, and important details for construction documents.'
            },
            {
              type: 'file',
              data: fileData,
              mimeType: mimeType
            }
          ]
        }
      ],
      temperature: 0.1,
      providerOptions: {
        mistral: {
          documentImageLimit: 8,
          documentPageLimit: 64,
        }
      }
    });
    
    return text.trim();
  }

  private mergeResults(primary: any, fallback: any) {
    return {
      ...primary,
      total_amount: primary.total_amount || fallback.total_amount,
      currency: primary.currency || fallback.currency,
      vendor_name: primary.vendor_name || fallback.vendor_name,
      invoice_date: primary.invoice_date || fallback.invoice_date,
      due_date: primary.due_date || fallback.due_date,
      invoice_number: primary.invoice_number || fallback.invoice_number,
      customer_name: primary.customer_name || fallback.customer_name,
      vendor_address: primary.vendor_address || fallback.vendor_address,
      customer_address: primary.customer_address || fallback.customer_address,
      email: primary.email || fallback.email,
      website: primary.website || fallback.website,
      tax_amount: primary.tax_amount || fallback.tax_amount,
      tax_rate: primary.tax_rate || fallback.tax_rate,
      tax_type: primary.tax_type || fallback.tax_type,
      payment_instructions: primary.payment_instructions || fallback.payment_instructions,
      notes: primary.notes || fallback.notes,
      language: primary.language || fallback.language,
      line_items: (primary.line_items && primary.line_items.length > 0) ? primary.line_items : fallback.line_items,
    };
  }

  private getWebsite({ website, email }: { website: string | null; email: string | null }) {
    if (website) return website;
    if (email) {
      const domain = email.split('@')[1];
      return domain ? `https://${domain}` : null;
    }
    return null;
  }

  public async getInvoice(params: GetDocumentRequest) {
    const result = await this.processDocument(params);
    const website = this.getWebsite({ website: result.website, email: result.email });

    return {
      ...result,
      website,
      type: "invoice",
      description: result.notes,
      date: result.due_date ?? result.invoice_date,
      amount: result.total_amount,
      currency: result.currency,
      name: result.vendor_name,
      tax_amount: result.tax_amount,
      tax_rate: result.tax_rate,
      tax_type: result.tax_type,
      language: result.language,
      metadata: {
        invoice_date: result.invoice_date ?? null,
        payment_instructions: result.payment_instructions ?? null,
        invoice_number: result.invoice_number ?? null,
        customer_name: result.customer_name ?? null,
        customer_address: result.customer_address ?? null,
        vendor_address: result.vendor_address ?? null,
        vendor_name: result.vendor_name ?? null,
        email: result.email ?? null,
      },
    };
  }
}