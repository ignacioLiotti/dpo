import { extractTextWithMistralUrl, extractTextWithOpenAIUrl } from './url-ocr-functions';

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

export interface FieldDefinition {
  field_name: string;
  field_type: string;
  field_label: string;
  extraction_method: 'regex' | 'ai' | 'hybrid';
  extraction_pattern: string;
  is_required: boolean;
  default_value?: string;
}

export async function processDocument(
  fileOrUrl: File | Buffer | string,
  fileName: string,
  fileType: string,
  folderExtractionEnabled: boolean = false,
  fieldDefinitions?: FieldDefinition[],
  existingOcrText?: string,
  existingOcrProvider?: string
): Promise<DocumentProcessingResult> {
  const startTime = Date.now();
  const isUrlBased = typeof fileOrUrl === 'string';
  const fileSize = isUrlBased ? 0 : (fileOrUrl instanceof File ? fileOrUrl.size : Buffer.byteLength(fileOrUrl));

  try {
    // Step 1: Use existing OCR text if available, otherwise extract text
    let ocrText: string;
    let ocrProvider: string;
    
    if (existingOcrText && existingOcrProvider) {
      console.log(`[ProcessDocument] Using existing AI-extracted text (${existingOcrText.length} chars) from ${existingOcrProvider}`);
      ocrText = existingOcrText;
      ocrProvider = existingOcrProvider;
    } else {
      console.log(`[ProcessDocument] No existing OCR text, extracting fresh...`);
      const ocrResult = await extractText(fileOrUrl, fileName, fileType, isUrlBased);
      ocrText = ocrResult.ocrText;
      ocrProvider = ocrResult.ocrProvider;
    }
    
    // Step 2: Generate AI description and tags (only if not already provided)
    const { description, tags } = await generateDescriptionAndTags(ocrText, fileName, fileType);
    
    // Step 3: Extract structured data if enabled
    let extractedData: Record<string, any> | undefined;

    console.log('extractedData', extractedData);
    console.log('fieldDefinitions', fieldDefinitions);

    if (folderExtractionEnabled && fieldDefinitions?.length) {
      extractedData = await extractStructuredData(ocrText, fieldDefinitions, fileName, fileType, isUrlBased ? fileOrUrl as string : undefined);
    }

    const confidence = calculateConfidence(ocrText, ocrProvider, description);

    return {
      ocrText,
      aiDescription: description,
      aiTags: tags,
      confidence,
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
    return {
      ocrText: '',
      aiDescription: `Document: ${fileName}`,
      aiTags: [getDocumentType(fileName), 'documento'],
      confidence: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        ocrProvider: 'failed',
        fileSize,
        fileType,
        folderExtraction: folderExtractionEnabled,
      },
    };
  }
}

async function extractText(
  fileOrUrl: File | Buffer | string,
  fileName: string,
  fileType: string,
  isUrlBased: boolean
): Promise<{ ocrText: string; ocrProvider: string }> {
  if (!shouldPerformOCR(fileType)) {
    return { ocrText: '', ocrProvider: 'none' };
  }

  const ocrMethods = isUrlBased 
    ? getUrlOcrMethods(fileOrUrl as string, fileName, fileType)
    : getFileOcrMethods(fileOrUrl as File | Buffer, fileName, fileType);

  for (const method of ocrMethods) {
    if (!method.condition()) continue;
    
    try {
      const ocrText = await method.fn();
      if (ocrText && ocrText.length > 0) {
        return { ocrText, ocrProvider: method.name };
      }
    } catch (error) {
      continue; // Try next method
    }
  }

  return { ocrText: '', ocrProvider: 'all-failed' };
}

function getUrlOcrMethods(documentUrl: string, fileName: string, fileType: string) {
  return [
    { 
      name: 'mistral-url', 
      fn: () => extractTextWithMistralUrl(documentUrl, fileName),
      condition: () => fileType === 'application/pdf' || fileType.startsWith('image/')
    },
    { 
      name: 'openai-vision-url', 
      fn: () => extractTextWithOpenAIUrl(documentUrl, fileName),
      condition: () => fileType.startsWith('image/')
    },
    { 
      name: 'regex', 
      fn: () => extractTextWithRegex(fileName),
      condition: () => true
    }
  ];
}

function getFileOcrMethods(file: File | Buffer, fileName: string, fileType: string) {
  return [
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
      condition: () => typeof window !== 'undefined'
    },
    { 
      name: 'regex', 
      fn: () => extractTextWithRegex(fileName),
      condition: () => true
    }
  ];
}

