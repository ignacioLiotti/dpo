import type {
  DocumentProcessor,
  DocumentProcessorInput,
  ProcessorResult,
  ProcessedDocument,
} from "../index";
import { ocrService } from "./ocr-service";

export class InvoiceProcessor implements DocumentProcessor {
  getProcessorName(): string {
    return "InvoiceProcessor";
  }

  getSupportedTypes(): string[] {
    return [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
  }

  async processDocument(
    input: DocumentProcessorInput
  ): Promise<ProcessorResult<ProcessedDocument>> {
    try {
      const startTime = Date.now();

      // Extract invoice-specific data using OCR + AI
      const extractedData = await this.extractInvoiceData(input);

      const result: ProcessedDocument = {
        extractedData,
        documentType: "invoice",
        confidence: extractedData.extractionMetadata?.confidence?.overall || 0.80,
        metadata: {
          fileSize: this.getFileSize(input.file),
          processingTime: Date.now() - startTime,
          ocrProvider: extractedData.extractionMetadata?.ocrProvider || "internal",
        },
      };

      return {
        success: true,
        data: result,
        confidence: result.confidence,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invoice processing failed",
        metadata: {
          processorName: this.getProcessorName(),
        },
      };
    }
  }

  private async extractInvoiceData(
    input: DocumentProcessorInput
  ): Promise<Record<string, any>> {
    try {
      // Use OCR service to extract text and structured data
      const ocrResult = await ocrService.processDocument(
        input.file,
        'invoice',
        {
          language: 'spa+eng', // Spanish + English for Argentina
          extractTables: true, // Important for invoice line items
        }
      );

      console.log(`Invoice OCR completed with ${ocrResult.provider}, confidence: ${ocrResult.confidence}`);

      // Base invoice data structure
      let invoiceData = {
        // Basic invoice information
        invoiceNumber: this.extractInvoiceNumber(input.fileName),
        invoiceType: "factura", // factura, nota_credito, nota_debito, etc.
        
        // Financial information
        subtotal: null,
        tax: null,
        total: null,
        currency: "ARS",
        
        // Dates
        issueDate: null,
        dueDate: null,
        serviceDate: null,
        
        // Parties
        vendor: {
          name: null,
          cuit: null,
          address: null,
          phone: null,
          email: null,
        },
        client: {
          name: "Dirección Provincial de Obras Públicas",
          cuit: null,
          address: null,
        },
        
        // Line items
        lineItems: [],
        
        // Payment information
        paymentTerms: null,
        paymentMethod: null,
        bankAccount: null,
        
        // Project reference
        projectReference: null,
        purchaseOrder: null,
        contractReference: null,
        
        // Tax details
        taxDetails: {
          iva: null,
          iibb: null,
          ganancias: null,
          suss: null,
        },
        
        // Additional information
        notes: null,
        conditions: null,
        
        // Extraction metadata
        extractionMetadata: {
          fileName: input.fileName,
          extractedAt: new Date().toISOString(),
          ocrProvider: ocrResult.provider,
          aiEnhanced: (ocrResult.metadata as any)?.aiEnhanced || false,
          confidence: {
            overall: ocrResult.confidence,
            invoiceNumber: 0.9,
            amounts: 0.85,
            vendor: 0.75,
            dates: 0.80,
            lineItems: 0.70,
          },
          rawText: ocrResult.text,
        },
      };

      // If AI extracted structured data, merge it with our base structure
      if ((ocrResult.metadata as any)?.extractedData) {
        const aiData = (ocrResult.metadata as any).extractedData;
        
        // Merge AI-extracted data
        invoiceData = {
          ...invoiceData,
          invoiceNumber: aiData.invoiceNumber || invoiceData.invoiceNumber,
          total: aiData.total,
          subtotal: aiData.subtotal,
          tax: aiData.tax,
          currency: aiData.currency || invoiceData.currency,
          issueDate: aiData.issueDate,
          dueDate: aiData.dueDate,
          projectReference: aiData.projectReference,
          vendor: {
            ...invoiceData.vendor,
            ...aiData.vendor,
          },
        };
      } else {
        // Fallback: Extract data from raw OCR text using regex patterns
        const textData = this.extractFromText(ocrResult.text);
        invoiceData = { ...invoiceData, ...textData };
      }

      return invoiceData;
    } catch (error) {
      console.warn('Invoice OCR processing failed, falling back to filename extraction:', error);
      
      // Fallback to basic filename extraction
      return {
        invoiceNumber: this.extractInvoiceNumber(input.fileName),
        invoiceType: "factura",
        subtotal: null,
        tax: null,
        total: null,
        currency: "ARS",
        issueDate: null,
        dueDate: null,
        serviceDate: null,
        vendor: { name: null, cuit: null, address: null, phone: null, email: null },
        client: { name: "Dirección Provincial de Obras Públicas", cuit: null, address: null },
        lineItems: [],
        paymentTerms: null,
        paymentMethod: null,
        bankAccount: null,
        projectReference: null,
        purchaseOrder: null,
        contractReference: null,
        taxDetails: { iva: null, iibb: null, ganancias: null, suss: null },
        notes: null,
        conditions: null,
        extractionMetadata: {
          fileName: input.fileName,
          extractedAt: new Date().toISOString(),
          ocrProvider: "fallback",
          aiEnhanced: false,
          confidence: { overall: 0.3, invoiceNumber: 0.9, amounts: 0.1, vendor: 0.1, dates: 0.1, lineItems: 0.1 },
          error: error instanceof Error ? error.message : 'OCR failed',
        },
      };
    }
  }

  private extractFromText(text: string): Partial<Record<string, any>> {
    const extracted: any = {};
    
    // Extract amounts (pesos argentinos)
    const amountPatterns = [
      /total[:\s]*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
      /importe[:\s]*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
      /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[0].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (amount > 100) { // Reasonable invoice amount
          extracted.total = amount;
          break;
        }
      }
    }
    
    // Extract subtotal and tax
    const subtotalMatch = text.match(/subtotal[:\s]*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi);
    if (subtotalMatch) {
      extracted.subtotal = parseFloat(subtotalMatch[0].replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    const ivaMatch = text.match(/iva[:\s]*\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi);
    if (ivaMatch) {
      extracted.tax = parseFloat(ivaMatch[0].replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    // Extract dates
    const datePatterns = [
      /fecha[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      dates.push(...matches.map(match => match[0]));
    }
    
    if (dates.length >= 1) {
      extracted.issueDate = dates[0];
      if (dates.length >= 2) {
        extracted.dueDate = dates[1];
      }
    }
    
    // Extract vendor information
    const vendorPatterns = [
      /raz[óo]n\s+social[:\s]+([^\n\r.]+)/gi,
      /empresa[:\s]+([^\n\r.]+)/gi,
      /proveedor[:\s]+([^\n\r.]+)/gi,
    ];
    
    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.vendor = { 
          ...extracted.vendor, 
          name: match[1].trim() 
        };
        break;
      }
    }
    
    // Extract CUIT
    const cuitMatch = text.match(/cuit[:\s]*(\d{2}-\d{8}-\d{1})/gi);
    if (cuitMatch) {
      extracted.vendor = {
        ...extracted.vendor,
        cuit: cuitMatch[0].replace(/[^\d-]/g, '')
      };
    }
    
    // Extract project reference
    const projectPatterns = [
      /obra[:\s]+([^\n\r.]{10,100})/gi,
      /proyecto[:\s]+([^\n\r.]{10,100})/gi,
      /expediente[:\s]+([^\n\r.]{5,50})/gi,
    ];
    
    for (const pattern of projectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.projectReference = match[1].trim();
        break;
      }
    }
    
    return extracted;
  }

  private extractInvoiceNumber(fileName: string): string | null {
    // Extract invoice number from filename patterns
    const patterns = [
      /factura[_\s-]*(\d+)/i,
      /invoice[_\s-]*(\d+)/i,
      /fc[_\s-]*(\d+)/i,
      /(\d{4,})/,
    ];

    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private getFileSize(file: File | Buffer): number {
    if (file instanceof File) {
      return file.size;
    }
    return file.length;
  }
} 