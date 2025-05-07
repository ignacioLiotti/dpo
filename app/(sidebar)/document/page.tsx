'use client'
import { Document } from "@/components/Document";
import type { SectionConfig, DocumentData } from '@/components/Document'

// Example Config 1: Header, Columns, Simple Table, Text
const complexConfig1: SectionConfig[] = [
  {
    id: 'header-1',
    type: 'header',
    titleKey: 'mainTitle',
    subtitleKey: 'subTitle',
  },
  {
    id: 'cols-1',
    type: 'columns',
    columns: 2,
    fields: [
      { fieldKey: 'author', label: 'Author' },
      { fieldKey: 'publishDate', label: 'Publish Date' },
    ],
  },
  {
    id: 'table-simple-1',
    type: 'table',
    rowsKey: 'projectMetrics',
    columns: ['metric', 'value', 'target'], // Corresponds to keys in projectMetrics array items
  },
  {
    id: 'text-1',
    type: 'text',
    fieldKey: 'conclusion',
    label: 'Conclusion',
  },
]

const initialData1: DocumentData = {
  mainTitle: 'Q3 Project Report',
  subTitle: 'Analysis of Key Performance Indicators',
  author: 'Jane Doe',
  publishDate: '2024-10-26',
  projectMetrics: [
    { metric: 'User Growth', value: '15%', target: '12%' },
    { metric: 'Revenue', value: '$120,000', target: '$115,000' },
    { metric: 'Churn Rate', value: '2.1%', target: '2.5%' },
  ],
  conclusion:
    'Overall performance exceeded targets in key areas. User growth was particularly strong. Minor increase needed in marketing spend for Q4.',
}

// Example Config 2: Detailed Header, Complex Table, Two Columns
const complexConfig2: SectionConfig[] = [
  {
    id: 'header-2',
    type: 'header',
    titleKey: 'eventPlanTitle',
    subtitleKey: 'eventPlanSubtitle',
    descriptionKey: 'eventPlanDescription',
  },
  {
    id: 'table-complex-1',
    type: 'complexTable',
    rowsKey: 'attendees',
    columns: ['name', 'email', 'status'], // Corresponds to keys in attendees array items
  },
  {
    id: 'cols-2',
    type: 'columns',
    columns: 2,
    fields: [
      { fieldKey: 'venue', label: 'Venue' },
      { fieldKey: 'budget', label: 'Budget' },
    ],
  },
]

