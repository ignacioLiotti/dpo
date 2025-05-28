// OCR Service with multiple providers and AI fallback
import type { ProcessorContext } from "../index";

export interface OCRResult {
  text: string;
  confidence: number;
  provider: string;
  metadata: {
    processingTime: number;
    pageCount: number;
    language?: string;
    boundingBoxes?: Array<{
      text: string;
      confidence: number;
      coordinates: number[];
    }>;
  };
}

export interface OCRProvider {
  name: string;
  processDocument(file: File | Buffer, options?: OCROptions): Promise<OCRResult>;
  isAvailable(): boolean;
  getSupportedTypes(): string[];
}

export interface OCROptions {
  language?: string;
  extractTables?: boolean;
  extractImages?: boolean;
  enhanceQuality?: boolean;
}

// Tesseract.js OCR Provider (client-side, free)
export class TesseractOCRProvider implements OCRProvider {
  name = "Tesseract.js";

  async processDocument(file: File | Buffer, options: OCROptions = {}): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Dynamic import for client-side usage
      const Tesseract = await import('tesseract.js');
      
      const { data } = await Tesseract.recognize(
        file,
        options.language || 'spa+eng', // Spanish + English
        {
          logger: m => console.log(m) // Progress logging
        }
      );

      return {
        text: data.text,
        confidence: data.confidence / 100, // Convert to 0-1 scale
        provider: this.name,
        metadata: {
          processingTime: Date.now() - startTime,
          pageCount: 1,
          language: options.language || 'spa+eng',
          boundingBoxes: data.words?.map(word => ({
            text: word.text,
            confidence: word.confidence / 100,
            coordinates: [word.bbox.x0, word.bbox.y0, word.bbox.x1, word.bbox.y1]
          }))
        }
      };
    } catch (error) {
      throw new Error(`Tesseract OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined'; // Client-side only
  }

  getSupportedTypes(): string[] {
    return ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
  }
}

// Azure Document Intelligence Provider
export class AzureOCRProvider implements OCRProvider {
  name = "Azure Document Intelligence";
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
    this.apiKey = apiKey || process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';
  }

  async processDocument(file: File | Buffer, options: OCROptions = {}): Promise<OCRResult> {
    const startTime = Date.now();
    
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Azure credentials not configured');
    }

    try {
      // Convert File to ArrayBuffer if needed
      const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
      
      // Start analysis
      const analyzeResponse = await fetch(`${this.endpoint}/formrecognizer/documentModels/prebuilt-document:analyze?api-version=2023-07-31`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Azure API error: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
      }

      const operationLocation = analyzeResponse.headers.get('Operation-Location');
      if (!operationLocation) {
        throw new Error('No operation location returned from Azure');
      }

      // Poll for results
      let result;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      do {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const resultResponse = await fetch(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey
          }
        });

        result = await resultResponse.json();
        attempts++;
      } while (result.status === 'running' && attempts < maxAttempts);

      if (result.status !== 'succeeded') {
        throw new Error(`Azure analysis failed with status: ${result.status}`);
      }

      // Extract text and confidence
      const pages = result.analyzeResult?.pages || [];
      const allText = pages.map((page: any) => 
        page.lines?.map((line: any) => line.content).join('\n') || ''
      ).join('\n\n');

      const avgConfidence = pages.reduce((acc: number, page: any) => {
        const pageConfidence = page.lines?.reduce((lineAcc: number, line: any) => 
          lineAcc + (line.confidence || 0.8), 0) / (page.lines?.length || 1);
        return acc + pageConfidence;
      }, 0) / (pages.length || 1);

      return {
        text: allText,
        confidence: avgConfidence,
        provider: this.name,
        metadata: {
          processingTime: Date.now() - startTime,
          pageCount: pages.length,
          language: result.analyzeResult?.languages?.[0]?.locale,
          boundingBoxes: pages.flatMap((page: any) => 
            page.words?.map((word: any) => ({
              text: word.content,
              confidence: word.confidence || 0.8,
              coordinates: word.polygon || []
            })) || []
          )
        }
      };
    } catch (error) {
      throw new Error(`Azure OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return !!(this.endpoint && this.apiKey);
  }

  getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ];
  }
}

// OpenAI Vision API Provider (for images and AI-powered extraction)
export class OpenAIVisionProvider implements OCRProvider {
  name = "OpenAI Vision";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async processDocument(file: File | Buffer, options: OCROptions = {}): Promise<OCRResult> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Convert to base64
      const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const base64 = Buffer.from(fileBuffer).toString('base64');
      const mimeType = file instanceof File ? file.type : 'application/pdf';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Supports vision
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this document. Return only the text content, preserving structure and formatting as much as possible. If this is a construction contract, invoice, or permit, pay special attention to numbers, dates, and key details."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const extractedText = result.choices?.[0]?.message?.content || '';

