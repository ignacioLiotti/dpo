import { Suspense } from 'react';
import { OCRPlayground } from '@/components/playground/ocr-playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Eye, FileText } from 'lucide-react';

// Loading component
function PlaygroundSkeleton() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <div className="h-10 w-96 bg-muted animate-pulse rounded" />
        <div className="h-6 w-64 bg-muted animate-pulse rounded" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto py-10">
      <Suspense fallback={<PlaygroundSkeleton />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OCR + AI Playground
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test document processing capabilities with real OCR providers and AI enhancement
            </p>
          </div>

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-sm">
                  <Eye className="w-4 h-4" />
                  OCR Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-blue-600">
                  Extract text from PDFs and images using multiple providers
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700 text-sm">
                  <Brain className="w-4 h-4" />
                  AI Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-purple-600">
                  Improve accuracy and extract structured data with AI
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700 text-sm">
                  <FileText className="w-4 h-4" />
                  Document Types
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-green-600">
                  Contracts, invoices, permits, and blueprints
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-700 text-sm">
                  <Zap className="w-4 h-4" />
                  Real-time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-yellow-600">
                  Instant processing with confidence scoring
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Providers</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure API keys in environment variables for better accuracy
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Tesseract.js</h4>
                    <p className="text-xs text-muted-foreground">Free, client-side OCR</p>
                  </div>
                  <Badge variant="default">Always Available</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Azure Document Intelligence</h4>
                    <p className="text-xs text-muted-foreground">High accuracy, production-grade</p>
                  </div>
                  <Badge variant={process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "default" : "secondary"}>
                    {process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">OpenAI Vision</h4>
                    <p className="text-xs text-muted-foreground">AI-powered extraction</p>
                  </div>
                  <Badge variant={process.env.OPENAI_API_KEY ? "default" : "secondary"}>
                    {process.env.OPENAI_API_KEY ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Playground */}
          <OCRPlayground />
        </div>
      </Suspense>
    </div>
  );
} 