const initialData2: DocumentData = {
  eventPlanTitle: 'Annual Company Summit 2025',
  eventPlanSubtitle: 'Planning and Logistics',
  eventPlanDescription:
    'This document outlines the plan for the upcoming company summit, including attendee management and logistical details.',
  attendees: [
    { name: 'Alice Smith', email: 'alice@example.com', status: 'Confirmed' },
    { name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending' },
  ],
  venue: 'Grand Conference Center',
  budget: '$50,000',
}

// Example Config 3: Budget Spreadsheet
const complexConfig3: SectionConfig[] = [
  {
    id: 'header-3',
    type: 'header',
    titleKey: 'ministerioTitle',
    subtitleKey: 'obraSubtitle',
    descriptionKey: 'obraDetails', // Combine ID and Localidad here
  },
  {
    id: 'spreadsheet-title',
    type: 'text', // Using text for the spreadsheet title
    fieldKey: 'spreadsheetTitle',
    // label: 'Planilla de Presupuesto', // Removing label, title is in data
    // Consider adding specific styling/class for this title if needed
  },
  {
    id: 'table-materials-1',
    type: 'complexTable',
    rowsKey: 'materials',
    // Reverting to simple columns array. Labels might be inferred or handled by the component.
    columns: ['nro', 'nombre', 'unidad', 'cantidad', 'precioUnit', 'precioTotal', 'parcial'],
  },
  // Removing the 'totals' section due to type conflict and assuming totals might be handled differently
  // { 
  //   id: 'totals-1',
  //   type: 'columns',
  //   columns: 3, // This caused a type error
  //   fields: [
  //     { fieldKey: 'totalAmount', label: 'Total ($)' },
  //     { fieldKey: 'rubroPercent', label: 'Rubro (%)' },
  //     { fieldKey: 'iacumulPercent', label: 'IACUMUL (%)' },
  //   ],
  // },
]

const initialData3: DocumentData = {
  ministerioTitle: 'Ministerio de Obras y Servicios Públicos',
  obraSubtitle: 'Obra: Sin nombre',
  obraDetails: 'ID: N/A\nLocalidad: Sin ubicación', // Using newline for separation
  spreadsheetTitle: '1. MATERIALES ELECTRICOS', // The title of the section
  materials: [
    {
      nro: '1.1',
      nombre: 'Caja de acero semipesado octog. chico',
      unidad: 'm2',
      cantidad: 121,
      precioUnit: '914,78',
      precioTotal: '$110.688,38',
      parcial: '2.72%',
    },
    {
      nro: '1.2',
      nombre: 'Caja de acero semipesado rectang.',
      unidad: 'c/u',
      cantidad: 31,
      precioUnit: '912,42',
      precioTotal: '$28.285,02',
      parcial: '0.69%',
    },
    {
      nro: '1.3',
      nombre: 'Caja de acero semipesado cuadrado de 10 x 10 cm',
      unidad: 'c/u',
      cantidad: 41,
      precioUnit: '1.461,14',
      precioTotal: '$59.906,74',
      parcial: '1.47%',
    },
    {
      nro: '1.4',
      nombre: 'Caja p/tablero chapa 20X20X18 de 4 bocas',
      unidad: 'c/u',
      cantidad: 61,
      precioUnit: '13.380,36',
      precioTotal: '$816.201,96',
      parcial: '20.04%',
    },
    {
      nro: '1.5',
      nombre: 'Caja de chapa de 12 x 12 x 7 cm fondo chapa',
      unidad: 'c/u',
      cantidad: 71,
      precioUnit: '7.188,03',
      precioTotal: '$510.350,13',
      parcial: '12.53%',
    },
    {
      nro: '1.6',
      nombre: 'Caja para medidor reglamentaria trifásica de chapa',
      unidad: 'c/u',
      cantidad: 31,
      precioUnit: '33.788,90',
      precioTotal: '$1.047.455,90',
      parcial: '25.72%',
    },
    {
      nro: '1.7',
      nombre: 'Caja para medidor reglam.monofásica polIcarbonato',
      unidad: 'c/u',
      cantidad: 41,
      precioUnit: '36.563,81',
      precioTotal: '$1.499.116,21',
      parcial: '36.82%',
    },
    // Adding totals row as part of the data if the table component supports it
    // Alternatively, this needs custom handling in the Document component
    {
      nombre: 'Total ($)', // Using 'nombre' column for label
      precioTotal: '$4.072.004,34', // Value in 'precioTotal'
      rubroPercent: '100.00%', // Using a placeholder key 'rubroPercent'
      iacumulPercent: '100.00%', // Using a placeholder key 'iacumulPercent'
      // Ensure other keys are present or handled gracefully by the table component
      nro: '',
      unidad: '',
      cantidad: '',
      precioUnit: '',
      parcial: '',
    }
  ],
  // Removing total fields as they are now part of the materials data or handled differently
  // totalAmount: '$4.072.004,34',
  // rubroPercent: '100.00%',
  // iacumulPercent: '100.00%',
}

const demoOnSubmit = async (data: DocumentData) => {
  console.log('Form Submitted:', data)
}

export default function DocumentPage() {
  return (
    <div className="container mx-auto p-4 overflow-x-auto flex max-w-full gap-4 rounded-tr-3xl bg-white">
      {/* Example 1 */}
      <div className="bg-white p-4 rounded-lg flex-shrink-0 w-[600px]">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">
          Example 1: Project Report
        </h2>
        <Document
          config={complexConfig1}
          initialData={initialData1}
          onSubmit={demoOnSubmit}
        />
      </div>

      {/* Example 2 */}
      <div className="bg-white p-4 rounded-lg flex-shrink-0 w-[600px]">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">
          Example 2: Event Plan
        </h2>
        <Document
          config={complexConfig2}
          initialData={initialData2}
          onSubmit={demoOnSubmit}
        />
      </div>

      {/* Example 3: Budget */}
      <div className="bg-white p-4 rounded-lg flex-shrink-0 w-[800px]">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">
          Example 3: Budget Spreadsheet
        </h2>
        <Document
          config={complexConfig3}
          initialData={initialData3}
          onSubmit={demoOnSubmit}
        />
      </div>
    </div>
  )
}

