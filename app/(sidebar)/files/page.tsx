import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileErrorBoundary } from '@/components/error-boundary';
import { ObraFilesClientWrapper } from './components/client-wrapper';
import { getOrganizationDocumentsWithFolders, getOrganizationFolders } from './actions/document-actions';
import { getFolderExtractedData } from './actions/folder-extraction-actions';

interface ObraFilesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    folder?: string;
  }>;
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
  const params = await searchParams;
  const { search, category, folder } = params;

  // Fetch documents and folders for the organization
  const [documentsResult, foldersResult] = await Promise.all([
    getOrganizationDocumentsWithFolders(),
    getOrganizationFolders()
  ]);

  const documents = documentsResult.documents || [];
  const folders = foldersResult.folders || [];

  // Server-side filtering
  let filteredDocuments = documents;

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredDocuments = filteredDocuments.filter(doc =>
      doc.name.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower))
    );
  }

  // Apply category filter
  if (category) {
    filteredDocuments = filteredDocuments.filter(doc =>
      doc.category === category
    );
  }

  // Get current folder
  const currentFolder = folder
    ? folders.find(f => f.id === folder) || null
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

  // Fetch extracted data for current folder if extraction is enabled
  let extractedData: any[] = [];
  if (currentFolder?.extract_data) {
    try {
      const extractedResult = await getFolderExtractedData(currentFolder.id);
      extractedData = extractedResult.data || [];
    } catch (error) {
      console.error('Error fetching extracted data:', error);
    }
  }

  return (
    <FileErrorBoundary>
      <Suspense fallback={<ObraFilesPageSkeleton />}>
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
            searchParams={params}
            documents={filteredDocuments}
            folders={folders}
            currentFolder={currentFolder}
            folderCounts={folderCounts}
            extractedData={extractedData}
          />
        )}
      </Suspense>
    </FileErrorBoundary>
  );
}