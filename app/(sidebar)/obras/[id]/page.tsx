//page para ver la obra unica en base a su id

// aca debe haber un formulario para editar la obra, con los campos iniciales:
// - nombre (input)
// - descripcion (textarea)
// - fecha de inicio (fecha)
// - fecha de fin (fecha)
// - estado (select con los estados de la obra)
// - reparticion (select con las reparticiones)
// - area (select con las areas)
// - tipo de obra (select con los tipos de obra)
// - presupuesto oficial (numero formato pesos argentinos)
// - basico (fecha)
// - expediente (numero)

// y campos adicionales:

//redeterminacion (numero de redeterminacion en aumento, el primero es 1)
// expediente (numero)
// monto (numero formato pesos argentinos)
// basico (fecha)
// tipo de redeterminacion (select con los tipos de redeterminacion)

// adicionales (numero de adicionales, el primero es 1)
// monto (numero formato pesos argentinos)
// norma (numero de norma)
// trabajos (textarea)

// ampliaciones de plazo (numero de ampliaciones de plazo, el primero es 1)
// expediente (numero)
// norma (numero de norma)
// plazo (numero de dias)
// fecha final (fecha)

import type { Obra } from '../types';
import { notFound } from 'next/navigation';
import ObraEditForm from '../components/obra-edit-form';
import { getObraActionByID } from '../actions/get-obra-action';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObraFilesClientWrapper } from '@/app/(sidebar)/files/components/client-wrapper';
import { cn } from '@/utils/utils';
import { getObraDocumentsWithFolders, getObraFolders } from '@/lib/actions/document-actions';

interface ObraDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    folder?: string;
  }>;
}

// Loading component
function ObraDetailSkeleton() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-10 w-96 bg-muted animate-pulse rounded" />
            <div className="h-6 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Processor Integration Demo Component
function ProcessorIntegrationDemo({ obra }: { obra: Obra }) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          🚀 Processor Pattern Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700">Document Processing</h4>
            <ul className="space-y-1 text-blue-600">
              <li>✅ Auto-extract contract data</li>
              <li>✅ Process invoices and receipts</li>
              <li>✅ Parse building permits</li>
              <li>✅ Analyze blueprints and CAD files</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-700">State Management</h4>
            <ul className="space-y-1 text-blue-600">
              <li>✅ Validate state transitions</li>
              <li>✅ Generate automated actions</li>
              <li>✅ Send notifications</li>
              <li>✅ Track compliance requirements</li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-blue-700">Current Obra Status</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              ID: {obra.id}
            </Badge>
            <Badge variant="outline" className="border-green-300 text-green-700">
              Processor: Active
            </Badge>
          </div>
        </div>

        <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded">
          <strong>Demo Features:</strong> The edit form below includes document upload with automatic data extraction
          and intelligent state management with validation. Upload contracts, invoices, or permits to see the
          processor pattern in action!
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ObraDetailsPage({ params, searchParams }: ObraDetailsPageProps) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const { search, category, folder } = searchParamsResolved;

  const obra = await getObraActionByID(id);

  if (!obra) {
    notFound();
  }

  // Fetch documents and folders for the docs tab
  const [documentsResult, foldersResult] = await Promise.all([
    getObraDocumentsWithFolders(obra.id),
    getObraFolders(obra.id)
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

  // Calculate folder document counts for the folder grid
  const folderCounts = folders.reduce((acc, folder) => {
    acc[folder.id] = documents.filter(doc => doc.folder_id === folder.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full max-w-full h-full overflow-y-hidden bg-white/50">
      <Suspense fallback={<ObraDetailSkeleton />}>
        <Tabs defaultValue="edit" className="w-full h-full flex flex-col pt-10">
          <TabsList className="flex justify-start items-center w-[calc(100%+2px)] overflow-hidden h-10 bg-background rounded-none absolute top-[-1px] left-[-1px] z-[1000] border-b border-outline p-0">
            <span className={cn('noise-bg !w-full !h-full !absolute !top-0 !left-0 !z-[-1] ')}></span>
            <TabsTrigger className={cn('mb-[-1px] border border-transparent h-full bg-transparent rounded-none', 'data-[state=active]:border-outline data-[state=active]:border data-[state=active]:border-solid data-[state=active]:bg-white/50 data-[state=active]:shadow-none')} value="edit">Edit Obra</TabsTrigger>
            <TabsTrigger className={cn('mb-[-1px] h-full border border-transparent bg-transparent rounded-none', 'data-[state=active]:border-outline data-[state=active]:border data-[state=active]:border-solid data-[state=active]:bg-white/50 data-[state=active]:shadow-none')} value="docs">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6 overflow-y-auto">
            <ObraEditForm obra={obra} />
          </TabsContent>

          <TabsContent value="docs" className="h-full w-full mt-0 overflow-y-auto">
            {documentsResult.error || foldersResult.error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Error al cargar documentos</h3>
                  <p className="text-muted-foreground mb-4">
                    {documentsResult.error || foldersResult.error}
                  </p>
                </div>
              </div>
            ) : (
              <ObraFilesClientWrapper
                obraId={obra.id}
                obraName={obra.obra_name}
                searchParams={searchParamsResolved || {}}
                documents={filteredDocuments}
                folders={folders}
                currentFolder={currentFolder}
                folderCounts={folderCounts}
              />
            )}
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}
