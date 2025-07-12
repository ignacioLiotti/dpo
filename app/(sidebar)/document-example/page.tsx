import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DocumentTable } from './components/document-table';
import { CreateDocumentSheet } from './components/create-document-sheet';
import { getAllExampleDocuments, searchExampleDocuments } from './actions/document-actions';
import { createExampleDocumentForSheet } from './actions/sheet-actions';

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

function DocumentListSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

export default async function DocumentExamplePage({ searchParams }: PageProps) {
  const { search } = await searchParams;

  // Get documents based on search
  const documents = search
    ? await searchExampleDocuments(search)
    : await getAllExampleDocuments();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Example</h1>
          <p className="text-muted-foreground">
            Manage your documents with a simple CRUD interface
          </p>
        </div>
        <CreateDocumentSheet createAction={createExampleDocumentForSheet} />
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <form method="GET" action="/document-example">
            <Input
              name="search"
              placeholder="Search documents..."
              defaultValue={search}
              className="pl-8"
            />
          </form>
        </div>
        {search && (
          <Link href="/document-example">
            <Button variant="outline" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </div>

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-muted-foreground">
          {documents.length} result{documents.length !== 1 ? 's' : ''} for "{search}"
        </div>
      )}

      {/* Documents Table */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentTable documents={documents} />
      </Suspense>
    </div>
  );
}