// import { type Obra } from '@/types/index'; // Try importing from index - // TODO: Define and import proper Obra type
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
// Import any necessary layout components (Header, Sidebar, etc.)

// Example server-side data fetching function (replace with your actual implementation)
async function getObraData(id: string | number): Promise<any | null> { // TODO: Use proper Obra type
  try {
    // Use environment variables for the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/obras/${id}`, {
      // Add cache options as needed, e.g., revalidate tag-based
      next: { tags: [`obra-${id}`] },
    });
    if (!response.ok) {
      if (response.status === 404) return null; // Handle not found specifically
      throw new Error(`Failed to fetch obra: ${response.statusText}`);
    }
    return await response.json() as any; // TODO: Use proper Obra type
  } catch (error) {
    console.error("Error fetching obra data:", error);
    // Decide how to handle errors, maybe throw or return null
    // For now, return null which will trigger notFound()
    return null;
  }
}


export default async function ObraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // params type is already resolved by Next.js, no need for Promise<>
  params: { id: string };
}) {
  const { id } = params;
  const obra = await getObraData(id); // Type is now any

  // Handle case where obra is not found
  if (!obra) {
    notFound(); // Render the not-found page
  }

  return (
    // Example structure - adapt to your actual layout components
    <div className="flex h-full">
      {/* Maybe a sidebar specific to this Obra section */}
      {/* <ObraSidebar obra={obra} /> */}
      <main className="flex-1 p-4 md:p-6">
        {/* You could add a header using obra data */}
        <h1 className="text-2xl font-bold mb-4">Obra: {obra?.nombre || 'Loading...'}</h1> // Access name safely
        {/* Wrap children in Suspense if pages fetch their own data */}
        <Suspense fallback={<div>Loading page content...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}