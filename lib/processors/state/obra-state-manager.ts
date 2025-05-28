import type {
  StateProcessor,
  StateChangeInput,
  ProcessorResult,
  StateChangeResult,
  StateAction,
  ValidationResult,
  NotificationAction,
} from "../index";

export type ObraEstado = 'PLANIFICADA' | 'EN_EJECUCION' | 'FINALIZADA' | 'SUSPENDIDA' | 'CANCELADA';

// Base state processor implementation
abstract class BaseStateProcessor implements StateProcessor {
  abstract getProcessorName(): string;
  abstract getValidTransitions(): string[];

  async processStateChange(
    input: StateChangeInput
  ): Promise<ProcessorResult<StateChangeResult>> {
    try {
      const validations = await this.validateStateChange(input);
      const actions = await this.generateActions(input);
      const notifications = await this.generateNotifications(input);

      const result: StateChangeResult = {
        newState: input.targetState,
        actions,
        validations,
        notifications,
      };

      return {
        success: true,
        data: result,
        confidence: 1.0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'State processing failed',
      };
    }
  }

  protected abstract validateStateChange(input: StateChangeInput): Promise<ValidationResult[]>;
  protected abstract generateActions(input: StateChangeInput): Promise<StateAction[]>;
  protected abstract generateNotifications(input: StateChangeInput): Promise<NotificationAction[]>;
}

// Concrete state processors
class PlanificadaProcessor extends BaseStateProcessor {
  getProcessorName(): string {
    return "PlanificadaProcessor";
  }

  getValidTransitions(): string[] {
    return ['EN_EJECUCION', 'CANCELADA'];
  }

  protected async validateStateChange(input: StateChangeInput): Promise<ValidationResult[]> {
    return [
      {
        field: 'budget',
        isValid: true,
        message: 'Presupuesto aprobado',
        severity: 'info',
      },
      {
        field: 'permits',
        isValid: true,
        message: 'Permisos verificados',
        severity: 'info',
      },
    ];
  }

  protected async generateActions(input: StateChangeInput): Promise<StateAction[]> {
    return [
      {
        type: 'budget_approval',
        description: 'Verificar aprobación de presupuesto',
        data: { obraId: input.entityId },
      },
      {
        type: 'permit_check',
        description: 'Verificar permisos necesarios',
        data: { obraId: input.entityId },
      },
    ];
  }

  protected async generateNotifications(input: StateChangeInput): Promise<NotificationAction[]> {
    return [
      {
        type: 'system',
        recipients: [input.context.userId],
        template: 'obra_planificada',
        data: { obraId: input.entityId },
      },
    ];
  }
}

class EnEjecucionProcessor extends BaseStateProcessor {
  getProcessorName(): string {
    return "EnEjecucionProcessor";
  }

  getValidTransitions(): string[] {
    return ['FINALIZADA', 'SUSPENDIDA', 'CANCELADA'];
  }

  protected async validateStateChange(input: StateChangeInput): Promise<ValidationResult[]> {
    return [
      {
        field: 'team_assignment',
        isValid: true,
        message: 'Equipo asignado correctamente',
        severity: 'info',
      },
      {
        field: 'materials',
        isValid: true,
        message: 'Materiales disponibles',
        severity: 'info',
      },
    ];
  }

  protected async generateActions(input: StateChangeInput): Promise<StateAction[]> {
    return [
      {
        type: 'start_progress_tracking',
        description: 'Iniciar seguimiento de progreso',
        data: { obraId: input.entityId },
      },
      {
        type: 'notify_stakeholders',
        description: 'Notificar inicio a stakeholders',
        data: { obraId: input.entityId },
      },
    ];
  }

  protected async generateNotifications(input: StateChangeInput): Promise<NotificationAction[]> {
    return [
      {
        type: 'email',
        recipients: ['supervisor@dpo.gov.ar'],
        template: 'obra_iniciada',
        data: { obraId: input.entityId },
      },
    ];
  }
}

class FinalizadaProcessor extends BaseStateProcessor {
  getProcessorName(): string {
    return "FinalizadaProcessor";
  }

  getValidTransitions(): string[] {
    return [];
  }

  protected async validateStateChange(input: StateChangeInput): Promise<ValidationResult[]> {
    return [
      {
        field: 'completion',
        isValid: true,
        message: 'Obra completada al 100%',
        severity: 'info',
      },
      {
        field: 'final_inspection',
        isValid: true,
        message: 'Inspección final aprobada',
        severity: 'info',
      },
    ];
  }

  protected async generateActions(input: StateChangeInput): Promise<StateAction[]> {
    return [
      {
        type: 'generate_completion_report',
        description: 'Generar reporte de finalización',
        data: { obraId: input.entityId },
      },
      {
        type: 'release_final_payment',
        description: 'Liberar pago final',
        data: { obraId: input.entityId },
      },
    ];
  }

  protected async generateNotifications(input: StateChangeInput): Promise<NotificationAction[]> {
    return [
      {
        type: 'email',
        recipients: ['director@dpo.gov.ar'],
        template: 'obra_finalizada',
        data: { obraId: input.entityId },
      },
    ];
  }
}

class SuspendidaProcessor extends BaseStateProcessor {
  getProcessorName(): string {
    return "SuspendidaProcessor";
  }

  getValidTransitions(): string[] {
    return ['EN_EJECUCION', 'CANCELADA'];
  }

  protected async validateStateChange(input: StateChangeInput): Promise<ValidationResult[]> {
    return [
      {
        field: 'suspension_reason',
        isValid: !!input.metadata?.reason,
        message: input.metadata?.reason ? 'Motivo de suspensión registrado' : 'Se requiere motivo de suspensión',
        severity: input.metadata?.reason ? 'info' : 'error',
      },
    ];
  }

