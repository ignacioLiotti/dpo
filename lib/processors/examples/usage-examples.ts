import { DocumentClient } from "../document/document-client";
import { ObraStateManager } from "../state/obra-state-manager";
import type { ProcessorContext } from "../index";

// Example 1: Document Processing
export async function processContractDocument() {
  // Simulate a contract file upload
  const file = new File(["contract content"], "contrato_obra_123.pdf", {
    type: "application/pdf",
  });

  const context: ProcessorContext = {
    userId: "user123",
    teamId: "dpo-team",
    timestamp: new Date(),
    metadata: {
      uploadSource: "web_interface",
      department: "obras_publicas",
    },
  };

  // Create document client (auto-detects contract type)
  const documentClient = await DocumentClient.createFromFile(
    file,
    "contrato_obra_123.pdf",
    "application/pdf"
  );

  // Process the document
  const result = await documentClient.processDocument({
    file,
    fileName: "contrato_obra_123.pdf",
    contentType: "application/pdf",
    context,
  });

  if (result.success && result.data) {
    console.log("Contract processed successfully:");
    console.log("- Contract Number:", result.data.extractedData.contractNumber);
    console.log("- Contractor:", result.data.extractedData.contractor.name);
    console.log("- Amount:", result.data.extractedData.contractAmount);
    console.log("- Confidence:", result.confidence);
  } else {
    console.error("Document processing failed:", result.error);
  }

  return result;
}

// Example 2: State Management
export async function changeObraState() {
  const stateManager = ObraStateManager.create();

  const context: ProcessorContext = {
    userId: "supervisor123",
    timestamp: new Date(),
    metadata: {
      reason: "Todos los permisos aprobados y presupuesto confirmado",
    },
  };

  // Change obra from PLANIFICADA to EN_EJECUCION
  const stateChangeResult = await stateManager.processStateChange({
    entityId: "obra_456",
    currentState: "PLANIFICADA",
    targetState: "EN_EJECUCION",
    context,
  });

  if (stateChangeResult.success && stateChangeResult.data) {
    console.log("State change successful:");
    console.log("- New State:", stateChangeResult.data.newState);
    console.log("- Actions to execute:", stateChangeResult.data.actions.length);
    console.log("- Notifications:", stateChangeResult.data.notifications.length);
    
    // Execute actions
    for (const action of stateChangeResult.data.actions) {
      console.log(`Action: ${action.type} - ${action.description}`);
    }
  } else {
    console.error("State change failed:", stateChangeResult.error);
  }

  return stateChangeResult;
}

// Example 3: Integration with existing obra actions
export async function integratedObraWorkflow() {
  // This would integrate with your existing obra actions
  const obraId = "obra_789";
  const userId = "user123";

  try {
    // 1. Process uploaded contract document
    console.log("Step 1: Processing contract document...");
    const contractResult = await processContractDocument();

    if (!contractResult.success) {
      throw new Error("Contract processing failed");
    }

    // 2. Extract contract data and update obra
    const contractData = contractResult.data?.extractedData;
    console.log("Step 2: Updating obra with contract data...");
    
    // Here you would call your existing updateObraAction with extracted data
    // await updateObraAction({
    //   id: obraId,
    //   contrato_numero: contractData.contractNumber,
    //   contratista: contractData.contractor.name,
    //   monto_contrato: contractData.contractAmount,
    //   // ... other fields
    // });

    // 3. Change state to EN_EJECUCION
    console.log("Step 3: Changing obra state...");
    const stateManager = ObraStateManager.create();
    
    const stateResult = await stateManager.processStateChange({
      entityId: obraId,
      currentState: "PLANIFICADA",
      targetState: "EN_EJECUCION",
      context: {
        userId,
        timestamp: new Date(),
        metadata: {
          contractProcessed: true,
          contractNumber: contractData?.contractNumber,
        },
      },
    });

    if (!stateResult.success) {
      throw new Error("State change failed");
    }

    // 4. Execute generated actions
    console.log("Step 4: Executing generated actions...");
    for (const action of stateResult.data!.actions) {
      await executeAction(action);
    }

    // 5. Send notifications
    console.log("Step 5: Sending notifications...");
    for (const notification of stateResult.data!.notifications) {
      await sendNotification(notification);
    }

    console.log("Integrated workflow completed successfully!");
    return {
      success: true,
      obraId,
      contractData,
      stateChange: stateResult.data,
    };

  } catch (error) {
    console.error("Integrated workflow failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper functions for the integrated workflow
async function executeAction(action: any) {
  console.log(`Executing action: ${action.type}`);
  
  switch (action.type) {
    case 'budget_approval':
      // Integrate with budget approval system
      console.log("- Verifying budget approval...");
      break;
    case 'permit_check':
      // Check permit status
      console.log("- Checking permits...");
      break;
    case 'start_progress_tracking':
      // Initialize progress tracking
      console.log("- Starting progress tracking...");
      break;
    case 'notify_stakeholders':
      // Notify relevant stakeholders
      console.log("- Notifying stakeholders...");
      break;
    default:
      console.log(`- Unknown action type: ${action.type}`);
  }
}

async function sendNotification(notification: any) {
  console.log(`Sending ${notification.type} notification to:`, notification.recipients);
  console.log(`Template: ${notification.template}`);
  
  // Here you would integrate with your notification system
  // - Email service
  // - SMS service
  // - Push notifications
  // - System notifications
}

// Example 4: Batch document processing
export async function batchDocumentProcessing() {
  const documents = [
    { name: "contrato_001.pdf", type: "contract" },
    { name: "factura_001.pdf", type: "invoice" },
    { name: "permiso_construccion.pdf", type: "permit" },
    { name: "plano_arquitectonico.dwg", type: "blueprint" },
  ];

  const results = [];

  for (const doc of documents) {
    console.log(`Processing ${doc.name}...`);
    
    const file = new File([`${doc.type} content`], doc.name, {
      type: doc.name.endsWith('.dwg') ? 'application/dwg' : 'application/pdf',
    });

    const client = await DocumentClient.createFromFile(
      file,
      doc.name,
      file.type
    );

    const result = await client.processDocument({
      file,
      fileName: doc.name,
      contentType: file.type,
      context: {
        userId: "batch_processor",
        timestamp: new Date(),
        metadata: { batchId: "batch_001" },
      },
    });

    results.push({
      document: doc.name,
      success: result.success,
      type: result.data?.documentType,
      confidence: result.confidence,
      error: result.error,
    });
  }

  console.log("Batch processing results:", results);
  return results;
}

// Example 5: State transition validation
export async function validateStateTransitions() {
  const stateManager = ObraStateManager.create();
  
  const states = ['PLANIFICADA', 'EN_EJECUCION', 'FINALIZADA', 'SUSPENDIDA', 'CANCELADA'];
  
  console.log("Valid state transitions:");
  for (const state of states) {
    const validTransitions = stateManager.getValidTransitions(state as any);
    console.log(`${state} -> [${validTransitions.join(', ')}]`);
  }
}

// Export all examples for easy testing
export const examples = {
  processContractDocument,
  changeObraState,
  integratedObraWorkflow,
  batchDocumentProcessing,
  validateStateTransitions,
}; 