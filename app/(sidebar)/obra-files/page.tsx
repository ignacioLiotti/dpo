import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ObraFilesClientWrapper } from './components/client-wrapper';
import { getObraDocumentsWithFolders, getObraFolders } from './actions/document-actions';

interface ObraFilesPageProps {
  searchParams: {
    obra_id?: string;
    search?: string;
    category?: string;
    folder?: string;
  };
}

function ObraFilesPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="lg:col-span-3 h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export default async function ObraFilesPage({ searchParams }: ObraFilesPageProps) {
  const obraId = searchParams.obra_id;
  
  if (!obraId) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Obra Files Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please provide an obra_id parameter to view files for a specific obra.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Example: /obra-files?obra_id=your-obra-id
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch documents and folders for the obra
  const [documentsResult, foldersResult] = await Promise.all([
    getObraDocumentsWithFolders(obraId),
    getObraFolders(obraId)
  ]);

  const documents = documentsResult.documents || [];
  const folders = foldersResult.folders || [];

  // Server-side filtering
  let filteredDocuments = documents;

  // Apply search filter
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    filteredDocuments = filteredDocuments.filter(doc =>
      doc.name.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower))
    );
  }

  // Apply category filter
  if (searchParams.category) {
    filteredDocuments = filteredDocuments.filter(doc =>
      doc.category === searchParams.category
    );
  }

  // Get current folder
  const currentFolder = searchParams.folder
    ? folders.find(f => f.id === searchParams.folder) || null
    : null;

  // Filter documents by folder
  if (currentFolder) {
    filteredDocuments = filteredDocuments.filter(doc =>
      doc.folder_id === currentFolder.id
    );
  } else {
    // When not in a folder, show documents that are not in any folder
    filteredDocuments = filteredDocuments.filter(doc => !doc.folder_id);
  }

  // Calculate folder document counts
  const folderCounts = folders.reduce((acc, folder) => {
    acc[folder.id] = documents.filter(doc => doc.folder_id === folder.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full max-w-full h-full overflow-y-hidden">
      <Suspense fallback={<ObraFilesPageSkeleton />}>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Obra Files</h1>
                <p className="text-muted-foreground">
                  Document management for obra {obraId}
                </p>
              </div>
            </div>

            {documentsResult.error || foldersResult.error ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Error al cargar documentos</h3>
                    <p className="text-muted-foreground">
                      {documentsResult.error || foldersResult.error}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ObraFilesClientWrapper
                obraId={obraId}
                searchParams={searchParams}
                documents={filteredDocuments}
                folders={folders}
                currentFolder={currentFolder}
                folderCounts={folderCounts}
              />
            )}
          </div>
        </div>
      </Suspense>
    </div>
  );
}