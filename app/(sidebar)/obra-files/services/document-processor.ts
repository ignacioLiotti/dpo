// Dynamic imports to avoid server-side issues

export interface DocumentProcessingResult {
  ocrText: string;
  aiDescription: string;
  aiTags: string[];
  confidence: number;
  extractedData?: Record<string, any>;
  metadata: {
    processingTime: number;
    ocrProvider: string;
    aiProvider?: string;
    fileSize: number;
    fileType: string;
    folderExtraction?: boolean;
  };
}

export interface DocumentExtractionResult {
  extractedData: Record<string, any>;
  confidence: number;
  fieldCount: number;
  metadata: {
    processingTime: number;
    aiProvider: string;
  };
}

/**
 * Process a document with OCR and AI to generate description and tags
 * Optionally extracts structured data if folder has extraction enabled
 */
export async function processDocument(
  file: File | Buffer,
  fileName: string,
  fileType: string,
  folderExtractionEnabled: boolean = false,
  fieldDefinitions?: Array<{
    field_name: string;
    field_type: string;
    field_label: string;
    extraction_method: 'regex' | 'ai' | 'hybrid';
    extraction_pattern: string;
    is_required: boolean;
    default_value?: string;
  }>
): Promise<DocumentProcessingResult> {
  const startTime = Date.now();
  const fileSize = file instanceof File ? file.size : Buffer.byteLength(file);

  try {
    // console.log(`Processing document: ${fileName} (extraction: ${folderExtractionEnabled})`);
    
    // Step 1: OCR extraction 
    let ocrText = '';
    let ocrProvider = 'none';
    
    if (shouldPerformOCR(fileType)) {
      // Try multiple OCR methods in order: Mistral (PDFs) → OpenAI Vision (images) → Tesseract → Regex fallback
      const ocrMethods = [
        { 
          name: 'mistral-pdf', 
          fn: () => extractTextWithMistral(file, fileName),
          condition: () => fileType === 'application/pdf'
        },
        { 
          name: 'openai-vision', 
          fn: () => extractTextWithOpenAI(file, fileName),
          condition: () => fileType.startsWith('image/')
        },
        { 
          name: 'tesseract', 
          fn: () => extractTextWithTesseract(file, fileName),
          condition: () => typeof window !== 'undefined' // Client-side only
        },
        { 
          name: 'regex', 
          fn: () => extractTextWithRegex(fileName),
          condition: () => true // Always available
        }
      ];
      
      for (const method of ocrMethods) {
        try {
          // Skip if condition not met
          if (!method.condition()) {
            continue;
          }
          
          // console.log(`Trying ${method.name} OCR for ${fileName}...`);
          ocrText = await method.fn();
          ocrProvider = method.name;
          
          if (ocrText && ocrText.length > 0) {
            // console.log(`${method.name} OCR extracted ${ocrText.length} characters from ${fileName}`);
            break; // Success, stop trying other methods
          }
        } catch (ocrError) {
          console.warn(`${method.name} OCR failed for ${fileName}:`, ocrError);
          // Continue to next method
        }
      }
      
      if (!ocrText) {
        ocrProvider = 'all-failed';
        console.warn(`All OCR methods failed for ${fileName}`);
      }
    }
    
    // Step 2: Generate AI description and tags
    const { description, tags } = await generateDescriptionAndTags(
      ocrText,
      fileName,
      fileType
    );
    
    // Step 3: Extract structured data if folder has extraction enabled
    let extractedData: Record<string, any> | undefined;
    if (folderExtractionEnabled && fieldDefinitions && fieldDefinitions.length > 0) {
      try {
        // Try AI extraction first, fall back to regex if available
        if (ocrText && ocrText.length > 10) {
          extractedData = await extractStructuredDataWithAI(
            ocrText,
            fieldDefinitions,
            fileName
          );
        } else {
          // Fallback to regex-based extraction using filename and field patterns
          extractedData = await extractStructuredDataWithRegex(
            fileName,
            fieldDefinitions
          );
        }
        // console.log(`Extracted ${Object.keys(extractedData).length} fields from ${fileName}`);
      } catch (extractionError) {
        console.warn(`Data extraction failed for ${fileName}:`, extractionError);
        // Try regex fallback if AI fails
        try {
          extractedData = await extractStructuredDataWithRegex(
            fileName,
            fieldDefinitions
          );
          // console.log(`Fallback regex extraction completed for ${fileName}`);
        } catch (regexError) {
          console.warn(`Regex extraction also failed for ${fileName}:`, regexError);
        }
      }
    }

    return {
      ocrText,
      aiDescription: description,
      aiTags: tags,
      confidence: calculateConfidence(ocrText, ocrProvider, description),
      extractedData,
      metadata: {
        processingTime: Date.now() - startTime,
        ocrProvider,
        aiProvider: 'openai',
        fileSize,
        fileType,
        folderExtraction: folderExtractionEnabled,
      },
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    
    // Return minimal result on failure
    return {
      ocrText: '',
      aiDescription: `Document: ${fileName}`,
      aiTags: [getDocumentType(fileName), 'documento'],
      confidence: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        ocrProvider: 'none',
        fileSize,
        fileType,
        folderExtraction: folderExtractionEnabled,
      },
    };
  }
}