export async function extractStructuredData(
  ocrText: string,
  fieldDefinitions: FieldDefinition[],
  fileName: string,
  fileType: string,
  documentUrl?: string
): Promise<Record<string, any>> {
  // Check if this is an invoice and use specialized processor
  if (isInvoiceDocument(fileName) && isInvoiceProcessorSupported(fileType)) {
    try {
      const { InvoiceProcessor } = await import('@/lib/processors/invoice-processor');
      const processor = new InvoiceProcessor();
      
      const invoiceResult = documentUrl 
        ? await processor.getInvoice({ documentUrl, fileName, fileType })
        : await processor.getInvoice({ 
            documentBuffer: ocrText ? Buffer.from(ocrText) : Buffer.alloc(0), 
            fileName, 
            fileType 
          });
      
      return mapInvoiceToFields(invoiceResult, fieldDefinitions);
    } catch (error) {
      // Fall back to regular extraction
    }
  }

  // Use AI extraction if we have OCR text, otherwise use regex

  console.log('ocrText', ocrText);

  return ocrText && ocrText.length > 10
    ? await extractStructuredDataWithAI(ocrText, fieldDefinitions, fileName)
    : await extractStructuredDataWithRegex(fileName, fieldDefinitions);
}

async function extractTextWithMistral(file: File | Buffer, fileName: string): Promise<string> {
  const { mistral } = await import('@ai-sdk/mistral');
  const { generateText } = await import('ai');
  
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const base64 = buffer.toString('base64');
  const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png';
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
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
            data: dataUrl,
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

async function extractTextWithOpenAI(file: File | Buffer, fileName: string): Promise<string> {
  const { openai } = await import('@ai-sdk/openai');
  const { generateText } = await import('ai');
  
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
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
}

async function extractTextWithTesseract(file: File | Buffer, fileName: string): Promise<string> {
  const Tesseract = await import('tesseract.js');
  
  const { data } = await Tesseract.recognize(file, 'spa+eng');
  return data.text.trim();
}

async function extractTextWithRegex(fileName: string): Promise<string> {
  const patterns = [
    /(\d{4}[-_]\d{2}[-_]\d{2})/g,
    /(\d{2}[-_]\d{2}[-_]\d{4})/g,
    /(\d{2,})/g,
    /(factura|invoice|contrato|contract|plano|blueprint)/gi,
  ];
  
  const extractedParts: string[] = [];
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  
  for (const pattern of patterns) {
    const matches = baseName.match(pattern);
    if (matches) {
      extractedParts.push(...matches);
    }
  }
  
  const docType = getDocumentType(fileName);
  let extractedText = `Documento: ${getDocumentTypeLabel(docType)}\n`;
  extractedText += `Archivo: ${baseName}\n`;
  
  if (extractedParts.length > 0) {
    extractedText += `Información extraída: ${extractedParts.join(', ')}\n`;
  }
  
  return extractedText;
}

function shouldPerformOCR(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp', 'application/pdf'
  ];
  return supportedTypes.includes(fileType.toLowerCase());
}

async function generateDescriptionAndTags(
  ocrText: string,
  fileName: string,
  fileType: string
): Promise<{ description: string; tags: string[] }> {
  if (ocrText && ocrText.length > 20) {
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

        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        const finalText = jsonMatch ? jsonMatch[0] : cleanedText;
        
        const aiResult = JSON.parse(finalText);
        return {
          description: aiResult.description || `Documento: ${fileName}`,
          tags: Array.isArray(aiResult.tags) ? aiResult.tags : [getDocumentType(fileName), 'documento']
        };
      } catch (error) {
        continue;
      }
    }
  }
  
  // Fallback to filename-based generation
  const docType = getDocumentType(fileName);
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  
  const description = `${getDocumentTypeLabel(docType)}: ${baseName}`;
  const tags = [docType, 'documento', 'obra'];
  
  if (fileType.startsWith('image/')) {
    tags.push('imagen');
  } else if (fileType === 'application/pdf') {
    tags.push('pdf');
  }
  
  return { description, tags };
}

async function extractStructuredDataWithAI(
  ocrText: string,
  fieldDefinitions: FieldDefinition[],
  fileName: string
): Promise<Record<string, any>> {
  const fieldsDescription = fieldDefinitions.map(field => 
    `"${field.field_name}" (${field.field_type}): ${field.field_label} - ${field.extraction_pattern}`
  ).join('\n');

  console.log('fieldsDescription', fieldsDescription);
  
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
      temperature: 0.1,
    });

    const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    const finalText = jsonMatch ? jsonMatch[0] : cleanedText;
    
    const aiExtracted = JSON.parse(finalText);
    const extractedData: Record<string, any> = {};
    
    for (const field of fieldDefinitions) {
      let value = aiExtracted[field.field_name];
      
      if (value === null || value === undefined) {
        value = field.default_value || null;
      }
      
      // Type conversion
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
    // Return default values on failure
    const extractedData: Record<string, any> = {};
    for (const field of fieldDefinitions) {
      extractedData[field.field_name] = field.default_value || null;
    }
    return extractedData;
  }
}

