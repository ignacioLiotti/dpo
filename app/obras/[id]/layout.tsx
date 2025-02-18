
import { ObraProvider } from '@/app/providers/ObraProvider';

export default async function ObraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ObraProvider obraId={id}>
      {children}
    </ObraProvider>
  );
}