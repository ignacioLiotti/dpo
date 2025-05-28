# Processor Pattern Implementation

This directory contains the implementation of the Processor Pattern for the DPO (Dirección Provincial de Obras Públicas) project. The pattern provides a flexible, extensible architecture for handling different types of data processing operations.

## Overview

The Processor Pattern is a behavioral design pattern that encapsulates algorithms and processing logic into interchangeable processor objects. This implementation provides:

- **Document Processing**: OCR and data extraction from various document types
- **State Management**: Obra state transitions with validation and actions
- **Budget Processing**: Budget change calculations and approvals
- **Report Generation**: Dynamic report creation in multiple formats

## Architecture

```
lib/processors/
├── index.ts                    # Core interfaces and types
├── document/                   # Document processing
│   ├── document-client.ts      # Main document processor client
│   ├── contract-processor.ts   # Contract document processor
│   ├── invoice-processor.ts    # Invoice document processor
│   ├── permit-processor.ts     # Permit document processor
│   ├── blueprint-processor.ts  # Blueprint document processor
│   └── generic-processor.ts    # Generic fallback processor
├── state/                      # State management
│   └── obra-state-manager.ts   # Obra state transition processor
├── examples/                   # Usage examples
│   └── usage-examples.ts       # Implementation examples
└── README.md                   # This file
```

## Core Interfaces

### ProcessorResult<T>
```typescript
interface ProcessorResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}
```

### ProcessorContext
```typescript
interface ProcessorContext {
  userId: string;
  teamId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## Document Processing

### Supported Document Types

1. **Contracts** (`ContractProcessor`)
   - Construction contracts
   - Service agreements
   - Maintenance contracts

2. **Invoices** (`InvoiceProcessor`)
   - Construction invoices
   - Material receipts
   - Service billing

3. **Permits** (`PermitProcessor`)
   - Building permits
   - Environmental permits
   - Safety authorizations

4. **Blueprints** (`BlueprintProcessor`)
   - Architectural drawings
   - Technical plans
   - CAD files

5. **Generic** (`GenericDocumentProcessor`)
   - Fallback for unknown types
   - Basic text extraction

### Usage Example

```typescript
import { DocumentClient } from "./document/document-client";

// Auto-detect document type and process
const client = await DocumentClient.createFromFile(
  file,
  "contrato_obra_123.pdf",
  "application/pdf"
);

const result = await client.processDocument({
  file,
  fileName: "contrato_obra_123.pdf",
  contentType: "application/pdf",
  context: {
    userId: "user123",
    timestamp: new Date(),
  },
});

if (result.success) {
  console.log("Extracted data:", result.data?.extractedData);
}
```

## State Management

### Obra State Transitions

The `ObraStateManager` handles state transitions for construction projects:

- **PLANIFICADA** → EN_EJECUCION, CANCELADA
- **EN_EJECUCION** → FINALIZADA, SUSPENDIDA, CANCELADA
- **FINALIZADA** → (final state)
- **SUSPENDIDA** → EN_EJECUCION, CANCELADA
- **CANCELADA** → (final state)

### Usage Example

```typescript
import { ObraStateManager } from "./state/obra-state-manager";

const stateManager = ObraStateManager.create();

const result = await stateManager.processStateChange({
  entityId: "obra_123",
  currentState: "PLANIFICADA",
  targetState: "EN_EJECUCION",
  context: {
    userId: "supervisor123",
    timestamp: new Date(),
    metadata: { reason: "All permits approved" },
  },
});

if (result.success) {
  // Execute generated actions
  for (const action of result.data.actions) {
    await executeAction(action);
  }
  
  // Send notifications
  for (const notification of result.data.notifications) {
    await sendNotification(notification);
  }
}
```

## Integration with Existing Actions

The processor pattern integrates seamlessly with your existing schema-first actions:

```typescript
// Example integration
async function processObraDocument(obraId: string, file: File) {
  // 1. Process document
  const documentResult = await DocumentClient.createFromFile(file, file.name, file.type)
    .then(client => client.processDocument({
      file,
      fileName: file.name,
      contentType: file.type,
      context: { userId: getCurrentUserId(), timestamp: new Date() }
    }));

  if (!documentResult.success) {
    throw new Error("Document processing failed");
  }

  // 2. Update obra with extracted data
  const extractedData = documentResult.data.extractedData;
  await updateObraAction({
    id: obraId,
    contrato_numero: extractedData.contractNumber,
    contratista: extractedData.contractor?.name,
    monto_contrato: extractedData.contractAmount,
  });

  // 3. Trigger state change if needed
  const stateManager = ObraStateManager.create();
  await stateManager.processStateChange({
    entityId: obraId,
    currentState: "PLANIFICADA",
    targetState: "EN_EJECUCION",
    context: {
      userId: getCurrentUserId(),
      timestamp: new Date(),
      metadata: { documentProcessed: true }
    }
  });
}
```

## Benefits

### 1. **Extensibility**
- Easy to add new document types
- Simple to extend state processors
- Pluggable architecture

### 2. **Maintainability**
- Separation of concerns
- Single responsibility principle
- Clear interfaces

### 3. **Testability**
- Isolated processor logic
- Mockable interfaces
- Unit testable components

### 4. **Type Safety**
- Full TypeScript support
- Compile-time validation
- IntelliSense support

### 5. **Consistency**
- Uniform error handling
- Standardized result format
- Common metadata structure

## Future Extensions

The processor pattern can be extended to support:

1. **Budget Processors**
   - Redetermination calculations
   - Additional work approvals
   - Cost escalation processing

2. **Report Processors**
   - Progress reports
   - Financial summaries
   - Compliance reports

3. **Notification Processors**
   - Email notifications
   - SMS alerts
   - Push notifications

4. **Integration Processors**
   - External API integrations
   - Data synchronization
   - Third-party services

## Best Practices

1. **Error Handling**
   ```typescript
   try {
     const result = await processor.process(input);
     if (!result.success) {
       // Handle processing failure
       console.error(result.error);
     }
   } catch (error) {
     // Handle unexpected errors
     console.error("Unexpected error:", error);
   }
   ```

2. **Confidence Scoring**
   ```typescript
   if (result.confidence && result.confidence < 0.8) {
     // Flag for manual review
     await flagForManualReview(result);
   }
   ```

3. **Metadata Usage**
   ```typescript
   const context: ProcessorContext = {
     userId: getCurrentUserId(),
     timestamp: new Date(),
     metadata: {
       source: "web_upload",
       department: "obras_publicas",
       batchId: generateBatchId(),
     },
   };
   ```

4. **Batch Processing**
   ```typescript
   const results = await Promise.all(
     files.map(file => processDocument(file))
   );
   
   const failed = results.filter(r => !r.success);
   if (failed.length > 0) {
     console.warn(`${failed.length} documents failed processing`);
   }
   ```

## Testing

Run the examples to test the implementation:

```typescript
import { examples } from "./examples/usage-examples";

// Test document processing
await examples.processContractDocument();

// Test state management
await examples.changeObraState();

// Test integrated workflow
await examples.integratedObraWorkflow();

// Test batch processing
await examples.batchDocumentProcessing();

// Validate state transitions
await examples.validateStateTransitions();
```

## Contributing

When adding new processors:

1. Implement the appropriate interface (`DocumentProcessor`, `StateProcessor`, etc.)
2. Add comprehensive error handling
3. Include confidence scoring
4. Add usage examples
5. Update this README

## License

This implementation is part of the DPO project and follows the same licensing terms. 