  protected async generateActions(input: StateChangeInput): Promise<StateAction[]> {
    return [
      {
        type: 'pause_work',
        description: 'Pausar trabajos en obra',
        data: { obraId: input.entityId, reason: input.metadata?.reason },
      },
      {
        type: 'secure_site',
        description: 'Asegurar sitio de obra',
        data: { obraId: input.entityId },
      },
    ];
  }

  protected async generateNotifications(input: StateChangeInput): Promise<NotificationAction[]> {
    return [
      {
        type: 'system',
        recipients: [input.context.userId],
        template: 'obra_suspendida',
        data: { obraId: input.entityId, reason: input.metadata?.reason },
      },
    ];
  }
}

class CanceladaProcessor extends BaseStateProcessor {
  getProcessorName(): string {
    return "CanceladaProcessor";
  }

  getValidTransitions(): string[] {
    return [];
  }

  protected async validateStateChange(input: StateChangeInput): Promise<ValidationResult[]> {
    return [
      {
        field: 'cancellation_reason',
        isValid: !!input.metadata?.reason,
        message: input.metadata?.reason ? 'Motivo de cancelación registrado' : 'Se requiere motivo de cancelación',
        severity: input.metadata?.reason ? 'info' : 'error',
      },
    ];
  }

  protected async generateActions(input: StateChangeInput): Promise<StateAction[]> {
    return [
      {
        type: 'cancel_contracts',
        description: 'Cancelar contratos asociados',
        data: { obraId: input.entityId, reason: input.metadata?.reason },
      },
      {
        type: 'process_final_payments',
        description: 'Procesar pagos finales',
        data: { obraId: input.entityId },
      },
    ];
  }

  protected async generateNotifications(input: StateChangeInput): Promise<NotificationAction[]> {
    return [
      {
        type: 'email',
        recipients: ['legal@dpo.gov.ar'],
        template: 'obra_cancelada',
        data: { obraId: input.entityId, reason: input.metadata?.reason },
      },
    ];
  }
}

// Main state manager class
export class ObraStateManager {
  private processors: Map<ObraEstado, StateProcessor>;

  constructor() {
    this.processors = new Map<ObraEstado, StateProcessor>([
      ['PLANIFICADA', new PlanificadaProcessor()],
      ['EN_EJECUCION', new EnEjecucionProcessor()],
      ['FINALIZADA', new FinalizadaProcessor()],
      ['SUSPENDIDA', new SuspendidaProcessor()],
      ['CANCELADA', new CanceladaProcessor()],
    ]);
  }

  async processStateChange(
    input: StateChangeInput
  ): Promise<ProcessorResult<StateChangeResult>> {
    try {
      // Validate state transition
      const transitionValidation = this.validateTransition(
        input.currentState as ObraEstado,
        input.targetState as ObraEstado
      );

      if (!transitionValidation.isValid) {
        return {
          success: false,
          error: transitionValidation.message,
          metadata: {
            invalidTransition: true,
            from: input.currentState,
            to: input.targetState,
          },
        };
      }

      // Get the appropriate processor for the target state
      const processor = this.processors.get(input.targetState as ObraEstado);
      
      if (!processor) {
        return {
          success: false,
          error: `No processor found for state: ${input.targetState}`,
        };
      }

      // Process the state change
      const result = await processor.processStateChange(input);

      // Add transition metadata
      if (result.success && result.data) {
        result.data.actions.unshift({
          type: 'state_transition',
          description: `Estado cambiado de ${input.currentState} a ${input.targetState}`,
          data: {
            previousState: input.currentState,
            newState: input.targetState,
            timestamp: new Date().toISOString(),
            userId: input.context.userId,
          },
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'State change processing failed',
        metadata: {
          processingError: true,
          input,
        },
      };
    }
  }

  private validateTransition(
    currentState: ObraEstado,
    targetState: ObraEstado
  ): ValidationResult {
    // Define valid state transitions
    const validTransitions: Record<ObraEstado, ObraEstado[]> = {
      PLANIFICADA: ['EN_EJECUCION', 'CANCELADA'],
      EN_EJECUCION: ['FINALIZADA', 'SUSPENDIDA', 'CANCELADA'],
      FINALIZADA: [], // Final state - no transitions allowed
      SUSPENDIDA: ['EN_EJECUCION', 'CANCELADA'],
      CANCELADA: [], // Final state - no transitions allowed
    };

    const allowedTransitions = validTransitions[currentState] || [];
    const isValid = allowedTransitions.includes(targetState);

    return {
      field: 'state_transition',
      isValid,
      message: isValid 
        ? 'Transición válida'
        : `Transición no permitida de ${currentState} a ${targetState}`,
      severity: isValid ? 'info' : 'error',
    };
  }

  public getValidTransitions(currentState: ObraEstado): ObraEstado[] {
    const validTransitions: Record<ObraEstado, ObraEstado[]> = {
      PLANIFICADA: ['EN_EJECUCION', 'CANCELADA'],
      EN_EJECUCION: ['FINALIZADA', 'SUSPENDIDA', 'CANCELADA'],
      FINALIZADA: [],
      SUSPENDIDA: ['EN_EJECUCION', 'CANCELADA'],
      CANCELADA: [],
    };

    return validTransitions[currentState] || [];
  }

  public getAllProcessors(): Map<ObraEstado, StateProcessor> {
    return this.processors;
  }

  public getProcessor(state: ObraEstado): StateProcessor | undefined {
    return this.processors.get(state);
  }

  // Static factory method
  static create(): ObraStateManager {
    return new ObraStateManager();
  }
} 