/**
 * Extract structured data from document using folder field definitions
 */
export async function extractStructuredData(
  ocrText: string,
  fieldDefinitions: Array<{
    field_name: string;
    field_type: string;
    field_label: string;
    extraction_method: 'regex' | 'ai' | 'hybrid';
    extraction_pattern: string;
    is_required: boolean;
    default_value?: string;
  }>,
  fileName: string
): Promise<DocumentExtractionResult> {
  const startTime = Date.now();
  const extractedData: Record<string, any> = {};
  
  try {
    // For now, just use default values
    for (const field of fieldDefinitions) {
      extractedData[field.field_name] = field.default_value || null;
    }

    return {
      extractedData,
      confidence: 0.5, // Low confidence for default values
      fieldCount: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        aiProvider: 'none',
      },
    };
  } catch (error) {
    console.error('Structured data extraction failed:', error);
    
    // Return empty result on failure
    return {
      extractedData: {},
      confidence: 0,
      fieldCount: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        aiProvider: 'none',
      },
    };
  }
}

/**
 * Extract text from PDF using Mistral (server-side compatible)
 */
async function extractTextWithMistral(file: File | Buffer, fileName: string): Promise<string> {
  try {
    // console.log(`Starting Mistral PDF OCR for ${fileName}...`);
    
    const { mistral } = await import('@ai-sdk/mistral');
    const { generateText } = await import('ai');
    
    // Convert File to data URL for Mistral
    let fileData: any;
    if (file instanceof File) {
      // For File objects, we need to create a data URL
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      fileData = `data:${file.type};base64,${base64}`;
    } else {
      // For Buffer, create data URL
      const base64 = file.toString('base64');
      fileData = `data:application/pdf;base64,${base64}`;
    }
    
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this PDF document. Return only the text content, preserving structure and formatting. Focus on readable text, numbers, dates, and important details for construction documents.'
            },
            {
              type: 'file',
              data: fileData,
              mimeType: 'application/pdf'
            }
          ]
        }
      ],
      temperature: 0.1,
      // Mistral provider options for PDF processing
      providerOptions: {
        mistral: {
          documentImageLimit: 8,
          documentPageLimit: 64,
        }
      }
    });
    
    return text.trim();
  } catch (error) {
    console.error('Mistral PDF OCR failed:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Mistral API key not configured correctly');
    }
    throw new Error(`Mistral OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from image using OpenAI Vision (server-side compatible)
 */
async function extractTextWithOpenAI(file: File | Buffer, fileName: string): Promise<string> {
  try {
    // console.log(`Starting OpenAI Vision OCR for ${fileName}...`);
    
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');
    
    // Convert to base64
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }
    
    const base64 = buffer.toString('base64');
    const mimeType = file instanceof File ? file.type : 'image/jpeg';
    
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
  } catch (error) {
    console.error('OpenAI Vision OCR failed:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured correctly');
    }
    throw new Error(`OpenAI OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text using regex patterns on filename (fallback method)
 */
async function extractTextWithRegex(fileName: string): Promise<string> {
  // console.log(`Trying regex extraction for ${fileName}...`);
  
  // Extract useful information from filename
  const patterns = [
    // Date patterns
    /(\d{4}[-_]\d{2}[-_]\d{2})/g,
    /(\d{2}[-_]\d{2}[-_]\d{4})/g,
    // Number patterns  
    /(\d{2,})/g,
    // Common document terms
    /(factura|invoice|contrato|contract|plano|blueprint)/gi,
  ];
  
  const extractedParts: string[] = [];
  const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  
  // Try each pattern
  for (const pattern of patterns) {
    const matches = baseName.match(pattern);
    if (matches) {
      extractedParts.push(...matches);
    }
  }
  
  // Create a pseudo-OCR text from filename analysis
  const docType = getDocumentType(fileName);
  let extractedText = `Documento: ${getDocumentTypeLabel(docType)}\n`;
  extractedText += `Archivo: ${baseName}\n`;
  
  if (extractedParts.length > 0) {
    extractedText += `Información extraída: ${extractedParts.join(', ')}\n`;
  }
  
  return extractedText;
}

/**
 * Extract text from document using Tesseract.js OCR (client-side only)
 */
async function extractTextWithTesseract(file: File | Buffer, fileName: string): Promise<string> {
  // Dynamic import to handle client-side only requirement
  const Tesseract = await import('tesseract.js');
  
  try {
    // console.log(`Starting Tesseract OCR for ${fileName}...`);
    
    const { data } = await Tesseract.recognize(
      file,
      'spa+eng', // Spanish + English
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );
    
    return data.text.trim();
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file type supports OCR
 */
function shouldPerformOCR(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/tiff',
    'image/bmp',
    'application/pdf'
  ];
  return supportedTypes.includes(fileType.toLowerCase());
}

/**
 * Generate AI description and tags for a document using OCR text
 */
async function generateDescriptionAndTags(
  ocrText: string,
  fileName: string,
  fileType: string
): Promise<{ description: string; tags: string[] }> {
  // If we have OCR text, use AI to generate better description and tags
  if (ocrText && ocrText.length > 20) {
    // Try Mistral first, then OpenAI as fallback
    const aiProviders = [
      { name: 'mistral', hasKey: () => !!process.env.MISTRAL_API_KEY },
      { name: 'openai', hasKey: () => !!process.env.OPENAI_API_KEY }
    ];
    
    for (const provider of aiProviders) {
      if (!provider.hasKey()) continue;
      
      try {
        const prompt = `Analyze this document content and generate a concise description and relevant tags.

          Filename: ${fileName}
          File type: ${fileType}
          Document content (OCR):
          ${ocrText.substring(0, 2000)}

          Respond with a JSON object in this format:
          {
            "description": "Brief, descriptive title for this document",
            "tags": ["tag1", "tag2", "tag3"]
          }

          Focus on construction/engineering terms if applicable. Use Spanish for the description and tags.`;

        let text: string;
        
        if (provider.name === 'mistral') {
          const { mistral } = await import('@ai-sdk/mistral');
          const { generateText } = await import('ai');
          
          const result = await generateText({
            model: mistral('mistral-small-latest'),
            prompt,
            temperature: 0.3,
          });
          text = result.text;
        } else {
          const { openai } = await import('@ai-sdk/openai');
          const { generateText } = await import('ai');
          
          const result = await generateText({
            model: openai('gpt-4o-mini'),
            prompt,
            temperature: 0.3,
          });
          text = result.text;
        }

        // Clean the text to extract JSON from potential markdown code blocks
        let cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        
        // Try to find JSON object if it's embedded in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        const aiResult = JSON.parse(cleanedText);
        // console.log(`AI description generated using ${provider.name}`);
        return {
          description: aiResult.description || `Documento: ${fileName}`,
          tags: Array.isArray(aiResult.tags) ? aiResult.tags : [getDocumentType(fileName), 'documento']
        };
      } catch (error) {
        console.warn(`${provider.name} description generation failed:`, error);
        // Continue to next provider
      }
    }
  }
  
  // Fallback to filename-based generation
  const docType = getDocumentType(fileName);
  const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  
  const description = `${getDocumentTypeLabel(docType)}: ${baseName}`;
  const tags = [docType, 'documento', 'obra'];
  
  // Add file type specific tags
  if (fileType.startsWith('image/')) {
    tags.push('imagen');
  } else if (fileType === 'application/pdf') {
    tags.push('pdf');
  }
  
  return {
    description,
    tags,
  };
}

/**
 * Extract structured data using AI based on field definitions
 */
async function extractStructuredDataWithAI(
  ocrText: string,
  fieldDefinitions: Array<{
    field_name: string;
    field_type: string;
    field_label: string;
    extraction_method: 'regex' | 'ai' | 'hybrid';
    extraction_pattern: string;
    is_required: boolean;
    default_value?: string;
  }>,
  fileName: string
): Promise<Record<string, any>> {
  const extractedData: Record<string, any> = {};
  
  // Build prompt for AI extraction
  const fieldsDescription = fieldDefinitions.map(field => 
    `"${field.field_name}" (${field.field_type}): ${field.field_label} - ${field.extraction_pattern}`
  ).join('\n');
  
  const prompt = `Extract specific data fields from this document content.

    Document: ${fileName}
    Content:
    ${ocrText.substring(0, 3000)}

    Extract these fields:
    ${fieldsDescription}

    Respond with a JSON object containing only the extracted values. Use null for fields that cannot be found. For dates, use YYYY-MM-DD format. For numbers, use numeric values without currency symbols.

    Example format:
    {
      "field_name1": "extracted_value",
      "field_name2": 123.45,
      "field_name3": "2024-01-15",
      "field_name4": null
    }`;

  try {
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');
    
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    // Clean the text to extract JSON from potential markdown code blocks
    let cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
    
    // Try to find JSON object if it's embedded in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    const aiExtracted = JSON.parse(cleanedText);
    
    // Process each field definition
    for (const field of fieldDefinitions) {
      let value = aiExtracted[field.field_name];
      
      // Use default value if no extraction and default is provided
      if (value === null || value === undefined) {
        value = field.default_value || null;
      }
      
      // Type conversion based on field type
      if (value !== null) {
        switch (field.field_type) {
          case 'number':
          case 'currency':
            value = parseFloat(value) || null;
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          case 'date':
            // Validate date format
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              value = value;
            } else {
              value = null;
            }
            break;
          default:
            value = String(value);
        }
      }
      
      extractedData[field.field_name] = value;
    }
    
    return extractedData;
  } catch (error) {
    console.error('AI data extraction failed:', error);
    
    // Return default values on failure
    for (const field of fieldDefinitions) {
      extractedData[field.field_name] = field.default_value || null;
    }
    
    return extractedData;
  }
}

/**
 * Extract structured data using regex patterns on filename (fallback method)
 */
async function extractStructuredDataWithRegex(
  fileName: string,
  fieldDefinitions: Array<{
    field_name: string;
    field_type: string;
    field_label: string;
    extraction_method: 'regex' | 'ai' | 'hybrid';
    extraction_pattern: string;
    is_required: boolean;
    default_value?: string;
  }>
): Promise<Record<string, any>> {
  const extractedData: Record<string, any> = {};
  const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  
  for (const field of fieldDefinitions) {
    let value = null;
    
    // Only try regex extraction for fields that have regex patterns
    if (field.extraction_method === 'regex' || field.extraction_method === 'hybrid') {
      try {
        const regex = new RegExp(field.extraction_pattern, 'gi');
        const matches = baseName.match(regex);
        
        if (matches && matches.length > 0) {
          // Use the first match
          let match = matches[0];
          
          // Type conversion based on field type
          switch (field.field_type) {
            case 'number':
            case 'currency':
              const numberMatch = match.match(/[\d.,]+/);
              value = numberMatch ? parseFloat(numberMatch[0].replace(',', '.')) : null;
              break;
            case 'date':
              // Try to parse date patterns
              const datePatterns = [
                /(\d{4}[-_]\d{2}[-_]\d{2})/,
                /(\d{2}[-_]\d{2}[-_]\d{4})/,
              ];
              for (const pattern of datePatterns) {
                const dateMatch = match.match(pattern);
                if (dateMatch) {
                  const datePart = dateMatch[1];
                  // Convert to YYYY-MM-DD format
                  if (datePart.match(/^\d{2}[-_]\d{2}[-_]\d{4}$/)) {
                    const parts = datePart.split(/[-_]/);
                    value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  } else {
                    value = datePart.replace('_', '-');
                  }
                  break;
                }
              }
              break;
            case 'boolean':
              value = /true|si|yes|1/gi.test(match);
              break;
            default:
              value = match.trim();
          }
        }
      } catch (regexError) {
        console.warn(`Regex extraction failed for field ${field.field_name}:`, regexError);
      }
    }
    
    // Use default value if extraction failed
    if (value === null && field.default_value) {
      value = field.default_value;
    }
    
    extractedData[field.field_name] = value;
  }
  
  return extractedData;
}

/**
 * Calculate confidence score based on processing results
 */
function calculateConfidence(ocrText: string, ocrProvider: string, description: string): number {
  let confidence = 0;
  
  // OCR confidence
  if (ocrProvider === 'tesseract' && ocrText.length > 50) {
    confidence += 0.6;
  } else if (ocrProvider === 'tesseract' && ocrText.length > 10) {
    confidence += 0.4;
  } else if (ocrProvider === 'failed') {
    confidence += 0.1;
  } else {
    confidence += 0.3; // filename-based
  }
  
  // AI description confidence
  if (description && description.length > 10 && !description.startsWith('Documento:')) {
    confidence += 0.3;
  } else {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * Get human-readable label for document type
 */
function getDocumentTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    factura: 'Factura',
    contrato: 'Contrato',
    plano: 'Plano',
    foto: 'Fotografía',
    permiso: 'Permiso',
    informe: 'Informe',
    certificado: 'Certificado',
    material: 'Material',
    correspondencia: 'Correspondencia',
    otros: 'Documento',
  };
  return labels[docType] || 'Documento';
}

/**
 * Determine document type from filename
 */
function getDocumentType(fileName: string): string {
  const name = fileName.toLowerCase();
  
  if (name.includes('factura') || name.includes('invoice')) return 'factura';
  if (name.includes('contrato') || name.includes('contract')) return 'contrato';
  if (name.includes('plano') || name.includes('blueprint') || name.includes('dwg')) return 'plano';
  if (name.includes('foto') || name.includes('photo') || name.includes('imagen')) return 'foto';
  if (name.includes('permiso') || name.includes('permit')) return 'permiso';
  if (name.includes('informe') || name.includes('report')) return 'informe';
  if (name.includes('certificado') || name.includes('certificate')) return 'certificado';
  if (name.includes('material')) return 'material';
  if (name.includes('correspondencia') || name.includes('carta') || name.includes('email')) return 'correspondencia';
  
  return 'otros';
}