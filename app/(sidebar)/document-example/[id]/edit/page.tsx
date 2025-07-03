import { notFound } from 'next/navigation';
import { DocumentForm } from '../../components/document-form';
import { getExampleDocumentById, updateExampleDocument } from '../../actions/document-actions';

interface PageProps {
  params: { id: string };
}

export default async function EditDocumentPage({ params }: PageProps) {
  const { id } = await params;
  const document = await getExampleDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-center">
        <DocumentForm 
          document={document}
          action={updateExampleDocument}
          actionLabel="Update Document"
        />
      </div>
    </div>
  );
}