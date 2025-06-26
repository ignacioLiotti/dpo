# Obra Document Management System

This document management system provides Google Drive-like functionality for storing and organizing documents related to each obra (construction project). It's built using Supabase for storage and follows the patterns established by midday.

## 🚀 Quick Start

1. **Navigate to an Obra**: Go to `/obras/[id]` in your application
2. **Click the "Documents" tab**: You'll see the integrated document management system
3. **Upload Documents**: Use the dropzone or quick upload buttons
4. **Organize**: Select categories, add descriptions and tags
5. **Manage**: Search, filter, download, edit, and delete documents

## ✅ What's Implemented

### ✅ Integrated into Obra Details Page

- **Location**: `app/(sidebar)/obras/[id]/page.tsx`
- **Tab**: "Documents" tab in the obra details page
- **Component**: `ObraDocumentsManager` provides the complete interface

### ✅ Document Upload & Management

- **Dropzone**: Drag and drop multiple files
- **Quick Upload**: Buttons for photos and documents
- **Categories**: 11 predefined categories for construction projects
- **Metadata**: Descriptions, tags, and file information
- **Security**: Only accessible to obra owners

### ✅ Document Organization

- **Search**: By name, description, and tags
- **Filter**: By document category
- **Sort**: By date, name, size, or category
- **Views**: Grid and list view modes
- **Stats**: Document count, storage usage, categories

### ✅ File Operations

- **Download**: Secure signed URLs (1-hour expiry)
- **Edit**: Update metadata (name, category, description, tags)
- **Delete**: With confirmation (using sonner toast)
- **Preview**: File type icons and thumbnails for images

## Features

### 🗂️ Document Categories

- **Planos** - Technical drawings and blueprints
- **Fotos** - Progress photos and site images
- **Informes** - Reports and documentation
- **Contratos** - Contracts and legal documents
- **Permisos** - Permits and authorizations
- **Facturas** - Invoices and billing documents
- **Avance de Obra** - Progress tracking documents
- **Materiales** - Material specifications and receipts
- **Certificados** - Certificates and certifications
- **Correspondencia** - Communication and correspondence
- **Otros** - Other miscellaneous documents

### 📁 Storage Structure

Files are organized in Supabase storage with the following structure:

```
obra-vault/
  ├── {obra_id}/
  │   ├── {timestamp}-{filename}
  │   └── {timestamp}-{filename}
  └── {otra_obra_id}/
      ├── {timestamp}-{filename}
      └── {timestamp}-{filename}
```

### 🔒 Security & Permissions

- **Row Level Security (RLS)** enabled on all tables
- Users can only access documents for obras they own
- Files are private by default
- Signed URLs for secure downloads (1 hour expiry)

## Database Schema

The system uses the `obra_documents` table with the following structure:

```sql
CREATE TABLE obra_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  type text NOT NULL,           -- MIME type
  obra_id uuid NOT NULL,        -- Foreign key to obras table
  user_id uuid NOT NULL,        -- Foreign key to auth.users
  size bigint NOT NULL,         -- File size in bytes
  name text NOT NULL,           -- Original filename
  path text[] NOT NULL,         -- Storage path [obra_id, filename]
  description text,             -- Optional description
  category text,                -- Document category
  is_public boolean DEFAULT false,
  tags text[] DEFAULT '{}',     -- Tags for organization
  version integer DEFAULT 1,   -- Version number
  checksum text                 -- File integrity checksum
);
```

## Components

### 1. ObraDocumentDropzone

Main upload component with drag-and-drop functionality.

```tsx
import { ObraDocumentDropzone } from "@/components/obras/obra-document-dropzone";

<ObraDocumentDropzone
	obraId='uuid-here'
	onUploadComplete={() => {
		// Refresh document list
	}}
/>;
```

**Features:**

- Drag and drop multiple files
- Category selection
- Description and tags
- File type validation (PDF, images, Office docs, CAD files)
- Size limit: 10MB per file
- Progress indicators

### 2. Quick Upload Buttons

Simplified upload buttons for common file types.

```tsx
import { PhotoUploadButton, DocumentUploadButton } from '@/components/obras/obra-document-dropzone';

<PhotoUploadButton obraId="uuid-here" onUploadComplete={refreshDocs} />
<DocumentUploadButton obraId="uuid-here" onUploadComplete={refreshDocs} />
```

### 3. ObraDocumentList

Comprehensive document listing and management component.

```tsx
import { ObraDocumentList } from "@/components/obras/obra-document-list";

<ObraDocumentList
	documents={documents}
	onDocumentChange={refreshDocs}
/>;
```

