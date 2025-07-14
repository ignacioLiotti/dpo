'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Play, Bug } from 'lucide-react';
import { toast } from 'sonner';

export function ProcessingDebug() {
  const [documentId, setDocumentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueData, setQueueData] = useState<any>(null);
  const [processResult, setProcessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/processing-queue');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch queue status');
      }
      
      setQueueData(result.data);
      toast.success('Queue status fetched successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const manualProcess = async () => {
    if (!documentId.trim()) {
      toast.error('Please enter a document ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/manual-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: documentId.trim()
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process document');
      }
      
      setProcessResult(result);
      toast.success('Document processed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    if (!documentId.trim()) {
      toast.error('Please enter a document ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/processing-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: documentId.trim(),
          processingType: 'basic'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test edge function');
      }
      
      setProcessResult(result);
      toast.success('Edge function test completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fixQueue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/fix-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fix queue');
      }
      
      setProcessResult(result);
      toast.success('Queue analysis and fix completed');
      
      // Refresh queue status after fix
      await fetchQueueStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const processAllPending = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/process-all-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process all pending');
      }
      
      setProcessResult(result);
      toast.success(`Processed ${result.stats?.total || 0} jobs: ${result.stats?.successful || 0} successful, ${result.stats?.failed || 0} failed`);
      
      // Refresh queue status after processing
      await fetchQueueStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testSave = async () => {
    if (!documentId.trim()) {
      toast.error('Please enter a document ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/test-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: documentId.trim()
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test save');
      }
      
      setProcessResult(result);
      toast.success('Save test completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Document Processing Debug
          </CardTitle>
          <CardDescription>
            Debug tools for testing document processing and extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Document ID Input */}
          <div className="space-y-2">
            <Label htmlFor="documentId">Document ID</Label>
            <Input
              id="documentId"
              placeholder="Enter document UUID"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={fetchQueueStatus}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check Queue Status
            </Button>
            
            <Button 
              onClick={processAllPending}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Process All Pending
            </Button>
            
            <Button 
              onClick={fixQueue}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
              Fix Queue Issues
            </Button>
            
            <Button 
              onClick={manualProcess}
              disabled={isLoading || !documentId.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Manual Process
            </Button>
            
            <Button 
              onClick={testSave}
              disabled={isLoading || !documentId.trim()}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Save
            </Button>
            
            <Button 
              onClick={testEdgeFunction}
              disabled={isLoading || !documentId.trim()}
              variant="secondary"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Edge Function
            </Button>
          </div>

          <Separator />

          {/* Queue Status */}
          {queueData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Queue Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recent Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queueData.recentFiles?.length > 0 ? (
                      <div className="space-y-2">
                        {queueData.recentFiles.map((file: any) => (
                          <div key={file.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{file.name}</span>
                            <Badge variant={file.processing_status === 'completed' ? 'default' : 'secondary'}>
                              {file.processing_status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No recent files</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Processing Queue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queueData.queue?.length > 0 ? (
                      <div className="space-y-2">
                        {queueData.queue.map((job: any) => (
                          <div key={job.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{job.files?.name || 'Unknown'}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.priority === 'high' ? 'destructive' : 'secondary'}>
                                {job.priority}
                              </Badge>
                              <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No queued jobs</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pending Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  {queueData.pendingJobs?.length > 0 ? (
                    <div className="space-y-2">
                      {queueData.pendingJobs.map((job: any) => (
                        <div key={job.queue_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{job.file_name}</span>
                          <div className="flex items-center gap-2">
                            <Badge>{job.processing_type}</Badge>
                            <Badge variant="secondary">{job.priority}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No pending jobs</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Process Result */}
          {processResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Processing Result
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Document ID</Badge>
                  <code className="text-sm">{processResult.result?.documentId}</code>
                </div>
                
                {processResult.result?.hasExtraction && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Extraction Enabled</Badge>
                    <span className="text-sm">Folder: {processResult.result?.folderName}</span>
                  </div>
                )}
                
                {processResult.result?.analysis && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Description:</strong> {processResult.result.analysis.ai_description}
                        </div>
                        <div>
                          <strong>Category:</strong> {processResult.result.analysis.ai_category}
                        </div>
                        <div>
                          <strong>Tags:</strong> {processResult.result.analysis.ai_tags?.join(', ')}
                        </div>
                        <div>
                          <strong>Confidence:</strong> {Math.round(processResult.result.analysis.confidence_score * 100)}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Full Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={JSON.stringify(processResult, null, 2)}
                      readOnly
                      className="font-mono text-xs"
                      rows={10}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}