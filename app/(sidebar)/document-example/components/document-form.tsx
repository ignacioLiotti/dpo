'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES, PRIORITY_LEVELS } from '../types';
import type { ExampleDocument } from '../types';

interface DocumentFormProps {
  document?: ExampleDocument;
  action: (formData: FormData) => Promise<void>;
  actionLabel: string;
}

export function DocumentForm({ document, action, actionLabel }: DocumentFormProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{document ? 'Edit Document' : 'Create New Document'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {document && (
            <input type="hidden" name="id" value={document.id} />
          )}
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={document?.title}
              placeholder="Enter document title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={document?.description || ''}
              placeholder="Brief description of the document"
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={document?.content || ''}
              placeholder="Document content"
              rows={8}
            />
          </div>

          {/* Category and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue={document?.category}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select category</option>
                {DOCUMENT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={document?.status || 'draft'}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {DOCUMENT_STATUSES.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={document?.priority || 'medium'}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
                defaultValue={document?.due_date ? new Date(document.due_date).toISOString().slice(0, 16) : ''}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={document?.tags?.join(', ')}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {actionLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}