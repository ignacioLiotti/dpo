'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Eye, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  Trash2,
  RotateCcw,
  Settings,
  BarChart3,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Copy,
  ExternalLink
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
    originalConfidence?: number;
  };
}

interface ProcessingSession {
  id: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  result: OCRResult;
  timestamp: Date;
}

const DOCUMENT_TYPES = [
  { id: 'auto', label: 'Auto-detect', icon: Brain },
  { id: 'contract', label: 'Contract', icon: FileText },
  { id: 'invoice', label: 'Invoice', icon: FileSpreadsheet },
  { id: 'permit', label: 'Permit', icon: FileCode },
  { id: 'blueprint', label: 'Blueprint', icon: FileImage },
  { id: 'generic', label: 'Generic', icon: FileText },
];

const SAMPLE_DOCUMENTS = [
  {
    name: 'Sample Contract',
    type: 'contract',
    description: 'Construction contract with amounts and dates',
    url: '/samples/sample-contract.pdf'
  },
  {
    name: 'Sample Invoice',
    type: 'invoice', 
    description: 'Construction invoice with line items',
    url: '/samples/sample-invoice.pdf'
  },
  {
    name: 'Sample Permit',
    type: 'permit',
    description: 'Building permit with authority info',
    url: '/samples/sample-permit.pdf'
  }
];

export function OCRPlayground() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('auto');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ProcessingSession[]>([]);
  const [activeSession, setActiveSession] = useState<ProcessingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    // Get available OCR providers
    const providers = ocrService.getAvailableProviders();
    setAvailableProviders(providers);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      // Auto-detect document type if set to auto
      if (selectedDocumentType === 'auto') {
        const fileName = file.name.toLowerCase();
        if (fileName.includes('contrato') || fileName.includes('contract')) {
          setSelectedDocumentType('contract');
        } else if (fileName.includes('factura') || fileName.includes('invoice')) {
          setSelectedDocumentType('invoice');
        } else if (fileName.includes('permiso') || fileName.includes('permit')) {
          setSelectedDocumentType('permit');
        } else {
          setSelectedDocumentType('generic');
        }
      }
    }
  }, [selectedDocumentType]);

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const documentType = selectedDocumentType === 'auto' ? 'generic' : selectedDocumentType;
      
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

      // Create new session
      const newSession: ProcessingSession = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        documentType,
        result: ocrResult,
        timestamp: new Date()
      };

      setSessions(prev => [newSession, ...prev.slice(0, 9)]); // Keep last 10 sessions
      setActiveSession(newSession);
      
      toast.success(`Documento procesado con ${ocrResult.provider} (${Math.round(ocrResult.confidence * 100)}% confianza)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(`Error procesando documento: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSession = () => {
    setSelectedFile(null);
    setActiveSession(null);
    setError(null);
    setSelectedDocumentType('auto');
  };

  const clearAllSessions = () => {
    setSessions([]);
    setActiveSession(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const downloadResult = (session: ProcessingSession) => {
    const data = {
      fileName: session.fileName,
      documentType: session.documentType,
      result: session.result,
      timestamp: session.timestamp
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${session.fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Control Panel
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              {sessions.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllSessions}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {DOCUMENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant={selectedDocumentType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDocumentType(type.id)}
                    className="flex flex-col gap-1 h-auto py-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Document</label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-playground"
              />
              <label htmlFor="file-upload-playground" className="cursor-pointer block">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, images, Word documents supported
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedDocumentType}
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

          {/* Sample Documents */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or try sample documents</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <Button
                  key={sample.name}
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-1 h-auto py-2 text-left"
                  onClick={() => {
                    toast.info('Sample documents feature coming soon!');
                  }}
                >
                  <span className="font-medium text-xs">{sample.name}</span>
                  <span className="text-xs text-muted-foreground">{sample.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(activeSession || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Processing Error:</strong> {error}
                </AlertDescription>
              </Alert>
            ) : activeSession ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="text">Extracted Text</TabsTrigger>
                  <TabsTrigger value="data">Structured Data</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{activeSession.result.provider}</p>
                      <p className="text-xs text-muted-foreground">OCR Provider</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className={`text-2xl font-bold ${getConfidenceColor(activeSession.result.confidence)}`}>
                        {Math.round(activeSession.result.confidence * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {formatDuration(activeSession.result.metadata.processingTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">Processing Time</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {activeSession.result.metadata.pageCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Pages</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Confidence Breakdown</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Overall Confidence</span>
                        <span className={getConfidenceColor(activeSession.result.confidence)}>
                          {Math.round(activeSession.result.confidence * 100)}%
                        </span>
                      </div>
                      <Progress value={activeSession.result.confidence * 100} className="h-2" />
                      {activeSession.result.metadata.aiEnhanced && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Brain className="w-3 h-3" />
                          AI Enhanced (Original: {Math.round((activeSession.result.metadata.originalConfidence || 0) * 100)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Extracted Text</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(activeSession.result.text)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {activeSession.result.text}
                    </pre>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeSession.result.text.length} characters extracted
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  {activeSession.result.extractedData ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Structured Data</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(activeSession.result.extractedData, null, 2))}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy JSON
                        </Button>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-auto">
                        <pre className="text-xs font-mono">
                          {JSON.stringify(activeSession.result.extractedData, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No structured data extracted</p>
                      <p className="text-xs">Try uploading a contract, invoice, or permit for structured extraction</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">File Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Name:</span>
                          <span className="font-mono">{activeSession.fileName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Size:</span>
                          <span>{formatFileSize(activeSession.fileSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Document Type:</span>
                          <Badge variant="outline">{activeSession.documentType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed:</span>
                          <span>{activeSession.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Processing Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provider:</span>
                          <span>{activeSession.result.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <span>{activeSession.result.metadata.language || 'Auto-detected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pages:</span>
                          <span>{activeSession.result.metadata.pageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AI Enhanced:</span>
                          <Badge variant={activeSession.result.metadata.aiEnhanced ? "default" : "secondary"}>
                            {activeSession.result.metadata.aiEnhanced ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadResult(activeSession)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Processing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeSession?.id === session.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveSession(session)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{session.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.documentType} • {session.result.provider} • {session.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getConfidenceBadge(session.result.confidence)}>
                      {Math.round(session.result.confidence * 100)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadResult(session);
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Providers</CardTitle>
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
                No providers available
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Configure Azure Document Intelligence or OpenAI API keys for better accuracy
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 