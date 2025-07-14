'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase/client';
import { Clock, CheckCircle, AlertCircle, Bot, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessingJob {
  id: string;
  file_id: string;
  file_name: string;
  processing_type: string;
  priority: string;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export function ProcessingQueueDashboard() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueData = async () => {
    try {
      const supabase = createClient();
      
      // Get recent processing jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('processing_queue')
        .select(`
          id,
          file_id,
          processing_type,
          priority,
          status,
          attempts,
          max_attempts,
          error_message,
          scheduled_at,
          started_at,
          completed_at,
          created_at,
          updated_at,
          files (
            name
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (jobsError) {
        throw new Error(jobsError.message);
      }

      // Transform the data
      const processedJobs: ProcessingJob[] = jobsData?.map(job => ({
        ...job,
        file_name: job.files?.name || 'Unknown file',
      })) || [];

      setJobs(processedJobs);

      // Calculate stats
      const newStats: QueueStats = {
        pending: processedJobs.filter(j => j.status === 'pending').length,
        processing: processedJobs.filter(j => j.status === 'processing').length,
        completed: processedJobs.filter(j => j.status === 'completed').length,
        failed: processedJobs.filter(j => j.status === 'failed').length,
        total: processedJobs.length,
      };

      setStats(newStats);
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Set up real-time subscription
    const supabase = createClient();
    const subscription = supabase
      .channel('processing-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_queue',
        },
        (payload) => {
          console.log('Queue update:', payload);
          fetchQueueData(); // Refetch data
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-green-100 text-green-800';
      case 'ocr-only':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading queue status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Processing Jobs</CardTitle>
              <CardDescription>
                Latest 50 document processing jobs
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueueData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No processing jobs found
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium text-sm">{job.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(job.priority)}
                        >
                          {job.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getProcessingTypeColor(job.processing_type)}
                        >
                          {job.processing_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(job.updated_at)}
                    </p>
                    {job.status === 'failed' && job.attempts > 0 && (
                      <p className="text-xs text-red-500">
                        Attempts: {job.attempts}/{job.max_attempts}
                      </p>
                    )}
                    {job.error_message && (
                      <p className="text-xs text-red-500 max-w-xs truncate">
                        Error: {job.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}