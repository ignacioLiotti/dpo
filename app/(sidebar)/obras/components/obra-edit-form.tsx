'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import type { Database } from '@/supabase.types';
import { updateObraSchema, type UpdateObraFormValues } from '../schema';
import { updateObraAction } from '../actions/update-obra-action';

// Removed unused processor imports

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  Loader2,
  Edit3,
  X,
  MapPin,
  DollarSign,
  Calendar as CalendarDays,
  FileText,
  Building,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/utils';
import { Constants } from '@/supabase.types';
import router from 'next/router';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ObraProfilePageProps {
  obra: Database['public']['Tables']['obras']['Row'];
}

type FormFieldApi = any;

// State change interface
interface StateChangeRequest {
  targetState: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export default function Component({ obra }: ObraProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isButton, setIsButton] = useState(false);
  const [stateChangeRequest, setStateChangeRequest] = useState<StateChangeRequest | null>(null);
  const [isProcessingStateChange, setIsProcessingStateChange] = useState(false);
  const [stateManager] = useState(() => ObraStateManager.create());

  const form = useForm({
    defaultValues: {
      id: obra.id,
      obra_name: obra.obra_name,
      provincia: obra.provincia,
      departamento: obra.departamento,
      calle: obra.calle,
      ubicacion_google_maps: obra.ubicacion_google_maps ?? null,
      presupuesto: obra.presupuesto,
      user_id: obra.user_id ?? null,
      descripcion: obra.descripcion ?? null,
      fecha_inicio: obra.fecha_inicio ? new Date(obra.fecha_inicio) : null,
      fecha_fin: obra.fecha_fin ? new Date(obra.fecha_fin) : null,
      estado: obra.estado,
      reparticion_id: obra.reparticion_id,
      area_id: obra.area_id,
      tipo_obra_id: obra.tipo_obra_id,
      presupuesto_oficial: obra.presupuesto_oficial ?? null,
      fecha_basico: obra.fecha_basico ? new Date(obra.fecha_basico) : null,
      expediente: obra.expediente ?? null,
      fecha_creacion: obra.fecha_creacion ? new Date(obra.fecha_creacion) : null,
      fecha_inicio_prevista: obra.fecha_inicio_prevista ? new Date(obra.fecha_inicio_prevista) : null,
      duracion: obra.duracion ?? null,
    },
    onSubmit: async ({ value }) => {
      execute(value);
    },
    validators: {
      onChange: ({ value }) => {
        const result = updateObraSchema.safeParse(value);
        if (!result.success) {
          return result.error.flatten().formErrors.join(', ') || result.error.flatten().fieldErrors.obra_name?.join(', ') || 'Error de validación';
        }
        return undefined;
      },
    },
  });

  const { execute, status } = useAction(updateObraAction, {
    onSuccess: (response) => {
      if (response.data?.success && response.data.data) {
        toast.success(`Obra "${response.data.data.obra_name}" actualizada con éxito.`);
        setIsEditing(false);
      } else {
        toast.error((response.data as any)?.error?.message || 'Error al actualizar la obra.');
      }
    },
    onError: (error) => {
      console.error('Error in updateObraAction:', error);
      toast.error('Error al actualizar la obra. Por favor, intente nuevamente.');
    },
  });

