import type {
  DocumentProcessor,
  DocumentProcessorInput,
  ProcessorResult,
  ProcessedDocument,
} from "../index";

export class GenericDocumentProcessor implements DocumentProcessor {
  getProcessorName(): string {
    return "GenericDocumentProcessor";
  }

  getSupportedTypes(): string[] {
    return [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];
  }

  async processDocument(
    input: DocumentProcessorInput
  ): Promise<ProcessorResult<ProcessedDocument>> {
    try {
      const startTime = Date.now();

      // Extract generic document data
      const extractedData = await this.extractGenericData(input);

      const result: ProcessedDocument = {
        extractedData,
        documentType: "generic",
        confidence: 0.6, // Lower confidence for generic processing
        metadata: {
          fileSize: this.getFileSize(input.file),
          processingTime: Date.now() - startTime,
          ocrProvider: "basic",
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
        error: error instanceof Error ? error.message : "Generic document processing failed",
        metadata: {
          processorName: this.getProcessorName(),
        },
      };
    }
  }

  private async extractGenericData(
    input: DocumentProcessorInput
  ): Promise<Record<string, any>> {
    return {
      // Basic document information
      fileName: input.fileName,
      contentType: input.contentType,
      documentCategory: this.categorizeDocument(input.fileName),
      
      // Basic extracted content
      title: null,
      content: null,
      language: "es", // Default to Spanish for DPO
      
      // Dates found in document
      dates: [],
      
      // Numbers and amounts found
      numbers: [],
      amounts: [],
      
      // Text analysis
      textAnalysis: {
        wordCount: null,
        pageCount: null,
        hasImages: false,
        hasTables: false,
        hasSignatures: false,
      },
      
      // Potential document type hints
      typeHints: {
        isContract: this.containsContractKeywords(input.fileName),
        isInvoice: this.containsInvoiceKeywords(input.fileName),
        isPermit: this.containsPermitKeywords(input.fileName),
        isBlueprint: this.containsBlueprintKeywords(input.fileName),
        isReport: this.containsReportKeywords(input.fileName),
      },
      
      // Basic metadata extraction
      metadata: {
        author: null,
        createdDate: null,
        modifiedDate: null,
        subject: null,
        keywords: [],
      },
      
      // Quality indicators
      quality: {
        isReadable: true,
        hasGoodResolution: true,
        isComplete: true,
        needsManualReview: false,
      },
      
      // Extracted metadata
      extractionMetadata: {
        fileName: input.fileName,
        extractedAt: new Date().toISOString(),
        confidence: {
          overall: 0.6,
          textExtraction: 0.7,
          structureDetection: 0.5,
          typeDetection: 0.4,
        },
      },
    };
  }

  private categorizeDocument(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    
    if (this.containsContractKeywords(fileName)) return "contract";
    if (this.containsInvoiceKeywords(fileName)) return "invoice";
    if (this.containsPermitKeywords(fileName)) return "permit";
    if (this.containsBlueprintKeywords(fileName)) return "blueprint";
    if (this.containsReportKeywords(fileName)) return "report";
    
    return "unknown";
  }

  private containsContractKeywords(fileName: string): boolean {
    const keywords = ["contrato", "contract", "acuerdo", "convenio"];
    return keywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  private containsInvoiceKeywords(fileName: string): boolean {
    const keywords = ["factura", "invoice", "presupuesto", "cotizacion"];
    return keywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  private containsPermitKeywords(fileName: string): boolean {
    const keywords = ["permiso", "permit", "habilitacion", "autorizacion"];
    return keywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  private containsBlueprintKeywords(fileName: string): boolean {
    const keywords = ["plano", "blueprint", "diseño", "dwg", "dxf"];
    return keywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  private containsReportKeywords(fileName: string): boolean {
    const keywords = ["reporte", "report", "informe", "certificado"];
    return keywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  private getFileSize(file: File | Buffer): number {
    if (file instanceof File) {
      return file.size;
    }
    return file.length;
  }
} 