      return {
        text: extractedText,
        confidence: 0.9, // OpenAI Vision is generally high quality
        provider: this.name,
        metadata: {
          processingTime: Date.now() - startTime,
          pageCount: 1,
          language: 'auto-detected'
        }
      };
    } catch (error) {
      throw new Error(`OpenAI Vision failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getSupportedTypes(): string[] {
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
  }
}

// Main OCR Service with fallback chain
export class OCRService {
  private providers: OCRProvider[];
  private aiExtractor: AIDataExtractor;

  constructor() {
    this.providers = [
      new AzureOCRProvider(),
      new OpenAIVisionProvider(),
      new TesseractOCRProvider()
    ];
    this.aiExtractor = new AIDataExtractor();
  }

  async processDocument(
    file: File | Buffer, 
    documentType: string,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const availableProviders = this.providers.filter(provider => 
      provider.isAvailable() && 
      provider.getSupportedTypes().some(type => 
        file instanceof File ? file.type.includes(type.split('/')[1]) : type.includes('pdf')
      )
    );

    if (availableProviders.length === 0) {
      throw new Error('No OCR providers available for this file type');
    }

    let lastError: Error | null = null;
    
    // Try each provider in order of preference
    for (const provider of availableProviders) {
      try {
        console.log(`Attempting OCR with ${provider.name}...`);
        const result = await provider.processDocument(file, options);
        
        // If confidence is too low, try AI enhancement
        if (result.confidence < 0.7) {
          console.log(`Low confidence (${result.confidence}), enhancing with AI...`);
          const enhancedResult = await this.aiExtractor.enhanceExtraction(
            result.text, 
            documentType,
            file instanceof File ? file.name : 'document'
          );
          
          return {
            ...result,
            text: enhancedResult.text,
            confidence: Math.max(result.confidence, enhancedResult.confidence),
            metadata: {
              ...result.metadata,
              aiEnhanced: true,
              originalConfidence: result.confidence
            }
          };
        }
        
        return result;
      } catch (error) {
        console.warn(`${provider.name} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    throw lastError || new Error('All OCR providers failed');
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(provider => provider.isAvailable())
      .map(provider => provider.name);
  }
}

// AI Data Extractor for enhancing OCR results
export class AIDataExtractor {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async enhanceExtraction(
    rawText: string, 
    documentType: string, 
    fileName: string
  ): Promise<{ text: string; confidence: number; extractedData?: any }> {
    if (!this.apiKey) {
      return { text: rawText, confidence: 0.5 };
    }

    try {
      const prompt = this.buildExtractionPrompt(rawText, documentType, fileName);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting structured data from construction documents. Always return valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1 // Low temperature for consistent extraction
        })
      });

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || '';
      
      try {
        const extractedData = JSON.parse(aiResponse);
        return {
          text: rawText,
          confidence: 0.9,
          extractedData
        };
      } catch (parseError) {
        // If JSON parsing fails, return cleaned text
        return {
          text: aiResponse,
          confidence: 0.8
        };
      }
    } catch (error) {
      console.warn('AI enhancement failed:', error);
      return { text: rawText, confidence: 0.6 };
    }
  }

  private buildExtractionPrompt(rawText: string, documentType: string, fileName: string): string {
    const basePrompt = `
Extract structured data from this ${documentType} document.
Filename: ${fileName}
Raw OCR Text: ${rawText}

Please extract and return a JSON object with the following structure:
`;

    switch (documentType) {
      case 'contract':
        return basePrompt + `
{
  "contractNumber": "string or null",
  "contractAmount": "number or null",
  "currency": "string (ARS, USD, etc.)",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null", 
  "duration": "number of days or null",
  "contractor": {
    "name": "string or null",
    "cuit": "string or null",
    "address": "string or null"
  },
  "workDescription": "string or null",
  "location": {
    "province": "string or null",
    "department": "string or null", 
    "address": "string or null"
  }
}`;

      case 'invoice':
        return basePrompt + `
{
  "invoiceNumber": "string or null",
  "total": "number or null",
  "subtotal": "number or null",
  "tax": "number or null",
  "currency": "string",
  "issueDate": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "vendor": {
    "name": "string or null",
    "cuit": "string or null"
  },
  "projectReference": "string or null"
}`;

      case 'permit':
        return basePrompt + `
{
  "permitNumber": "string or null",
  "permitType": "string or null",
  "issueDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "issuingAuthority": "string or null",
  "property": {
    "address": "string or null",
    "cadastralNumber": "string or null"
  },
  "applicant": {
    "name": "string or null",
    "cuit": "string or null"
  }
}`;

      default:
        return basePrompt + `
{
  "documentType": "string",
  "keyNumbers": ["array of important numbers found"],
  "keyDates": ["array of dates in YYYY-MM-DD format"],
  "summary": "brief summary of document content"
}`;
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService(); 