// Base processor interfaces and types

export interface ProcessorResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ProcessorContext {
  userId: string;
  teamId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Document processing types
export interface DocumentProcessorInput {
  file: File | Buffer;
  fileName: string;
  contentType: string;
  context: ProcessorContext;
}

export interface ProcessedDocument {
  extractedData: Record<string, any>;
  documentType: string;
  confidence: number;
  metadata: {
    fileSize: number;
    processingTime: number;
    ocrProvider?: string;
    aiProvider?: string;
  };
}

export interface DocumentProcessor {
  processDocument(input: DocumentProcessorInput): Promise<ProcessorResult<ProcessedDocument>>;
  getSupportedTypes(): string[];
  getProcessorName(): string;
}

// State management types
export interface StateChangeInput {
  entityId: string;
  currentState: string;
  targetState: string;
  context: ProcessorContext;
  metadata?: Record<string, any>;
}

export interface StateChangeResult {
  newState: string;
  actions: StateAction[];
  validations: ValidationResult[];
  notifications: NotificationAction[];
}

export interface StateAction {
  type: string;
  description: string;
  data: Record<string, any>;
  executeAt?: Date;
}

export interface ValidationResult {
  field: string;
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'system';
  recipients: string[];
  template: string;
  data: Record<string, any>;
}

export interface StateProcessor {
  processStateChange(input: StateChangeInput): Promise<ProcessorResult<StateChangeResult>>;
  getValidTransitions(): string[];
  getProcessorName(): string;
}

// Budget processing types
export interface BudgetChangeInput {
  obraId: string;
  changeType: 'redeterminacion' | 'adicional' | 'ampliacion';
  amount?: number;
  percentage?: number;
  justification: string;
  context: ProcessorContext;
  metadata?: Record<string, any>;
}

export interface BudgetChangeResult {
  newBudget: number;
  changeAmount: number;
  approvalRequired: boolean;
  calculations: BudgetCalculation[];
  documents: DocumentReference[];
}

export interface BudgetCalculation {
  description: string;
  formula: string;
  baseAmount: number;
  result: number;
  factors: Record<string, number>;
}

export interface DocumentReference {
  type: string;
  name: string;
  url?: string;
  required: boolean;
}

export interface BudgetProcessor {
  processBudgetChange(input: BudgetChangeInput): Promise<ProcessorResult<BudgetChangeResult>>;
  getSupportedChangeTypes(): string[];
  getProcessorName(): string;
}

// Report generation types
export interface ReportGenerationInput {
  reportType: string;
  entityId: string;
  parameters: Record<string, any>;
  format: 'pdf' | 'excel' | 'json' | 'html';
  context: ProcessorContext;
}

export interface GeneratedReport {
  reportId: string;
  format: string;
  content: Buffer | string;
  metadata: {
    generatedAt: Date;
    parameters: Record<string, any>;
    size: number;
  };
}

export interface ReportProcessor {
  generateReport(input: ReportGenerationInput): Promise<ProcessorResult<GeneratedReport>>;
  getSupportedReportTypes(): string[];
  getSupportedFormats(): string[];
  getProcessorName(): string;
} 