**Features:**

- Grid and list view modes
- Search by name, description, and tags
- Filter by category
- Sort by date, name, size, category
- Category tabs with counts
- Download functionality
- Edit document metadata
- Delete with confirmation
- Responsive design

## Actions

### Upload Documents

```tsx
import { uploadDocumentsAction } from "@/lib/actions/document-actions";

await uploadDocumentsAction({
	obra_id: "uuid-here",
	files: [file1, file2],
	category: "photos",
	description: "Optional description",
	tags: ["tag1", "tag2"],
});
```

### Get Documents

```tsx
import { getObraDocuments } from "@/lib/actions/document-actions";

const documents = await getObraDocuments("obra-id");
```

### Update Document

```tsx
import { updateDocumentAction } from "@/lib/actions/document-actions";

await updateDocumentAction({
	id: "document-id",
	name: "New name",
	description: "Updated description",
	category: "contracts",
	tags: ["updated", "tags"],
});
```

### Delete Document

```tsx
import { deleteDocumentAction } from "@/lib/actions/document-actions";

await deleteDocumentAction({ id: "document-id" });
```

### Get Download URL

```tsx
import { getDocumentDownloadUrl } from "@/lib/actions/document-actions";

const downloadUrl = await getDocumentDownloadUrl("document-id");
```

## Usage Example

Here's a complete example of how to integrate the document system into an obra detail page:

```tsx
"use client";

import { useState, useEffect } from "react";
import { ObraDocumentDropzone } from "@/components/obras/obra-document-dropzone";
import { ObraDocumentList } from "@/components/obras/obra-document-list";
import {
	PhotoUploadButton,
	DocumentUploadButton,
} from "@/components/obras/obra-document-dropzone";
import { getObraDocuments } from "@/lib/actions/document-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ObraDocumentsProps {
	obraId: string;
}

export function ObraDocuments({ obraId }: ObraDocumentsProps) {
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(true);

	const refreshDocuments = async () => {
		try {
			const docs = await getObraDocuments(obraId);
			setDocuments(docs);
		} catch (error) {
			console.error("Error loading documents:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refreshDocuments();
	}, [obraId]);

	if (loading) {
		return <div>Loading documents...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Documentos de la Obra</CardTitle>
				<div className='flex gap-2'>
					<ObraDocumentDropzone
						obraId={obraId}
						onUploadComplete={refreshDocuments}
					/>
					<PhotoUploadButton
						obraId={obraId}
						onUploadComplete={refreshDocuments}
					/>
					<DocumentUploadButton
						obraId={obraId}
						onUploadComplete={refreshDocuments}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<ObraDocumentList
					documents={documents}
					onDocumentChange={refreshDocuments}
				/>
			</CardContent>
		</Card>
	);
}
```

## File Type Support

The system supports the following file types:

### Images

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Documents

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Plain Text (.txt)
- CSV (.csv)

### Archives

- ZIP (.zip)
- RAR (.rar)

### CAD Files

- AutoCAD Drawing (.dwg)
- Drawing Exchange Format (.dxf)

## Storage Configuration

The system uses Supabase storage with the following configuration:

### Bucket Settings

- **Name**: `obra-vault`
- **Public**: false (private bucket)
- **File size limit**: 10MB
- **Allowed MIME types**: Configured in migration

### Storage Policies

- Upload: Authenticated users only
- Select: Users can view files for obras they own
- Update: Users can update files for obras they own
- Delete: Users can delete files for obras they own

## Error Handling

The system includes comprehensive error handling:

- File size validation
- MIME type validation
- Network error recovery
- Storage cleanup on failed uploads
- User-friendly error messages via sonner toasts

## Performance Considerations

- Files are uploaded directly to Supabase storage
- Signed URLs prevent direct access to files
- Database queries are optimized with indexes
- Large file handling with progress indicators
- Efficient search and filtering

## Migration

To set up the document system, run the migration:

```sql
-- Run this migration file
supabase/migrations/20250530000000_create_obra_documents.sql
```

This will create:

- `obra_documents` table with proper indexes
- RLS policies for security
- Storage bucket with appropriate settings
- Storage policies for file access control

## Integration with Midday Patterns

This system follows midday's established patterns:

1. **Supabase Integration**: Uses the same server/client pattern
2. **Action Pattern**: Server actions with next-safe-action
3. **Component Structure**: Modular, reusable components
4. **Error Handling**: Consistent error handling with toasts
5. **TypeScript**: Fully typed with proper schemas
6. **Security**: RLS policies and proper authorization
7. **UI Components**: Uses shadcn/ui components consistently