  // State management functions
  const handleStateChange = async (targetState: string, reason?: string) => {
    if (!obra.id) return;

    setIsProcessingStateChange(true);

    try {
      const context: ProcessorContext = {
        userId: obra.user_id || 'unknown',
        timestamp: new Date(),
        metadata: {
          reason,
          obraId: obra.id,
          previousState: obra.estado,
        },
      };

      const result = await stateManager.processStateChange({
        entityId: obra.id,
        currentState: obra.estado,
        targetState,
        context,
        metadata: { reason },
      });

      if (result.success && result.data) {
        // Update the form state
        form.setFieldValue('estado', targetState as any);

        // Show success message with actions
        toast.success(`Estado cambiado a ${targetState}`, {
          description: `Se ejecutarán ${result.data.actions.length} acciones y ${result.data.notifications.length} notificaciones.`,
        });

        // Log actions that would be executed

        // Here you would typically execute the actions and send notifications
        // For now, we'll just log them

        setStateChangeRequest(null);
      } else {
        toast.error(`Error al cambiar estado: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing state change:', error);
      toast.error('Error al procesar el cambio de estado');
    } finally {
      setIsProcessingStateChange(false);
    }
  };

  const getValidTransitions = () => {
    return stateManager.getValidTransitions(obra.estado as any);
  };

  const isLoading = status === 'executing';

  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'EN_EJECUCION':
        return 'default';
      case 'FINALIZADA':
        return 'secondary';
      case 'SUSPENDIDA':
        return 'outline';
      case 'CANCELADA':
        return 'destructive';
      case 'PLANIFICADA':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No especificado';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Editando Obra</h1>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              form.reset();
            }}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-8 bg-card p-6 rounded-lg shadow-md"
        >
          <Fieldset legend="Información General">
            <form.Field
              name="obra_name"
              children={(field) => (
                <FieldWrapper label="Nombre de la Obra" field={field}>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ej: Construcción Edificio Central"
                    disabled={isLoading}
                  />
                </FieldWrapper>
              )}
            />

            <form.Field
              name="descripcion"
              children={(field) => (
                <FieldWrapper label="Descripción (Opcional)" field={field}>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Detalles adicionales sobre la obra..."
                    disabled={isLoading}
                    rows={4}
                  />
                </FieldWrapper>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="fecha_inicio"
                children={(field) => (
                  <FieldWrapper label="Fecha de Inicio (Opcional)" field={field}>
                    <DatePickerField field={field} disabled={isLoading} />
                  </FieldWrapper>
                )}
              />
              <form.Field
                name="fecha_fin"
                children={(field) => (
                  <FieldWrapper label="Fecha de Fin (Opcional)" field={field}>
                    <DatePickerField field={field} disabled={isLoading} />
                  </FieldWrapper>
                )}
              />
            </div>

            <form.Field
              name="estado"
              children={(field) => (
                <FieldWrapper label="Estado de la Obra" field={field}>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value as any);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id={field.name} onBlur={field.handleBlur}>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Constants?.public?.Enums?.obra_estado || ['PLANIFICADA', 'EN_EJECUCION', 'FINALIZADA', 'SUSPENDIDA', 'CANCELADA']).map((estadoValue) => (
                        <SelectItem key={estadoValue} value={estadoValue}>
                          {formatEstado(estadoValue)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldWrapper>
              )}
            />
          </Fieldset>

          <Fieldset legend="Detalles Administrativos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="presupuesto_oficial"
                children={(field) => (
                  <FieldWrapper label="Presupuesto Oficial (ARS, Opcional)" field={field}>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.handleChange(val === '' ? null : Number(val));
                      }}
                      placeholder="Ej: 1500000.00"
                      disabled={isLoading}
                      step="0.01"
                    />
                  </FieldWrapper>
                )}
              />
              <form.Field
                name="fecha_basico"
                children={(field) => (
                  <FieldWrapper label="Fecha de Básico (Opcional)" field={field}>
                    <DatePickerField field={field} disabled={isLoading} />
                  </FieldWrapper>
                )}
              />
            </div>
            <form.Field
              name="expediente"
              children={(field) => (
                <FieldWrapper label="Número de Expediente (Opcional)" field={field}>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ej: EXP-2024-00123"
                    disabled={isLoading}
                  />
                </FieldWrapper>
              )}
            />
          </Fieldset>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading || !form.state.isDirty}>
              Restablecer Cambios
            </Button>
            <Button type="submit" disabled={isLoading || !form.state.canSubmit || !form.state.isDirty}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{obra.obra_name}</h1>
          <p className="text-muted-foreground text-lg">
            {obra.calle}, {obra.departamento}, {obra.provincia}
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="shrink-0">
          <Edit3 className="w-4 h-4 mr-2" />
          Editar Obra
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and State Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Estado de la Obra
                </CardTitle>
                <Badge variant={getEstadoBadgeVariant(obra.estado)}>
                  {formatEstado(obra.estado)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {obra.descripcion && (
                <p className="text-muted-foreground leading-relaxed">{obra.descripcion}</p>
              )}
              {!obra.descripcion && (
                <p className="text-muted-foreground italic">No hay descripción disponible</p>
              )}

              {/* State Transition Controls */}
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Cambiar Estado:</h4>
                <div className="flex flex-wrap gap-2">
                  {getValidTransitions().map((targetState) => (
                    <Button
                      key={targetState}
                      variant="outline"
                      size="sm"
                      onClick={() => setStateChangeRequest({ targetState })}
                      disabled={isProcessingStateChange}
                      className="flex items-center gap-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                      {formatEstado(targetState)}
                    </Button>
                  ))}
                </div>

                {getValidTransitions().length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay transiciones de estado disponibles desde el estado actual.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* State Change Confirmation */}
              {stateChangeRequest && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <p>
                      ¿Confirmar cambio de estado de <strong>{formatEstado(obra.estado)}</strong> a{' '}
                      <strong>{formatEstado(stateChangeRequest.targetState)}</strong>?
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Motivo del cambio (opcional)"
                        value={stateChangeRequest.reason || ''}
                        onChange={(e) => setStateChangeRequest({
                          ...stateChangeRequest,
                          reason: e.target.value
                        })}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleStateChange(stateChangeRequest.targetState, stateChangeRequest.reason)}
                        disabled={isProcessingStateChange}
                      >
                        {isProcessingStateChange ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Confirmar'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStateChangeRequest(null)}
                        disabled={isProcessingStateChange}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Presupuesto</p>
                  <p className="text-lg font-semibold">{formatCurrency(obra.presupuesto)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Presupuesto Oficial</p>
                  <p className="text-lg font-semibold">{formatCurrency(obra.presupuesto_oficial)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-medium">{formatDate(obra.fecha_inicio)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                  <p className="font-medium">{formatDate(obra.fecha_fin)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">{formatDate(obra.fecha_creacion)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Básico</p>
                  <p className="font-medium">{formatDate(obra.fecha_basico)}</p>
                </div>
              </div>
              {obra.duracion && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Duración</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <p className="font-medium">{obra.duracion} días</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administrative Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalles Administrativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Expediente</p>
                  <p className="font-medium">{obra.expediente || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ID de Repartición</p>
                  <p className="font-medium">{obra.reparticion_id || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ID de Área</p>
                  <p className="font-medium">{obra.area_id || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Obra ID</p>
                  <p className="font-medium">{obra.tipo_obra_id || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                <p className="font-medium">{obra.calle}</p>
                <p className="text-sm text-muted-foreground">
                  {obra.departamento}, {obra.provincia}
                </p>
              </div>

              {obra.ubicacion_google_maps && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Mapa</p>
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO7SMDggWwSVic&q=${encodeURIComponent(obra.ubicacion_google_maps)}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(obra.ubicacion_google_maps)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en Google Maps
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant={getEstadoBadgeVariant(obra.estado)} className="text-xs">
                    {formatEstado(obra.estado)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Presupuesto:</span>
                  <span className="text-sm font-medium">{formatCurrency(obra.presupuesto)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Inicio:</span>
                  <span className="text-sm font-medium">{formatDate(obra.fecha_inicio)}</span>
                </div>
                {obra.duracion && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Duración:</span>
                      <span className="text-sm font-medium">{obra.duracion} días</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components (same as before)
interface FieldWrapperProps {
  label: string;
  field: FormFieldApi;
  children: React.ReactNode;
}

function FieldWrapper({ label, field, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      {children}
      {field.state.meta.touchedErrors && field.state.meta.touchedErrors.length > 0 && (
        <p className="text-sm text-destructive">
          {field.state.meta.touchedErrors.join(', ')}
        </p>
      )}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border p-4 rounded-md space-y-6">
      <legend className="text-lg font-medium px-1 -ml-1">{legend}</legend>
      {children}
    </fieldset>
  );
}

interface DatePickerFieldProps {
  field: FormFieldApi;
  disabled?: boolean;
}

function DatePickerField({ field, disabled }: DatePickerFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={field.name}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !field.state.value && "text-muted-foreground"
          )}
          onBlur={field.handleBlur}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.state.value ? format(new Date(field.state.value), "PPP") : <span>Seleccionar fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={field.state.value ? new Date(field.state.value) : undefined}
          onSelect={(date) => field.handleChange(date)}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
