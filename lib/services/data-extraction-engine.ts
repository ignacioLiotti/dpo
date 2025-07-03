// Data Extraction Engine with AI and Regex capabilities

export interface FieldDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone';
  field_label: string;
  field_description?: string;
  extraction_method: 'regex' | 'ai' | 'hybrid';
  extraction_pattern: string;
  validation_pattern?: string;
  is_required: boolean;
  default_value?: string;
}

export interface ExtractionResult {
  field_name: string;
  extracted_value: string | null;
  confidence_score: number;
  extraction_method_used: string;
  raw_extracted_text: string;
  error?: string;
}

export interface ExtractionContext {
  document_text: string;
  ocr_text?: string;
  file_name: string;
  file_type: string;
  folder_name: string;
}

export class DataExtractionEngine {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Extract all defined fields from a document
   */
  async extractFields(
    fieldDefinitions: FieldDefinition[],
    context: ExtractionContext
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    // Combine all available text
    const fullText = [
      context.document_text,
      context.ocr_text,
    ].filter(Boolean).join('\n\n');

    for (const field of fieldDefinitions) {
      try {
        const result = await this.extractSingleField(field, {
          ...context,
          document_text: fullText,
        });
        results.push(result);
      } catch (error) {
        results.push({
          field_name: field.field_name,
          extracted_value: null,
          confidence_score: 0,
          extraction_method_used: field.extraction_method,
          raw_extracted_text: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Extract a single field from a document
   */
  async extractSingleField(
    field: FieldDefinition,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    switch (field.extraction_method) {
      case 'regex':
        return this.extractWithRegex(field, context);
      case 'ai':
        return this.extractWithAI(field, context);
      case 'hybrid':
        // Try regex first, fallback to AI
        const regexResult = this.extractWithRegex(field, context);
        if (regexResult.confidence_score > 0) {
          return regexResult;
        }
        return this.extractWithAI(field, context);
      default:
        throw new Error(`Unknown extraction method: ${field.extraction_method}`);
    }
  }

  /**
   * Extract using regex patterns
   */
  private extractWithRegex(
    field: FieldDefinition,
    context: ExtractionContext
  ): ExtractionResult {
    try {
      const pattern = new RegExp(field.extraction_pattern, 'gi');
      const matches = context.document_text.match(pattern);

      if (!matches || matches.length === 0) {
        return {
          field_name: field.field_name,
          extracted_value: field.default_value || null,
          confidence_score: 0,
          extraction_method_used: 'regex',
          raw_extracted_text: '',
        };
      }

      // Take the first match and clean it
      const rawValue = matches[0];
      const cleanedValue = this.cleanExtractedValue(rawValue, field.field_type);

      // Validate if validation pattern is provided
      if (field.validation_pattern) {
        const validationRegex = new RegExp(field.validation_pattern);
        if (!validationRegex.test(cleanedValue)) {
          return {
            field_name: field.field_name,
            extracted_value: field.default_value || null,
            confidence_score: 0.3, // Low confidence due to validation failure
            extraction_method_used: 'regex',
            raw_extracted_text: rawValue,
            error: 'Extracted value failed validation',
          };
        }
      }

      return {
        field_name: field.field_name,
        extracted_value: cleanedValue,
        confidence_score: 1.0, // High confidence for successful regex match
        extraction_method_used: 'regex',
        raw_extracted_text: rawValue,
      };
    } catch (error) {
      return {
        field_name: field.field_name,
        extracted_value: field.default_value || null,
        confidence_score: 0,
        extraction_method_used: 'regex',
        raw_extracted_text: '',
        error: error instanceof Error ? error.message : 'Regex error',
      };
    }
  }

  /**
   * Extract using OpenAI API (following existing pattern)
   */
  private async extractWithAI(
    field: FieldDefinition,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    if (!this.apiKey) {
      return {
        field_name: field.field_name,
        extracted_value: field.default_value || null,
        confidence_score: 0,
        extraction_method_used: 'ai',
        raw_extracted_text: '',
        error: 'OpenAI API key not configured',
      };
    }

    try {
      const prompt = this.buildAIPrompt(field, context);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a data extraction assistant. Extract specific information from documents. Return only the requested value, or "NULL" if not found. Be precise and accurate.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.1, // Low temperature for consistent results
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const extractedText = result.choices?.[0]?.message?.content?.trim() || '';
      
      if (extractedText === 'NULL' || !extractedText) {
        return {
          field_name: field.field_name,
          extracted_value: field.default_value || null,
          confidence_score: 0,
          extraction_method_used: 'ai',
          raw_extracted_text: '',
        };
      }

      const cleanedValue = this.cleanExtractedValue(extractedText, field.field_type);
      
      // Estimate confidence based on response quality
      const confidence = this.estimateAIConfidence(extractedText, field);

      return {
        field_name: field.field_name,
        extracted_value: cleanedValue,
        confidence_score: confidence,
        extraction_method_used: 'ai',
        raw_extracted_text: extractedText,
      };
    } catch (error) {
      return {
        field_name: field.field_name,
        extracted_value: field.default_value || null,
        confidence_score: 0,
        extraction_method_used: 'ai',
        raw_extracted_text: '',
        error: error instanceof Error ? error.message : 'AI extraction error',
      };
    }
  }

  /**
   * Build AI prompt for field extraction
   */
  private buildAIPrompt(field: FieldDefinition, context: ExtractionContext): string {
    let prompt = field.extraction_pattern; // Use extraction_pattern as AI prompt

    // If no custom prompt, build a default one
    if (!prompt || prompt.trim() === '') {
      prompt = `Extract the ${field.field_label} from this document. Looking for a ${field.field_type} value.`;
      
      if (field.field_description) {
        prompt += ` Description: ${field.field_description}`;
      }
    }

    prompt += `\n\nDocument content:\n${context.document_text}`;
    
    // Add context about file
    prompt += `\n\nFile name: ${context.file_name}`;
    prompt += `\nFolder: ${context.folder_name}`;
    
    prompt += `\n\nReturn only the ${field.field_type} value you found, or "NULL" if not found.`;

    return prompt;
  }

  /**
   * Clean and format extracted values based on field type
   */
  private cleanExtractedValue(value: string, fieldType: string): string {
    let cleaned = value.trim();

    switch (fieldType) {
      case 'number':
        // Extract numbers, handle decimals and thousands separators
        const numberMatch = cleaned.match(/[\d,.]+/);
        if (numberMatch) {
          cleaned = numberMatch[0].replace(/,/g, '');
        }
        break;
      case 'currency':
        // Extract currency values
        const currencyMatch = cleaned.match(/[\d,.]+/);
        if (currencyMatch) {
          cleaned = currencyMatch[0].replace(/,/g, '');
        }
        break;
      case 'date':
        // Try to standardize date formats
        // This is a simplified approach - you might want more sophisticated date parsing
        break;
      case 'email':
        // Extract email addresses
        const emailMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          cleaned = emailMatch[0];
        }
        break;
      case 'phone':
        // Extract phone numbers
        const phoneMatch = cleaned.match(/[\d\s\-\(\)\+]+/);
        if (phoneMatch) {
          cleaned = phoneMatch[0].trim();
        }
        break;
      case 'boolean':
        // Convert to boolean
        const lowerValue = cleaned.toLowerCase();
        if (['yes', 'sí', 'si', 'true', '1', 'verdadero'].includes(lowerValue)) {
          cleaned = 'true';
        } else if (['no', 'false', '0', 'falso'].includes(lowerValue)) {
          cleaned = 'false';
        }
        break;
      default:
        // For text, just trim and clean up whitespace
        cleaned = cleaned.replace(/\s+/g, ' ');
    }

    return cleaned;
  }

  /**
   * Estimate AI confidence based on response characteristics
   */
  private estimateAIConfidence(response: string, field: FieldDefinition): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for responses that match expected patterns
    if (field.validation_pattern) {
      const validationRegex = new RegExp(field.validation_pattern);
      if (validationRegex.test(response)) {
        confidence += 0.3;
      } else {
        confidence -= 0.2;
      }
    }

    // Higher confidence for field-type appropriate responses
    switch (field.field_type) {
      case 'number':
      case 'currency':
        if (/^\d+\.?\d*$/.test(response.replace(/,/g, ''))) {
          confidence += 0.2;
        }
        break;
      case 'email':
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response)) {
          confidence += 0.3;
        }
        break;
      case 'date':
        if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(response)) {
          confidence += 0.2;
        }
        break;
    }

    // Lower confidence for very short or very long responses
    if (response.length < 2) {
      confidence -= 0.2;
    } else if (response.length > 100) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}

// Predefined field templates for common document types
export const FIELD_TEMPLATES = {
  invoices: [
    {
      field_name: 'invoice_number',
      field_type: 'text' as const,
      field_label: 'Invoice Number',
      extraction_method: 'regex' as const,
      extraction_pattern: '(?:invoice|factura)\\s*#?\\s*([A-Z0-9-]+)',
      is_required: true,
    },
    {
      field_name: 'total_amount',
      field_type: 'currency' as const,
      field_label: 'Total Amount',
      extraction_method: 'regex' as const,
      extraction_pattern: '(?:total|importe)\\s*:?\\s*\\$?([\\d,.]+ ?)',
      is_required: true,
    },
    {
      field_name: 'invoice_date',
      field_type: 'date' as const,
      field_label: 'Invoice Date',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the invoice date or issue date in this document.',
      is_required: true,
    },
    {
      field_name: 'vendor_name',
      field_type: 'text' as const,
      field_label: 'Vendor Name',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the vendor or company name that issued this invoice.',
      is_required: true,
    },
  ],
  contracts: [
    {
      field_name: 'contract_number',
      field_type: 'text' as const,
      field_label: 'Contract Number',
      extraction_method: 'regex' as const,
      extraction_pattern: '(?:contrato|contract)\\s*#?\\s*([A-Z0-9-]+)',
      is_required: true,
    },
    {
      field_name: 'contract_value',
      field_type: 'currency' as const,
      field_label: 'Contract Value',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the total contract value or amount in this contract.',
      is_required: false,
    },
    {
      field_name: 'start_date',
      field_type: 'date' as const,
      field_label: 'Start Date',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the contract start date or effective date.',
      is_required: false,
    },
    {
      field_name: 'contractor_name',
      field_type: 'text' as const,
      field_label: 'Contractor Name',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the contractor or service provider name in this contract.',
      is_required: true,
    },
  ],
  permits: [
    {
      field_name: 'permit_number',
      field_type: 'text' as const,
      field_label: 'Permit Number',
      extraction_method: 'regex' as const,
      extraction_pattern: '(?:permit|permiso)\\s*#?\\s*([A-Z0-9-]+)',
      is_required: true,
    },
    {
      field_name: 'issue_date',
      field_type: 'date' as const,
      field_label: 'Issue Date',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the permit issue date or approval date.',
      is_required: true,
    },
    {
      field_name: 'expiration_date',
      field_type: 'date' as const,
      field_label: 'Expiration Date',
      extraction_method: 'ai' as const,
      extraction_pattern: 'Find the permit expiration date or validity end date.',
      is_required: false,
    },
    {
      field_name: 'permit_type',
      field_type: 'text' as const,
      field_label: 'Permit Type',
      extraction_method: 'ai' as const,
      extraction_pattern: 'What type of permit is this? (building, environmental, etc.)',
      is_required: true,
    },
  ],
};