import type {
  DocumentProcessor,
  DocumentProcessorInput,
  ProcessorResult,
  ProcessedDocument,
} from "../index";
import { ocrService } from "./ocr-service";

export class ContractProcessor implements DocumentProcessor {
  getProcessorName(): string {
    return "ContractProcessor";
  }

  getSupportedTypes(): string[] {
    return [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
  }

  async processDocument(
    input: DocumentProcessorInput
  ): Promise<ProcessorResult<ProcessedDocument>> {
    try {
      const startTime = Date.now();

      // Extract contract-specific data using OCR + AI
      const extractedData = await this.extractContractData(input);

      const result: ProcessedDocument = {
        extractedData,
        documentType: "contract",
        confidence: extractedData.extractionMetadata?.confidence?.overall || 0.85,
        metadata: {
          fileSize: this.getFileSize(input.file),
          processingTime: Date.now() - startTime,
          ocrProvider: extractedData.extractionMetadata?.ocrProvider || "internal",
          aiEnhanced: extractedData.extractionMetadata?.aiEnhanced || false,
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
        error: error instanceof Error ? error.message : "Contract processing failed",
        metadata: {
          processorName: this.getProcessorName(),
        },
      };
    }
  }

  private async extractContractData(
    input: DocumentProcessorInput
  ): Promise<Record<string, any>> {
    try {
      // Use OCR service to extract text and structured data
      const ocrResult = await ocrService.processDocument(
        input.file,
        'contract',
        {
          language: 'spa+eng', // Spanish + English for Argentina
          extractTables: true,
        }
      );

      console.log(`OCR completed with ${ocrResult.provider}, confidence: ${ocrResult.confidence}`);

      // Base contract data structure
      let contractData = {
        // Basic contract information
        contractNumber: this.extractContractNumber(input.fileName),
        contractType: "construccion",
        
        // Parties involved
        contractor: {
          name: null,
          cuit: null,
          address: null,
          representative: null,
        },
        client: {
          name: "Dirección Provincial de Obras Públicas",
          department: null,
          representative: null,
        },
        
        // Financial information
        contractAmount: null,
        currency: "ARS",
        paymentTerms: null,
        advancePayment: null,
        
        // Timeline
        startDate: null,
        endDate: null,
        duration: null,
        
        // Work details
        workDescription: null,
        location: {
          province: null,
          department: null,
          address: null,
        },
        
        // Legal and administrative
        guarantees: {
          bidGuarantee: null,
          performanceGuarantee: null,
          warrantyGuarantee: null,
        },
        penalties: {
          delayPenalty: null,
          qualityPenalty: null,
        },
        
        // Technical specifications
        technicalSpecs: null,
        materials: [],
        equipment: [],
        
        // Compliance requirements
        permits: [],
        certifications: [],
        insurances: [],
        
        // Extraction metadata
        extractionMetadata: {
          fileName: input.fileName,
          extractedAt: new Date().toISOString(),
          ocrProvider: ocrResult.provider,
          aiEnhanced: (ocrResult.metadata as any)?.aiEnhanced || false,
          confidence: {
            overall: ocrResult.confidence,
            contractNumber: 0.9,
            parties: 0.7,
            amounts: 0.8,
            dates: 0.75,
          },
          rawText: ocrResult.text,
        },
      };

      // If AI extracted structured data, merge it with our base structure
      if ((ocrResult.metadata as any)?.extractedData) {
        const aiData = (ocrResult.metadata as any).extractedData;
        
        // Merge AI-extracted data
        contractData = {
          ...contractData,
          contractNumber: aiData.contractNumber || contractData.contractNumber,
          contractAmount: aiData.contractAmount,
          currency: aiData.currency || contractData.currency,
          startDate: aiData.startDate,
          endDate: aiData.endDate,
          duration: aiData.duration,
          workDescription: aiData.workDescription,
          contractor: {
            ...contractData.contractor,
            ...aiData.contractor,
          },
          location: {
            ...contractData.location,
            ...aiData.location,
          },
        };
      } else {
        // Fallback: Extract data from raw OCR text using regex patterns
        const textData = this.extractFromText(ocrResult.text);
        contractData = { ...contractData, ...textData };
      }

      return contractData;
    } catch (error) {
      console.warn('OCR processing failed, falling back to filename extraction:', error);
      
      // Fallback to basic filename extraction
      return {
        contractNumber: this.extractContractNumber(input.fileName),
        contractType: "construccion",
        contractor: { name: null, cuit: null, address: null, representative: null },
        client: { name: "Dirección Provincial de Obras Públicas", department: null, representative: null },
        contractAmount: null,
        currency: "ARS",
        paymentTerms: null,
        advancePayment: null,
        startDate: null,
        endDate: null,
        duration: null,
        workDescription: null,
        location: { province: null, department: null, address: null },
        guarantees: { bidGuarantee: null, performanceGuarantee: null, warrantyGuarantee: null },
        penalties: { delayPenalty: null, qualityPenalty: null },
        technicalSpecs: null,
        materials: [],
        equipment: [],
        permits: [],
        certifications: [],
        insurances: [],
        extractionMetadata: {
          fileName: input.fileName,
          extractedAt: new Date().toISOString(),
          ocrProvider: "fallback",
          aiEnhanced: false,
          confidence: { overall: 0.3, contractNumber: 0.9, parties: 0.1, amounts: 0.1, dates: 0.1 },
          error: error instanceof Error ? error.message : 'OCR failed',
        },
      };
    }
  }

  private extractFromText(text: string): Partial<Record<string, any>> {
    const extracted: any = {};
    
    // Extract amounts (pesos argentinos)
    const amountPatterns = [
      /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*pesos/gi,
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*ARS/gi,
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[0].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (amount > 10000) { // Reasonable contract amount
          extracted.contractAmount = amount;
          break;
        }
      }
    }
    
    // Extract dates
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      dates.push(...matches.map(match => match[0]));
    }
    
    if (dates.length >= 2) {
      extracted.startDate = dates[0];
      extracted.endDate = dates[1];
    }
    
    // Extract contractor name (look for "contratista", "empresa", etc.)
    const contractorPatterns = [
      /contratista[:\s]+([^\n\r.]+)/gi,
      /empresa[:\s]+([^\n\r.]+)/gi,
      /adjudicatario[:\s]+([^\n\r.]+)/gi,
    ];
    
    for (const pattern of contractorPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.contractor = { 
          ...extracted.contractor, 
          name: match[1].trim() 
        };
        break;
      }
    }
    
    // Extract work description
    const descriptionPatterns = [
      /objeto[:\s]+([^\n\r.]{20,200})/gi,
      /descripci[óo]n[:\s]+([^\n\r.]{20,200})/gi,
      /trabajo[s]?[:\s]+([^\n\r.]{20,200})/gi,
    ];
    
    for (const pattern of descriptionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.workDescription = match[1].trim();
        break;
      }
    }
    
    return extracted;
  }

  private extractContractNumber(fileName: string): string | null {
    // Extract contract number from filename patterns
    const patterns = [
      /contrato[_\s-]*(\d+)/i,
      /contract[_\s-]*(\d+)/i,
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