async function extractStructuredDataWithRegex(
  fileName: string,
  fieldDefinitions: FieldDefinition[]
): Promise<Record<string, any>> {
  const extractedData: Record<string, any> = {};
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  
  for (const field of fieldDefinitions) {
    let value = null;
    
    if (field.extraction_method === 'regex' || field.extraction_method === 'hybrid') {
      try {
        const regex = new RegExp(field.extraction_pattern, 'gi');
        const matches = baseName.match(regex);
        
        if (matches && matches.length > 0) {
          let match = matches[0];
          
          switch (field.field_type) {
            case 'number':
            case 'currency':
              const numberMatch = match.match(/[\d.,]+/);
              value = numberMatch ? parseFloat(numberMatch[0].replace(',', '.')) : null;
              break;
            case 'date':
              const datePatterns = [
                /(\d{4}[-_]\d{2}[-_]\d{2})/,
                /(\d{2}[-_]\d{2}[-_]\d{4})/,
              ];
              for (const pattern of datePatterns) {
                const dateMatch = match.match(pattern);
                if (dateMatch) {
                  const datePart = dateMatch[1];
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
      } catch (error) {
        // Continue with default value
      }
    }
    
    if (value === null && field.default_value) {
      value = field.default_value;
    }
    
    extractedData[field.field_name] = value;
  }
  
  return extractedData;
}

function calculateConfidence(ocrText: string, ocrProvider: string, description: string): number {
  let confidence = 0;
  
  if (ocrProvider === 'tesseract' && ocrText.length > 50) {
    confidence += 0.6;
  } else if (ocrProvider === 'tesseract' && ocrText.length > 10) {
    confidence += 0.4;
  } else if (ocrProvider === 'all-failed') {
    confidence += 0.1;
  } else {
    confidence += 0.3;
  }
  
  if (description && description.length > 10 && !description.startsWith('Documento:')) {
    confidence += 0.3;
  } else {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

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

function isInvoiceDocument(fileName: string): boolean {
  const name = fileName.toLowerCase();
  return name.includes('factura') || name.includes('invoice') || name.includes('bill');
}

function isInvoiceProcessorSupported(fileType: string): boolean {
  const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  return supportedTypes.includes(fileType.toLowerCase());
}

function mapInvoiceToFields(
  invoiceResult: any,
  fieldDefinitions: FieldDefinition[]
): Record<string, any> {
  const extractedData: Record<string, any> = {};
  
  const fieldMapping: Record<string, string[]> = {
    'invoice_number': ['numero_factura', 'invoice_number', 'numero', 'number'],
    'invoice_date': ['fecha_factura', 'invoice_date', 'fecha', 'date'],
    'due_date': ['fecha_vencimiento', 'due_date', 'vencimiento', 'due'],
    'vendor_name': ['proveedor', 'vendor_name', 'emisor', 'vendor'],
    'customer_name': ['cliente', 'customer_name', 'receptor', 'customer'],
    'total_amount': ['monto_total', 'total_amount', 'total', 'amount'],
    'currency': ['moneda', 'currency', 'divisa'],
    'tax_amount': ['impuesto', 'tax_amount', 'iva', 'tax'],
    'tax_rate': ['tasa_impuesto', 'tax_rate', 'porcentaje_iva', 'tax_rate'],
    'vendor_address': ['direccion_proveedor', 'vendor_address', 'direccion_emisor'],
    'customer_address': ['direccion_cliente', 'customer_address', 'direccion_receptor'],
    'notes': ['notas', 'notes', 'observaciones', 'comments'],
    'payment_instructions': ['instrucciones_pago', 'payment_instructions', 'forma_pago'],
  };
  
  for (const field of fieldDefinitions) {
    let value = null;
    
    for (const [invoiceField, possibleNames] of Object.entries(fieldMapping)) {
      if (possibleNames.some(name => 
        field.field_name.toLowerCase().includes(name) || 
        field.field_label.toLowerCase().includes(name)
      )) {
        value = invoiceResult[invoiceField];
        break;
      }
    }
    
    if (value !== null && value !== undefined) {
      switch (field.field_type) {
        case 'number':
        case 'currency':
          value = typeof value === 'number' ? value : parseFloat(value) || null;
          break;
        case 'boolean':
          value = Boolean(value);
          break;
        case 'date':
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            value = value;
          } else {
            value = null;
          }
          break;
        default:
          value = value ? String(value) : null;
      }
    }
    
    if (value === null && field.default_value) {
      value = field.default_value;
    }
    
    extractedData[field.field_name] = value;
  }
  
  return extractedData;
}