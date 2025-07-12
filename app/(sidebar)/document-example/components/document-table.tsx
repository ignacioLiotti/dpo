'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, PRIORITY_LEVELS } from '../types';
import type { ExampleDocument } from '../types';

interface DocumentTableProps {
  documents: ExampleDocument[];
}

export function DocumentTable({ documents }: DocumentTableProps) {
  const getStatusColor = (status: string) => {
    const statusConfig = DOCUMENT_STATUSES.find(s => s.id === status);
    return statusConfig?.color || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.id === priority);
    return priorityConfig?.color || 'gray';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || '📄';
  };

  const getCategoryName = (categoryId: string) => {
    const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Documents
          <span className="text-sm font-normal text-muted-foreground">
            {documents.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the "New Document" button above to create your first document
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{document.title}</div>
                        {document.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(document.category)}</span>
                        <span className="text-sm">{getCategoryName(document.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${getStatusColor(document.status) === 'green' ? 'border-green-500 text-green-700' : 
                          getStatusColor(document.status) === 'yellow' ? 'border-yellow-500 text-yellow-700' : 
                          'border-gray-500 text-gray-700'}`}
                      >
                        {document.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${getPriorityColor(document.priority) === 'red' ? 'border-red-500 text-red-700' : 
                          getPriorityColor(document.priority) === 'orange' ? 'border-orange-500 text-orange-700' : 
                          'border-blue-500 text-blue-700'}`}
                      >
                        {document.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {document.due_date ? formatDate(document.due_date) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(document.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/document-example/${document.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/document-example/${document.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}