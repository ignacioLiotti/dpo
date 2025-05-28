'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Eye, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { ocrService } from '@/lib/processors/document/ocr-service';

interface OCRResult {
  text: string;
  confidence: number;
  provider: string;
  extractedData?: any;
  metadata: {
    processingTime: number;
    pageCount: number;
    language?: string;
    aiEnhanced?: boolean;
  };
}

export function OCRDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  React.useEffect(() => {
    // Get available OCR providers
    const providers = ocrService.getAvailableProviders();
    setAvailableProviders(providers);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Detect document type from filename
      const fileName = selectedFile.name.toLowerCase();
      let documentType = 'generic';
      
      if (fileName.includes('contrato') || fileName.includes('contract')) {
        documentType = 'contract';
      } else if (fileName.includes('factura') || fileName.includes('invoice')) {
        documentType = 'invoice';
      } else if (fileName.includes('permiso') || fileName.includes('permit')) {
        documentType = 'permit';
      }

      console.log(`Processing ${documentType} document: ${selectedFile.name}`);

      const ocrResult = await ocrService.processDocument(
        selectedFile,
        documentType,
        {
          language: 'spa+eng',
          extractTables: true,
          enhanceQuality: true
        }
      );

      setResult(ocrResult);
      toast.success(`Documento procesado con ${ocrResult.provider} (${Math.round(ocrResult.confidence * 100)}% confianza)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(`Error procesando documento: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Brain className="w-6 h-6" />
            OCR + AI Document Processing Demo
          </CardTitle>
          <p className="text-blue-600">
            Upload construction documents to see automatic data extraction in action
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm">OCR Text Extraction</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm">AI Data Parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Auto Form Population</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available OCR Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableProviders.map((provider) => (
              <Badge key={provider} variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {provider}
              </Badge>
            ))}
            {availableProviders.length === 0 && (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                No providers configured
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Configure Azure Document Intelligence or OpenAI API keys for better accuracy
          </p>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to upload document</p>
              <p className="text-xs text-muted-foreground">
                PDF, images, Word documents supported
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                onClick={processDocument}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Process
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Processing Results
              </span>
              <Badge variant={getConfidenceBadge(result.confidence)}>
                {Math.round(result.confidence * 100)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Provider</p>
                <p>{result.provider}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Processing Time</p>
                <p>{result.metadata.processingTime}ms</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Pages</p>
                <p>{result.metadata.pageCount}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">AI Enhanced</p>
                <p>{result.metadata.aiEnhanced ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <Separator />

            {/* Confidence Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium">Confidence Score</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Overall</span>
                  <span className={getConfidenceColor(result.confidence)}>
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <Progress value={result.confidence * 100} className="h-2" />
              </div>
            </div>

            {/* Extracted Data */}
            {result.extractedData && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Extracted Structured Data</h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.extractedData, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Raw Text */}
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Extracted Text</h4>
              <div className="bg-muted/50 p-3 rounded-lg max-h-60 overflow-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {result.text.substring(0, 1000)}
                  {result.text.length > 1000 && '...'}
                </p>
              </div>
              {result.text.length > 1000 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 1000 characters of {result.text.length} total
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Processing Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm">How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Upload a construction document (contract, invoice, permit)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>Click "Process" to run OCR + AI extraction</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>Review extracted text and structured data</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>Data would automatically populate form fields in real usage</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 