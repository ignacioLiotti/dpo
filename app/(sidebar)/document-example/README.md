# Document Example - Barebones CRUD System

A simple document management system demonstrating basic CRUD operations without processors. This example shows how to structure a typical data-driven application following the patterns established in the DPO project.

## 🏗️ Structure

```
app/(sidebar)/document-example/
├── page.tsx                    # Main listing page
├── new/page.tsx               # Create new document
├── [id]/page.tsx              # Document detail view
├── [id]/edit/page.tsx         # Edit document
├── actions/
│   └── document-actions.ts    # Server actions for CRUD
├── components/
│   ├── document-form.tsx      # Reusable form component
│   └── document-table.tsx     # Table display component
├── types.ts                   # TypeScript interfaces
├── schema.ts                  # Zod validation schemas
├── migration.sql              # Database table creation
└── README.md                  # This file
```

## 📊 Database Schema

The system uses a simple `example_documents` table with:

- **Basic fields**: id, created_at, updated_at, title, description, content
- **Categorization**: status, category, tags, priority
- **Scheduling**: due_date
- **Metadata**: author_id, metadata (JSONB)
- **Security**: RLS policies for user isolation

## ✨ Features

### ✅ Complete CRUD Operations
- **Create**: New document form with validation
- **Read**: List view with search and detail pages
- **Update**: Edit existing documents
- **Delete**: Remove documents with confirmation

### ✅ Data Management
- **Search**: Full-text search across title, description, content
- **Categories**: Predefined categories with icons
- **Status Tracking**: Draft, Published, Archived
- **Priority Levels**: Low, Medium, High with color coding
- **Tags**: Flexible tagging system
- **Due Dates**: Optional deadline tracking

### ✅ User Experience
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Skeleton screens for better UX
- **Form Validation**: Client and server-side validation
- **Error Handling**: Graceful error messages
- **Navigation**: Breadcrumbs and back buttons

## 🚀 Setup Instructions

### 1. Database Setup
Run the migration to create the table:

```sql
-- Copy and run the content of migration.sql in Supabase SQL editor
```

### 2. Navigation Setup
Add to your sidebar navigation (if needed):

```tsx
// In your nav component
{
  title: "Document Example",
  url: "/document-example",
  icon: FileText,
}
```

### 3. Access the System
- Main page: `/document-example`
- Create: `/document-example/new`
- View: `/document-example/[id]`
- Edit: `/document-example/[id]/edit`

## 🔧 Key Components

### Server Actions (`actions/document-actions.ts`)
- `getAllExampleDocuments()` - Get all documents
- `getExampleDocumentById(id)` - Get single document
- `createExampleDocument(formData)` - Create new document
- `updateExampleDocument(formData)` - Update existing document
- `deleteExampleDocument(formData)` - Delete document
- `searchExampleDocuments(query)` - Search functionality

### Form Component (`components/document-form.tsx`)
Reusable form used for both create and edit operations:
- Auto-populates for editing
- Validation with required fields
- Category and status dropdowns
- Tag input with comma separation
- Due date picker

### Table Component (`components/document-table.tsx`)
Displays documents in a clean table format:
- Sortable columns
- Status and priority badges
- Action buttons (view, edit)
- Empty state handling

## 🎨 Customization

### Adding New Fields
1. Update the database schema in `migration.sql`
2. Add to TypeScript interfaces in `types.ts`
3. Update validation schemas in `schema.ts`
4. Modify form component to include new fields
5. Update display components as needed

### Changing Categories
Modify the `DOCUMENT_CATEGORIES` array in `types.ts`:

```typescript
export const DOCUMENT_CATEGORIES = [
  { id: 'your-category', name: 'Your Category', icon: '🎯' },
  // ... more categories
] as const;
```

### Custom Validation
Add validation rules in `schema.ts`:

```typescript
export const createExampleDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  // Add your custom validation here
  custom_field: z.string().email().optional(),
});
```

## 🔐 Security Features

- **Row Level Security**: Users can only access their own documents
- **Input Validation**: Zod schemas validate all inputs
- **SQL Injection Protection**: Supabase client handles parameterization
- **Authentication**: Requires logged-in users
- **Authorization**: Owner-only access to documents

## 📝 Usage Examples

### Basic Document Creation
```typescript
// In a form or component
const formData = new FormData();
formData.append('title', 'My Document');
formData.append('category', 'report');
formData.append('status', 'draft');

await createExampleDocument(formData);
```

### Search Implementation
```typescript
// Search documents
const results = await searchExampleDocuments('project report');
```

### Custom Metadata
Documents support flexible metadata:

```typescript
const metadata = {
  project_id: 'proj_123',
  department: 'engineering',
  approval_required: true
};
```

## 🚀 Performance Considerations

- **Indexes**: Created on commonly queried fields
- **Pagination**: Can be added for large datasets
- **Full-text Search**: Uses PostgreSQL's built-in search
- **Caching**: Can add React Query or SWR for client-side caching

## 🔄 Extension Ideas

This barebones example can be extended with:

1. **File Attachments**: Add file upload functionality
2. **Comments**: Add comment system for collaboration
3. **Versions**: Track document versions and changes
4. **Workflows**: Add approval workflows
5. **Notifications**: Email/push notifications for updates
6. **Bulk Operations**: Select multiple documents for bulk actions
7. **Advanced Search**: Filters by date, category, status
8. **Export**: PDF, Word, CSV export functionality

## 📚 Learning Points

This example demonstrates:

- **Server Actions**: Modern Next.js data mutation patterns
- **Form Handling**: Server-side form processing with validation
- **Database Design**: Proper indexing and RLS setup
- **Component Reusability**: Forms used for both create/edit
- **Type Safety**: End-to-end TypeScript with Zod validation
- **User Experience**: Loading states, error handling, navigation

Perfect starting point for any document-based application! 🎉