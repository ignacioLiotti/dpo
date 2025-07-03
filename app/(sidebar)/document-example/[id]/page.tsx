import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft } from 'lucide-react';
import { getExampleDocumentById, deleteExampleDocument } from '../actions/document-actions';
import { DeleteDocumentButton } from '../components/delete-document-button';
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, PRIORITY_LEVELS } from '../types';

interface PageProps {
  params: { id: string };
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const document = await getExampleDocumentById(id);

  if (!document) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    const statusConfig = DOCUMENT_STATUSES.find(s => s.id === status);
    return statusConfig?.color || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.id === priority);
    return priorityConfig?.color || 'gray';
  };

  const getCategoryInfo = (categoryId: string) => {
    const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
    return category || { icon: '📄', name: categoryId };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const categoryInfo = getCategoryInfo(document.category);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/document-example">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">
              Created {formatDate(document.created_at)}
              {document.updated_at !== document.created_at && (
                <span> • Updated {formatDate(document.updated_at)}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/document-example/${document.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteDocumentButton 
            documentId={document.id} 
            documentTitle={document.title}
            deleteAction={deleteExampleDocument}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {document.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{document.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              {document.content ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{document.content}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No content provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <div className="flex items-center gap-2 mt-1">
                  <span>{categoryInfo.icon}</span>
                  <span>{categoryInfo.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge 
                    variant="outline"
                    className={`${getStatusColor(document.status) === 'green' ? 'border-green-500 text-green-700' : 
                      getStatusColor(document.status) === 'yellow' ? 'border-yellow-500 text-yellow-700' : 
                      'border-gray-500 text-gray-700'}`}
                  >
                    {document.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <div className="mt-1">
                  <Badge 
                    variant="outline"
                    className={`${getPriorityColor(document.priority) === 'red' ? 'border-red-500 text-red-700' : 
                      getPriorityColor(document.priority) === 'orange' ? 'border-orange-500 text-orange-700' : 
                      'border-blue-500 text-blue-700'}`}
                  >
                    {document.priority}
                  </Badge>
                </div>
              </div>

              {document.due_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="mt-1">{formatDate(document.due_date)}</p>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(document.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{formatDate(document.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}