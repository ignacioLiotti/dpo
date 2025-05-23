'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import type { Obra } from '@/types/obra';
import { updateObraSchema, type UpdateObraFormValues, obraEstadoEnum } from '@/lib/schemas/obra-schemas';
import { updateObraAction } from '@/app/actions/obras/update-obra-action';

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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/utils';

interface ObraEditFormProps {
  obra: Obra;
}

// TODO: Properly type TanStack Form fields when upgrading to the latest version
// Current type assertions are a temporary solution until we can properly fix the types
type FormFieldApi = any;

export function ObraEditForm({ obra }: ObraEditFormProps) {
  // Initialize form with obra data
  console.log(obra);
  const form = useForm<UpdateObraFormValues>({
    defaultValues: obra,
    onSubmit: async ({ value }) => {
      execute(value);
    },
    validators: {
      onChange: updateObraSchema,
    },
  });

  const { execute, status } = useAction(updateObraAction, {
    onSuccess: (response) => {
      if (response.data?.success && response.data.data) {
        toast.success(`Obra "${response.data.data.nombre}" actualizada con éxito.`);
      } else {
        toast.error(response.data?.error?.message || 'Error al actualizar la obra.');
      }
    },
    onError: (error) => {
      console.error('Error in updateObraAction:', error);
      toast.error('Error al actualizar la obra. Por favor, intente nuevamente.');
    },
  });

  const isLoading = status === 'executing';

  // Keep form in sync with obra prop changes
  // React.useEffect(() => {
  //   form.reset({
  //     id: obra.id,
  //     nombre: obra.nombre,
  //     descripcion: obra.descripcion || '',
  //     fechaInicio: obra.fechaInicio ? new Date(obra.fechaInicio) : null,
  //     fechaFin: obra.fechaFin ? new Date(obra.fechaFin) : null,
  //     estado: obra.estado,
  //     reparticionId: obra.reparticionId,
  //     areaId: obra.areaId,
  //     tipoObraId: obra.tipoObraId,
  //     presupuestoOficial: obra.presupuestoOficial || null,
  //     fechaBasico: obra.fechaBasico ? new Date(obra.fechaBasico) : null,
  //     expediente: obra.expediente || '',
  //   });
  // }, [obra]);

  console.log(form.state);

  return (
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
          name="nombre"
          children={(field) => (
            <FieldWrapper label="Nombre de la Obra" field={field}>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value ? field.state.value : ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ej: Construcción Edificio Central"
                disabled={isLoading}
              />
              <div>
                {field.state.value} bolas
              </div>
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
            name="fechaInicio"
            children={(field) => (
              <FieldWrapper label="Fecha de Inicio (Opcional)" field={field}>
                <DatePickerField field={field} disabled={isLoading} />
              </FieldWrapper>
            )}
          />
          <form.Field
            name="fechaFin"
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
                onValueChange={(value) => field.handleChange(value)}
                disabled={isLoading}
              >
                <SelectTrigger id={field.name} onBlur={field.handleBlur}>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {obraEstadoEnum.options.map((estadoValue) => (
                    <SelectItem key={estadoValue} value={estadoValue}>
                      {estadoValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
            name="presupuestoOficial"
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
            name="fechaBasico"
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
  );
}

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