import { Mistral } from '@mistralai/mistralai';

export async function extractTextWithMistralUrl(
  documentUrl: string,
  fileName: string
): Promise<string> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

  try {
    let documentPayload: 
      | { type: 'document_url'; documentUrl: string }
      | { type: 'file'; fileId: string };

    if (documentUrl.startsWith('https://')) {
      documentPayload = { type: 'document_url', documentUrl };
    } else {
      const response = await fetch(documentUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const { id: fileId } = await client.files.upload({
        file: { fileName, content: buffer },
        purpose: "ocr",
      });

      const { url: signedUrl } = await client.files.getSignedUrl({ fileId });
      documentPayload = { type: "document_url", documentUrl: signedUrl };
    }

    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: documentPayload,
      includeImageBase64: false,
    });

    const text = ocrResponse.pages
      .map((page) => page.markdown.trim())
      .join('\n\n')
      .trim();
    
    return text;
  } catch (error) {
    throw new Error(
      `Mistral URL OCR failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function extractTextWithOpenAIUrl(
  documentUrl: string,
  fileName: string
): Promise<string> {
  try {
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return only the text content, preserving structure and formatting. Focus on readable text, numbers, and important details.'
            },
            {
              type: 'image',
              image: documentUrl
            }
          ]
        }
      ],
      temperature: 0.1
    });

    return text.trim();
  } catch (error) {
    throw new Error(
      `OpenAI URL OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
