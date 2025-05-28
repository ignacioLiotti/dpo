import type {
  DocumentProcessor,
  DocumentProcessorInput,
  ProcessorResult,
  ProcessedDocument,
} from "../index";
import { ContractProcessor } from "./contract-processor";
import { InvoiceProcessor } from "./invoice-processor";
import { PermitProcessor } from "./permit-processor";
import { BlueprintProcessor } from "./blueprint-processor";
import { GenericDocumentProcessor } from "./generic-processor";

export type DocumentType = 'contract' | 'invoice' | 'permit' | 'blueprint' | 'generic';

export interface DocumentClientParams {
  documentType: DocumentType;
  contentType: string;
}

export class DocumentClient {
  private processor: DocumentProcessor;

  constructor({ documentType, contentType }: DocumentClientParams) {
    this.processor = this.createProcessor(documentType, contentType);
  }

  private createProcessor(documentType: DocumentType, contentType: string): DocumentProcessor {
    switch (documentType) {
      case 'contract':
        return new ContractProcessor();
      case 'invoice':
        return new InvoiceProcessor();
      case 'permit':
        return new PermitProcessor();
      case 'blueprint':
        return new BlueprintProcessor();
      default:
        return new GenericDocumentProcessor();
    }
  }

  public async processDocument(
    input: DocumentProcessorInput
  ): Promise<ProcessorResult<ProcessedDocument>> {
    try {
      const startTime = Date.now();
      
      // Add processing metadata
      const enrichedInput = {
        ...input,
        context: {
          ...input.context,
          timestamp: new Date(),
          metadata: {
            ...input.context.metadata,
            processingStartTime: startTime,
          },
        },
      };

      const result = await this.processor.processDocument(enrichedInput);

      // Add processing time to result
      if (result.success && result.data) {
        result.data.metadata.processingTime = Date.now() - startTime;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          processorName: this.processor.getProcessorName(),
          errorTime: new Date().toISOString(),
        },
      };
    }
  }

  public getSupportedTypes(): string[] {
    return this.processor.getSupportedTypes();
  }

  public getProcessorName(): string {
    return this.processor.getProcessorName();
  }

  // Static factory method for easy instantiation
  static create(documentType: DocumentType, contentType: string): DocumentClient {
    return new DocumentClient({ documentType, contentType });
  }

  // Auto-detect document type based on content and filename
  static async createFromFile(
    file: File | Buffer,
    fileName: string,
    contentType: string
  ): Promise<DocumentClient> {
    const documentType = this.detectDocumentType(fileName, contentType);
    return new DocumentClient({ documentType, contentType });
  }

  private static detectDocumentType(fileName: string, contentType: string): DocumentType {
    const lowerFileName = fileName.toLowerCase();
    
    // Contract detection
    if (lowerFileName.includes('contrato') || 
        lowerFileName.includes('contract') ||
        lowerFileName.includes('acuerdo')) {
      return 'contract';
    }
    
    // Invoice detection
    if (lowerFileName.includes('factura') || 
        lowerFileName.includes('invoice') ||
        lowerFileName.includes('presupuesto')) {
      return 'invoice';
    }
    
    // Permit detection
    if (lowerFileName.includes('permiso') || 
        lowerFileName.includes('permit') ||
        lowerFileName.includes('habilitacion') ||
        lowerFileName.includes('autorizacion')) {
      return 'permit';
    }
    
    // Blueprint detection
    if (lowerFileName.includes('plano') || 
        lowerFileName.includes('blueprint') ||
        lowerFileName.includes('diseño') ||
        contentType.includes('dwg') ||
        contentType.includes('autocad')) {
      return 'blueprint';
    }
    
    return 'generic';
  }
} 