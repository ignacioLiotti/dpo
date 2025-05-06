// app/(sidebar)/obras/[id]/page.tsx
import ObraPage from './ObraPage'
import { notFound } from 'next/navigation'

// Define server-side fetching functions (replace with your actual implementations/locations)
async function fetchData(url: string, typeName: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}${url}`, {
      // Add cache options as needed, e.g., revalidate tag-based
      // Example: Tag everything related to this obraId
      next: { tags: [`obra-${url.split('obraId=')[1] || url.split('/').pop()}`] },
      // Or more granular tags: next: { tags: [`${typeName}-list`] },
    })
    if (!response.ok) {
      // Handle 404 specifically if needed, otherwise throw
      if (response.status === 404 && typeName === 'obra') return null
      throw new Error(`Failed to fetch ${typeName}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${typeName}:`, error)
    // Decide how to handle errors, maybe throw or return null/empty array
    if (typeName === 'obra') return null
    return [] // Return empty array for lists on error
  }
}

export default async function ObraServerPage({ params }: { params: { id: string } }) {
  const { id } = params

  // Fetch all necessary data in parallel on the server
  const [obra, presupuestos, mediciones, certificados] = await Promise.all([
    fetchData(`/api/obras/${id}`, 'obra'), // TODO: Replace any with Obra type
    fetchData(`/api/presupuestos?obraId=${id}`, 'presupuestos'), // TODO: Replace any[] with Presupuesto[]
    fetchData(`/api/mediciones?obraId=${id}`, 'mediciones'),     // TODO: Replace any[] with Medicion[]
    fetchData(`/api/certificados?obraId=${id}`, 'certificados'), // TODO: Replace any[] with Certificado[]
  ])

  // Handle case where obra is not found (fetchData returns null for obra on 404 or error)
  if (!obra) {
    notFound()
  }

  // console.log('Data fetched on server:', { obra, presupuestos, mediciones, certificados })

  // Pass fetched data directly as props to the client component
  // ObraPage is responsible for displaying this data and handling interactions (mutations via Server Actions)
  return (
    <ObraPage
      obra={obra}
      presupuestos={presupuestos}
      mediciones={mediciones}
      certificados={certificados}
    />
  )
}
