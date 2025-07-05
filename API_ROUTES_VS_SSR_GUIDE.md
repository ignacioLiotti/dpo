# API Routes vs Server-Side Rendering: Decision Framework

This guide explains when to use API Routes vs Server Actions/SSR in Next.js 13+ applications, with real examples from our document management system.

## 🎯 Core Principle

**API Routes** = External interfaces, file operations, and complex HTTP interactions  
**Server Actions/SSR** = Data fetching, mutations, and component-integrated operations

## 🔐 Authentication Routes - Why API Routes?

### Current Auth Routes (API Routes)
```
/api/auth/callback
/api/auth/confirm  
/api/auth/logout
/api/auth/signup
```

### Why These Must Be API Routes:

1. **OAuth Flow Requirements**
   ```typescript
   // OAuth providers expect specific HTTP endpoints
   // Google/GitHub redirect to: https://yourapp.com/api/auth/callback
   // These CANNOT be server actions
   ```

2. **HTTP Headers & Cookies**
   ```typescript
   // API routes can set HTTP-only cookies
   export async function GET(request: Request) {
     const response = NextResponse.redirect('/dashboard');
     response.cookies.set('session', token, { httpOnly: true });
     return response;
   }
   ```

3. **External Service Integration**
   ```typescript
   // Third-party services call these endpoints
   // Supabase auth redirects to /api/auth/callback
   // Webhooks, email verification links, etc.
   ```

4. **Non-HTML Responses**
   ```typescript
   // Auth often returns JSON, redirects, or status codes
   return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
   ```

## 📁 File Operations - Why API Routes?

### Current File Routes (API Routes)
```
/api/documents/[id]/download     ✅ API Route
/api/process-document           ✅ API Route
```

### Why These Must Be API Routes:

1. **File Streaming & Downloads**
   ```typescript
   // Generates signed URLs for file access
   export async function GET(request: Request) {
     const signedUrl = await storage.createSignedUrl(path, 3600);
     return NextResponse.json({ url: signedUrl });
   }
   ```

2. **File Upload Handling**
   ```typescript
   // Processes FormData with files
   export async function POST(request: Request) {
     const formData = await request.formData();
     const file = formData.get('file') as File;
     // Process with OCR, AI, etc.
   }
   ```

3. **Binary Data Processing**
   ```typescript
   // Handles various file types, base64 encoding
   const buffer = await file.arrayBuffer();
   const base64 = Buffer.from(buffer).toString('base64');
   ```

4. **External Access Potential**
   ```typescript
   // Could be called by mobile apps, external services
   // Direct URL access for downloads
   ```

## 📊 Data Operations - Why Server Actions?

### Replaced with Server Actions
```typescript
// ❌ OLD: /api/documents/[id]/extracted-data
// ✅ NEW: getDocumentExtractedData() server action

export async function getDocumentExtractedData(documentId: string) {
  const supabase = await createClient();
  // Direct database access, type-safe
  const { data } = await supabase
    .from('obra_documents')
    .select('*, extracted_data:document_extracted_data(*)')
    .eq('id', documentId)
    .single();
  return data;
}
```

### Why Server Actions Are Better:

1. **Type Safety**
   ```typescript
   // Direct TypeScript integration
   const data = await getDocumentExtractedData(id); // Fully typed
   ```

2. **Performance**
   ```typescript
   // No HTTP overhead, direct database connection
   // Better caching with Next.js
   ```

3. **SSR Integration**
   ```typescript
   // Can be called during server-side rendering
   export default async function DocumentPage({ params }) {
     const data = await getDocumentExtractedData(params.id);
     return <DocumentView data={data} />;
   }
   ```

## 🤔 Decision Framework

### Use **API Routes** when you need:

| Scenario | Example | Why API Route? |
|----------|---------|---------------|
| **File Operations** | Upload, download, streaming | Binary data, signed URLs |
| **Authentication** | OAuth callbacks, logout | External redirects, cookies |
| **External Integrations** | Webhooks, third-party APIs | Public endpoints |
| **Real-time Features** | WebSockets, SSE | Connection handling |
| **Complex HTTP Logic** | Custom headers, status codes | HTTP protocol features |
| **Non-HTML Responses** | JSON APIs, file streams | Response type flexibility |

### Use **Server Actions/SSR** when you need:

| Scenario | Example | Why Server Action? |
|----------|---------|-------------------|
| **Data Fetching** | Get documents, user profile | Type safety, caching |
| **Form Submissions** | Create, update, delete | Direct integration |
| **Database Operations** | CRUD operations | Performance, security |
| **Server-Side Logic** | Validation, business rules | No client exposure |
| **Component Integration** | Loading states, errors | Seamless UX |

## 📁 Real Examples from Our Codebase

### ✅ Correctly Using API Routes

```typescript
// /api/documents/[id]/download/route.ts
export async function GET(request: Request) {
  // ✅ File operation - needs signed URL generation
  const { data: signedUrl } = await supabase.storage
    .from('obra-vault')
    .createSignedUrl(storagePath, 3600);
  return NextResponse.json({ url: signedUrl.signedUrl });
}
```

```typescript
// /api/process-document/route.ts  
export async function POST(request: Request) {
  // ✅ File processing - handles FormData uploads
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const result = await processDocument(file);
  return NextResponse.json(result);
}
```

### ✅ Correctly Using Server Actions

```typescript
// actions/document-actions.ts
export async function getDocumentExtractedData(documentId: string) {
  // ✅ Data fetching - pure data operation
  const supabase = await createClient();
  const { data } = await supabase
    .from('obra_documents')
    .select('*, extracted_data:document_extracted_data(*)')
    .eq('id', documentId)
    .single();
  return data;
}
```

## 🚀 Migration Strategy

### When to Migrate API Route → Server Action

```typescript
// ❌ API Route for simple data fetching
export async function GET(request: Request) {
  const data = await database.query('SELECT * FROM documents');
  return NextResponse.json(data);
}

// ✅ Server Action instead
export async function getDocuments() {
  const data = await database.query('SELECT * FROM documents');
  return data;
}
```

### When to Keep API Route

```typescript
// ✅ Keep as API Route - file operation
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  // Complex file processing, external access needed
  return NextResponse.json(result);
}
```

## 🔍 Quick Decision Checklist

Before creating an API route, ask:

- [ ] **Does it handle files?** → API Route
- [ ] **Is it called by external services?** → API Route  
- [ ] **Does it need custom HTTP headers/status codes?** → API Route
- [ ] **Is it pure data fetching/mutation?** → Server Action
- [ ] **Does it integrate with components?** → Server Action
- [ ] **Is it part of SSR?** → Server Action

## 🎯 Best Practices

### API Routes
```typescript
// ✅ Good: Specific purpose, external interface
/api/documents/[id]/download
/api/webhooks/stripe
/api/auth/callback

// ❌ Avoid: Simple data operations
/api/documents/list
/api/users/profile
```

### Server Actions
```typescript
// ✅ Good: Data operations, component integration
getDocuments()
updateUserProfile()
deleteDocument()

// ❌ Avoid: File operations, external interfaces
uploadFile() // Use API route instead
handleWebhook() // Use API route instead
```

## 📚 Summary

**API Routes** are for **external interfaces** and **file operations**  
**Server Actions** are for **data operations** and **component integration**

This separation provides:
- Better performance (server actions)
- Proper external access (API routes)  
- Type safety (server actions)
- File handling capability (API routes)
- Clean architecture

When in doubt: If it touches files or external services → API Route. If it's data for your UI → Server Action.