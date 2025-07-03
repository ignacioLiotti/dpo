'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { VaultFile } from '../../hooks/vault/useVault';
import { DataExtractionPreview } from './DataExtractionPreview';

interface ImagePreviewWithOCRProps {
  file: VaultFile;
  obraId: string;
  isOpen: boolean;
  onClose: () => void;
  onOCRComplete?: (ocrText: string) => void;
}

export const ImagePreviewWithOCR: React.FC<ImagePreviewWithOCRProps> = ({
  file,
  obraId,
  isOpen,
  onClose,
  onOCRComplete
}) => {
  const [ocrText, setOcrText] = useState<string>(file.ocr_content || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDataExtraction, setShowDataExtraction] = useState(false);

  // Load image URL when dialog opens
  useEffect(() => {
    const loadImageUrl = async () => {
      if (!isOpen || !file.type.startsWith('image/')) return;
      
      try {
        const supabase = (await import('../../supabase/client')).supabase;
        
        console.log('Loading image for file:', file.name);
        console.log('File path array:', file.path);
        console.log('Joined path:', file.path.join('/'));
        
        // First check if file exists in storage
        const { data: fileList, error: listError } = await supabase.storage
          .from('obra-vault')
          .list(file.path[0]); // List files in the obra folder

        console.log('File list in obra folder:', fileList);
        console.log('Looking for file:', file.path[1]);

        if (listError) {
          console.error('Error listing files:', listError);
          setError(`Failed to list files: ${listError.message}`);
          return;
        }

        const fileExists = fileList?.some(f => f.name === file.path[1]);
        console.log('File exists in storage:', fileExists);

        if (!fileExists) {
          setError('File not found in storage. It may not have been uploaded correctly.');
          return;
        }

        const { data: urlData, error: urlError } = await supabase.storage
          .from('obra-vault')
          .createSignedUrl(file.path.join('/'), 3600);
        
        console.log('Signed URL result:', { urlData, urlError });
        
        if (urlError || !urlData?.signedUrl) {
          console.error('Failed to get image URL:', urlError);
          setError(`Failed to load image: ${urlError?.message || 'Unknown error'}`);
          return;
        }
        
        console.log('Generated signed URL:', urlData.signedUrl);
        setImageUrl(urlData.signedUrl);
      } catch (err) {
        console.error('Error loading image URL:', err);
        setError('Failed to load image');
      }
    };

    loadImageUrl();
  }, [isOpen, file]);

  const processOCR = useCallback(async () => {
    if (!file.type.startsWith('image/') || !imageUrl) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Dynamic import of Tesseract for client-side OCR
      const Tesseract = await import('tesseract.js');
      
      const { data } = await Tesseract.recognize(
        imageUrl,
        'spa+eng', // Spanish + English
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const extractedText = data.text.trim();
      setOcrText(extractedText);
      onOCRComplete?.(extractedText);
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  }, [file, onOCRComplete, imageUrl]);

  const isImage = file.type.startsWith('image/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📄</span>
            {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            {isImage ? (
              <div className="border rounded-lg overflow-hidden">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={file.name}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      setError('Failed to load image');
                    }}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <div className="animate-pulse">Loading image...</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-500">Preview not available for this file type</p>
              </div>
            )}

            {/* File Info */}
            <div className="text-sm text-gray-600">
              <p><strong>Type:</strong> {file.type}</p>
              <p><strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB</p>
              <p><strong>Upload Date:</strong> {new Date(file.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* OCR Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Extracted Text (OCR)</h3>
              {isImage && (
                <Button 
                  onClick={processOCR}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                >
                  {isProcessing ? 'Processing...' : 'Extract Text'}
                </Button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-700">Processing image with OCR...</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder={isImage ? "Click 'Extract Text' to process this image..." : "OCR not available for this file type"}
                className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
                readOnly={!isImage}
              />
              
              {ocrText && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {ocrText.length} characters extracted
                  </div>
                  <Button
                    onClick={() => setShowDataExtraction(true)}
                    disabled={!ocrText.trim()}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    📊 Extract Data
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={file.description || ''}
                placeholder="Add a description for this document..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none text-sm"
                readOnly
              />
            </div>

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {file.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Data Extraction Preview Dialog */}
      <DataExtractionPreview
        documentId={file.id}
        obraId={obraId}
        folderName={file.folder || 'Sin Clasificar'}
        ocrText={ocrText}
        fileName={file.name}
        fileType={file.type}
        isOpen={showDataExtraction}
        onClose={() => setShowDataExtraction(false)}
        onDataSaved={() => {
          setShowDataExtraction(false);
          // Could trigger a refresh here if needed
        }}
      />
    </Dialog>
  );
};