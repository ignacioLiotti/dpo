# OCR + AI Document Processing Setup

This guide explains how to set up the OCR and AI-powered document processing functionality in your DPO project.

## Overview

The system supports multiple OCR providers with AI fallback for maximum accuracy:

1. **Azure Document Intelligence** (Recommended for production)
2. **OpenAI Vision API** (Great for AI-powered extraction)
3. **Tesseract.js** (Free, client-side fallback)

## Required Dependencies

Add these dependencies to your `package.json`:

```bash
npm install tesseract.js
# or
yarn add tesseract.js
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Azure Document Intelligence (Optional but recommended)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-region.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-azure-key

# OpenAI API (Optional but recommended for AI enhancement)
OPENAI_API_KEY=your-openai-api-key
```

## Provider Setup

### 1. Azure Document Intelligence (Recommended)

**Best for:** Production environments, high accuracy, multi-page PDFs

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a "Document Intelligence" resource
3. Copy the endpoint and key to your environment variables
4. Supports: PDF, images, forms, tables

**Pricing:** Pay-per-use, ~$1.50 per 1000 pages

### 2. OpenAI Vision API

**Best for:** AI-powered data extraction, complex documents

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add to your environment variables
3. Uses GPT-4o-mini with vision capabilities

**Pricing:** ~$0.01 per image/page

### 3. Tesseract.js (Always Available)

**Best for:** Fallback, offline processing, development

- No setup required
- Runs in the browser
- Free and open source
- Lower accuracy than cloud services

## How It Works

### Automatic Provider Selection

The system automatically selects the best available provider:

1. **Azure** (if configured) - Highest accuracy
2. **OpenAI Vision** (if configured) - Best AI extraction
3. **Tesseract.js** (always available) - Fallback

### AI Enhancement

When OCR confidence is below 70%, the system automatically:

1. Sends the raw text to OpenAI for enhancement
2. Extracts structured data using AI
3. Returns improved results with higher confidence

### Document Type Detection

The system automatically detects and processes:

- **Contracts** → Extracts amounts, dates, parties, work description
- **Invoices** → Extracts totals, vendor info, line items
- **Permits** → Extracts permit numbers, dates, authorities
- **Blueprints** → Extracts technical specifications

## Usage Examples

### Basic Document Upload

```typescript
import { DocumentClient } from '@/lib/processors/document/document-client';

// Process any document
const client = await DocumentClient.createFromFile(file, fileName, fileType);
const result = await client.processDocument({
  file,
  fileName,
  contentType: fileType,
  context: { userId: 'user-id', timestamp: new Date() }
});

console.log('Extracted data:', result.data?.extractedData);
```

### Contract Processing

```typescript
import { ocrService } from '@/lib/processors/document/ocr-service';

// Direct OCR processing
const ocrResult = await ocrService.processDocument(file, 'contract', {
  language: 'spa+eng', // Spanish + English
  extractTables: true
});

console.log(`Provider: ${ocrResult.provider}`);
console.log(`Confidence: ${ocrResult.confidence}`);
console.log(`Extracted text: ${ocrResult.text}`);
```

## Supported File Types

- **PDF** documents (multi-page supported)
- **Images**: JPEG, PNG, TIFF, BMP
- **Office**: DOC, DOCX (converted to PDF first)
- **CAD**: DWG, DXF (for blueprints)

## Performance Tips

1. **File Size**: Keep files under 20MB for best performance
2. **Image Quality**: Higher resolution = better OCR accuracy
3. **Language**: Specify language for better results
4. **Caching**: Results are cached to avoid re-processing

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const result = await ocrService.processDocument(file, 'contract');
  if (result.confidence < 0.5) {
    console.warn('Low confidence result, manual review recommended');
  }
} catch (error) {
  console.error('OCR processing failed:', error.message);
  // Fallback to manual data entry
}
```

## Development vs Production

### Development
- Tesseract.js works out of the box
- No API keys required
- Good for testing and development

### Production
- Set up Azure Document Intelligence for best accuracy
- Add OpenAI API key for AI enhancement
- Monitor usage and costs

## Cost Estimation

For 1000 documents per month:

- **Azure**: ~$1.50/month
- **OpenAI**: ~$10/month (if used for all documents)
- **Tesseract**: Free

## Troubleshooting

### Common Issues

1. **"No OCR providers available"**
   - Check environment variables
   - Ensure Tesseract.js is installed

2. **Low accuracy results**
   - Improve image quality
   - Use Azure instead of Tesseract
   - Enable AI enhancement

3. **API rate limits**
   - Implement request queuing
   - Use multiple API keys
   - Cache results

### Debug Mode

Enable debug logging:

```typescript
// Set in your environment
DEBUG=ocr:*
```

## Security Considerations

- API keys should be server-side only
- Consider data residency requirements
- Implement rate limiting
- Log processing for audit trails

## Next Steps

1. Install dependencies: `npm install tesseract.js`
2. Add environment variables
3. Test with sample documents
4. Monitor accuracy and costs
5. Implement caching if needed

The OCR system is now ready to automatically extract data from your construction documents! 