# Obra Files Management System

A comprehensive file management system for construction project documents (obras). This system provides Google Drive-like functionality with advanced features for construction project management.

## 🏗️ Structure

```
app/(sidebar)/obra-files/
├── page.tsx                    # Main files listing page
├── actions/
│   └── document-actions.ts     # Server actions for file operations
├── components/
│   ├── client-wrapper.tsx      # Main client component wrapper
│   ├── document-grid.tsx       # Grid view for documents
│   ├── document-table.tsx      # Table view for documents
│   ├── document-tree-view.tsx  # Tree navigation
│   ├── folder-grid.tsx         # Folder grid display
│   ├── upload-form.tsx         # File upload form
│   ├── upload-form-client.tsx  # Client-side upload
│   ├── add-document-card.tsx   # Quick upload card
│   ├── document-card-client.tsx # Document card component
│   ├── document-preview-*.tsx  # Preview components
│   ├── search-and-filters.tsx  # Search and filter UI
│   └── view-toggle.tsx         # View mode toggle
├── schema.ts                   # Zod validation schemas
├── types.ts                    # TypeScript type definitions
└── README.md                   # This file
```

## ✨ Features

### 📁 **Document Management**
- **Upload**: Drag-and-drop multiple files
- **Organization**: Folder-based structure
- **Categories**: 11 construction-specific categories
- **Search**: Full-text search across names and descriptions
- **Filtering**: By category, folder, tags
- **Views**: Grid, table, and tree views

### 🏗️ **Construction-Specific Categories**
- **Planos** (📐) - Technical drawings and blueprints
- **Fotos** (📸) - Progress photos and site images
- **Informes** (📋) - Reports and documentation
- **Contratos** (📝) - Contracts and agreements
- **Permisos** (🏛️) - Permits and authorizations
- **Facturas** (🧾) - Invoices and billing
- **Avance de Obra** (🏗️) - Progress tracking
- **Materiales** (🧱) - Material specs and receipts
- **Certificados** (🏆) - Certificates and certifications
- **Correspondencia** (✉️) - Communications
- **Otros** (📁) - Miscellaneous documents

Perfect for construction project document management! 🏗️