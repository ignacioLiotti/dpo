'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react'
import { Minus, Plus } from 'lucide-react'

import { createObraSchema, type CreateObraFormValues, AREAS_ARRAY, REPARTICIONES_ARRAY, TIPOS_OBRA_ARRAY } from '../schema';
import { createObraAction } from '../actions/create-obra-action';
import { Constants } from '@/supabase.types';

import { Button } from '@/components/ui/button';
import { CustomInput } from '@/components/ui/custom-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/utils';
import { CustomDateField } from './custom-date-field';
import { AnimatedTextarea } from '@/components/ui/animated-textarea';
import { Separator } from '@/components/ui/separator';

interface CreateObraSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateObraSheet({ isOpen, onClose }: CreateObraSheetProps) {
  // Initialize form first
  const form = useForm({
    defaultValues: {
      obra_name: 'Obra de Prueba Automática',
      provincia: 'Provincia Ejemplo',
      departamento: 'Departamento Ejemplo',
      calle: 'Calle Falsa 123',
      ubicacion_google_maps: 'https://maps.google.com/?q=-31.4135,-64.181',
      presupuesto: 1000000,
      // TODO: Replace with actual user ID logic
      user_id: '00000000-0000-0000-0000-000000000000',
      descripcion: 'Esta es una descripción de prueba para la obra generada automáticamente.',
      fecha_inicio: new Date(),
      // Calculate fecha_fin based on fecha_inicio and duracion for consistency
      // fecha_fin will be set reactively or before submission
      fecha_fin: null as Date | null,
      estado: Constants.public.Enums.obra_estado[0], // Default to first state (PLANIFICADA)
      reparticion_id: REPARTICIONES_ARRAY[0]?.id || 1,
      area_id: 1, // Setting to a valid area_id
      tipo_obra_id: TIPOS_OBRA_ARRAY[0]?.id || 1,
      presupuesto_oficial: 1200000,
      fecha_basico: new Date(),
      expediente: `EXP-AUTO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      // Add missing default values from schema
      fecha_creacion: new Date(),
      fecha_inicio_prevista: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
      duracion: 30, // Default duration
    },
    onSubmit: async ({ value }) => {
      console.log("value submit", value);
      let finalValue = { ...value };
      if (value.fecha_inicio && typeof value.duracion === 'number' && !value.fecha_fin) {
        const startDate = new Date(value.fecha_inicio);
        finalValue.fecha_fin = new Date(startDate.setDate(startDate.getDate() + value.duracion));
      }
      execute(finalValue as CreateObraFormValues);
    },
  });

  const { execute, status } = useAction(createObraAction, {
    onSuccess: (actionResponseData) => {
      console.log("actionResponseData", actionResponseData);
      if (actionResponseData.data?.success && actionResponseData.data.data) {
        toast.success(`Obra "${actionResponseData.data.data.obra_name}" creada con éxito.`);
        form.reset();
        onClose();
      } else {
        toast.error('Error al crear la obra.');
      }
    },
    onError: (errorData) => {
      console.error("Action error object:", JSON.stringify(errorData, null, 2));
      let errorMessage = 'Ocurrió un error al crear la obra.';

      if (errorData.error) {
        if (errorData.error.serverError) {
          errorMessage = `Error del servidor: ${errorData.error.serverError}`;
        } else if (errorData.error.validationErrors) {
          errorMessage = 'Error de validación. Por favor revise los campos.';
          // Log specific validation errors to console for debugging
          console.error("Validation Errors:", errorData.error.validationErrors);
        } else if (errorData.error.bindArgsValidationErrors) {
          errorMessage = 'Error en los argumentos de la acción.';
        }
      }

      toast.error(errorMessage || 'Error al crear la obra.');
    },
  });

  const isLoading = status === 'executing';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-3xl rounded-2xl w-full overflow-y-auto floating-scroll bg-white/60 backdrop-blur-sm p-2">
        <SheetHeader>
          {/* just for screen readers */}
          <SheetTitle className='hidden h-0 w-0' aria-hidden="true">Crear Obra</SheetTitle>
        </SheetHeader>
        <div className='flex flex-col gap-6 bg-white border w-full py-4 px-8 rounded-xl' >
          <form
            id="create-obra-form" // Give form an ID
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Manually calculate fecha_fin before submitting if not already set
              const currentValues = form.state.values;
              let submissionValues = { ...currentValues };
              if (currentValues.fecha_inicio && typeof currentValues.duracion === 'number' && !currentValues.fecha_fin) {
                const startDate = new Date(currentValues.fecha_inicio);
                const calculatedFinDate = new Date(startDate.setDate(startDate.getDate() + currentValues.duracion));
                submissionValues.fecha_fin = calculatedFinDate;
                form.setFieldValue('fecha_fin', calculatedFinDate);
              }

              console.log("form values for submit", submissionValues);
              console.log("form errors", form.state.errorMap);
              console.log("form canSubmit", form.state.canSubmit);
              form.handleSubmit();
            }}
            className="pb-6 pt-4 gap-3 h-full"
          >
            <div className='flex flex-col gap-6 h-full'>

              <form.Field
                name="obra_name"
                children={(field) => (
                  <CustomInput
                    variant="cammo"
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? 'Obra Sin Nombre'}
                    className="w-full text-3xl font-sans"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isLoading}
                  />
                )}
              />

              <div className="flex flex-col pb-6 gap-6">

                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4'>
                  <form.Field
                    name="expediente"
                    children={(field) => (
                      <FieldWrapper label="Expediente" className='flex-row items-center' field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isLoading}
                        />
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="fecha_creacion"
                    children={(field) => (
                      <CustomDateField
                        field={field as any}
                        label="Fecha de Creación"
                        value={field.state.value ?? new Date()}
                        disabled={isLoading}
                      />
                    )}
                  />
                  <form.Field
                    name="fecha_inicio_prevista"
                    children={(field) => (
                      <CustomDateField
                        field={field as any}
                        label="Fecha de Inicio Prevista"
                        value={field.state.value ?? undefined}
                        emptyValue={'No definida'}
                        className='w-full'
                        disabled={isLoading}
                      />
                    )}
                  />
                  <form.Field
                    name="fecha_inicio"
                    children={(field) => (
                      <CustomDateField
                        field={field as any}
                        label="Fecha de Inicio"
                        value={field.state.value ?? new Date()}
                        disabled={isLoading}
                      />
                    )}
                  />
                  <form.Field
                    name="duracion"
                    children={(field) => (
                      <FieldWrapper label="Duración en días:" className="font-mono text-xs text-primary/80 max-w-full flex-row items-center" field={field as any} submitCount={form.state.submissionAttempts}>
                        <NumberFlowInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? 0}
                          onBlur={field.handleBlur}
                          onChange={(value) => field.handleChange(value)}
                          disabled={isLoading}
                          className="text-base font-normal"
                          min={0}
                          max={10000} // Increased max for very long projects
                        />
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="fecha_fin"
                    // Validator can be tricky if it depends on fecha_inicio and duracion
                    // Consider validating this in the onSubmit logic or with a custom form-level validator
                    children={(field) => (
                      <CustomDateField
                        field={field as any}
                        label="Fecha de Fin (calculada)"
                        value={field.state.value ?? undefined} // Value will be derived
                        disabled // Typically disabled as it's calculated
                        className="opacity-50" // Add visual indication that it's calculated
                      />
                    )}
                  />
                </div>

                <Separator className='w-full' variant="dashed" />

                <div className='grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-4'>
                  <form.Field
                    name="provincia"
                    children={(field) => (
                      <FieldWrapper label="Provincia" field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isLoading}
                        />
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="departamento"
                    children={(field) => (
                      <FieldWrapper label="Departamento" field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isLoading}
                        />
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="calle"
                    children={(field) => (
                      <FieldWrapper label="Calle" field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isLoading}
                        />
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="ubicacion_google_maps"
                    children={(field) => (
                      <FieldWrapper label="Ubicación Google Maps (URL)" className="md:col-span-3" field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isLoading}
                          placeholder="https://maps.google.com/..."
                        />
                      </FieldWrapper>
                    )}
                  />
                </div>

                <Separator className='w-full' variant="dashed" />

                <div className='grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-4 items-start'>
                  <form.Field
                    name="area_id"
                    children={(field) => (
                      <FieldWrapper label="Área:" className='' field={field as any} submitCount={form.state.submissionAttempts}>
                        <Select
                          value={field.state.value?.toString() ?? ''}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 4) {
                              field.handleChange(numValue);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id={field.name}
                            onBlur={field.handleBlur}
                            disabled={isLoading}
                            className={cn(
                              'text-sm border-none font-mono h-min shadow-lite outline data-[placeholder]:outline-black/40 outline-black/80 outline-1 cursor-pointer py-1 px-3 w-full active:translate-y-[1px] active:shadow-clicked data-[state=open]:translate-y-[1px] data-[state=open]:shadow-clicked transition-all duration-100',
                              field.state.value ? 'text-primary' : ' hover:text-primary text-transparent'
                            )}
                          >
                            <SelectValue placeholder="Seleccionar área" />
                          </SelectTrigger>
                          <SelectContent>
                            {AREAS_ARRAY.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id.toString()}>
                                {opt.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="tipo_obra_id"
                    children={(field) => (
                      <FieldWrapper label="Tipo de Obra:" className='' field={field as any} submitCount={form.state.submissionAttempts}>
                        <Select
                          value={field.state.value?.toString() ?? undefined}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.handleChange(numValue as any);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id={field.name}
                            onBlur={field.handleBlur}
                            disabled={isLoading}
                            className={cn(
                              'text-sm border-none font-mono h-min shadow-lite outline data-[placeholder]:outline-black/40 outline-black/80 outline-1 cursor-pointer py-1 px-3 w-full active:translate-y-[1px] active:shadow-clicked data-[state=open]:translate-y-[1px] data-[state=open]:shadow-clicked transition-all duration-100',
                              field.state.value ? 'text-primary' : ' hover:text-primary text-transparent'
                            )}
                          >
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_OBRA_ARRAY.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id.toString()}>
                                {opt.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="estado"
                    children={(field) => (
                      <FieldWrapper label="Estado Inicial:" className=' min-w-max' field={field as any} submitCount={form.state.submissionAttempts}>
                        <Select
                          value={field.state.value ?? undefined}
                          onValueChange={(value) => {
                            if (value) {
                              field.handleChange(value as any);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id={field.name}
                            onBlur={field.handleBlur}
                            disabled={isLoading}
                            className={cn(
                              'text-sm border-none font-mono h-min shadow-lite outline data-[placeholder]:outline-black/40 outline-black/80 outline-1 cursor-pointer py-1 px-3 w-full active:translate-y-[1px] active:shadow-clicked data-[state=open]:translate-y-[1px] data-[state=open]:shadow-clicked transition-all duration-100',
                              field.state.value ? 'text-primary' : ' hover:text-primary text-transparent'
                            )}
                          >
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {Constants.public.Enums.obra_estado.map((estadoValue) => (
                              <SelectItem key={estadoValue} value={estadoValue}>
                                {estadoValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="reparticion_id"
                    children={(field) => (
                      <FieldWrapper label="Repartición:" className='' field={field as any} submitCount={form.state.submissionAttempts}>
                        <Select
                          value={field.state.value?.toString() ?? ''}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.handleChange(numValue as any);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            id={field.name}
                            onBlur={field.handleBlur}
                            disabled={isLoading}
                            className={cn(
                              'text-sm border-none font-mono h-min shadow-lite outline data-[placeholder]:outline-black/40 outline-black/80 outline-1 cursor-pointer py-1 px-3 w-full active:translate-y-[1px] active:shadow-clicked data-[state=open]:translate-y-[1px] data-[state=open]:shadow-clicked transition-all duration-100',
                              field.state.value ? 'text-primary' : ' hover:text-primary text-transparent'
                            )}
                          >
                            <SelectValue placeholder="Seleccionar repartición" />
                          </SelectTrigger>
                          <SelectContent>
                            {REPARTICIONES_ARRAY.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id.toString()}>
                                {opt.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="user_id" // Assuming user_id will be set programmatically or from context
                    children={(field) => (
                      <FieldWrapper label="ID Usuario (debug):" field={field as any} submitCount={form.state.submissionAttempts}>
                        <CustomInput
                          variant="show-empty"
                          id={field.name}
                          name={field.name}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled // Usually this would be hidden or auto-filled
                          className="text-xs opacity-50" // Make it less prominent
                        />
                      </FieldWrapper>
                    )}
                  />
                </div>
              </div>

              <form.Field
                name="descripcion"
                children={(field) => {
                  const hasError = field.state.meta.errors && field.state.meta.errors.length > 0;
                  const baseClasses = "rounded-none focus:bg-white border-none focus:bg-none placeholder:text-transparent focus:placeholder:text-muted-foreground focus:outline-none focus:outline-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0";
                  let dynamicClasses = "";

                  if (hasError) {
                    dynamicClasses = `border-red-500 bg-[repeating-linear-gradient(-60deg,#ef4444,#ef4444_1px,transparent_1px,transparent_6px)] border border-solid focus:bg-red-500/10`;
                  } else if (!field.state.value) {
                    dynamicClasses = `bg-dashedInput `;
                  }

                  return (
                    <FieldWrapper label="Descripción (Opcional)" field={field as any} submitCount={form.state.submissionAttempts}>
                      <AnimatedTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Detalles adicionales sobre la obra..."
                        disabled={isLoading}
                        error={hasError}
                        className={`${baseClasses} ${dynamicClasses} h-[150px]`}
                        rows={3}
                      />
                    </FieldWrapper>
                  );
                }}
              />
              <Separator className='w-full' variant="dashed" />
            </div>

            <div className='flex justify-between items-start gap-x-10 gap-y-6 pt-6'>

              <form.Field
                name="presupuesto"
                children={(field) => (
                  <FieldWrapper label="Presupuesto (Interno)" className='w-full' field={field as any} submitCount={form.state.submissionAttempts}>
                    <NumberFlowInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? 0}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      className='text-2xl w-full'
                      disabled={isLoading}
                      min={0}
                    />
                  </FieldWrapper>
                )}
              />
              <form.Field
                name="presupuesto_oficial"
                children={(field) => (
                  <FieldWrapper label="Presupuesto Oficial" className='w-full' field={field as any} submitCount={form.state.submissionAttempts}>
                    <NumberFlowInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? 0}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value === null ? 0 : Number(value))}
                      className='text-4xl w-full'
                      disabled={isLoading}
                      min={0}
                    />
                  </FieldWrapper>
                )}
              />
              <form.Field
                name="fecha_basico"
                children={(field) => (
                  <CustomDateField
                    field={field as any}
                    label="Fecha de Básico"
                    disabled={isLoading}
                    value={field.state.value ?? undefined}
                    emptyValue={'No definida'}
                    className='w-full flex-col gap-2 h-max'
                  />
                )}
              />
            </div>
            <SheetFooter className=" pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
              </SheetClose>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" form="create-obra-form" disabled={isLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creando...' : 'Crear Obra'}
                  </Button>
                )}
              />
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet >
  );
}

// --- Reusable Helper Components (copied from ObraEditForm for simplicity) ---

function FieldWrapper({ label, className, field, children, submitCount = 0 }: {
  label: string;
  className?: string;
  field: { name: string; state: { meta: { errorMap?: Record<string, any>; errors?: any[]; isTouched?: boolean } } };
  children: React.ReactNode;
  submitCount?: number;
}) {
  // Show errors if field is touched or form has been submitted at least once
  const showError =
    (field.state.meta.errors && field.state.meta.errors.length > 0) &&
    (field.state.meta.isTouched || submitCount > 0);
  // Support both errorMap and errors array
  const errorList = field.state.meta.errors ||
    (field.state.meta.errorMap && Object.values(field.state.meta.errorMap).flat()) || [];
  return (
    <div className={cn("flex flex-col gap-2 ", className)}>
      <Label htmlFor={field.name} className={cn("text-xs font-mono text-primary/80 min-w-max", className)}>{label}</Label>
      {children}
      {showError && errorList.length > 0 && (
        <p className="text-sm text-destructive">
          {errorList.join(', ')}
        </p>
      )}
    </div>
  );
}


type Props = {
  value?: number
  min?: number
  max?: number
  onChange?: (value: number) => void

  className?: string
  disabled?: boolean
  onBlur?: (value: number) => void
  name?: string
  id?: string
}
export default function NumberFlowInput({ value = 0, min = -Infinity, max = Infinity, onChange, className, disabled, onBlur, name, id }: Props) {
  const defaultValue = React.useRef(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [animated, setAnimated] = React.useState(true)
  // Hide the caret during transitions so you can't see it shifting around:
  const [showCaret, setShowCaret] = React.useState(true)
  const handleInput: React.ChangeEventHandler<HTMLInputElement> = ({ currentTarget: el }) => {
    setAnimated(false)
    let next = value
    if (el.value === '') {
      next = defaultValue.current
    } else {
      const num = el.valueAsNumber
      if (!isNaN(num) && min <= num && num <= max) next = num
    }
    // Manually update the input.value in case the number stays the same e.g. 09 == 9
    el.value = String(next)
    onChange?.(next)
  }
  const handlePointerDown = (diff: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    setAnimated(true)
    if (event.pointerType === 'mouse') {
      event?.preventDefault()
      inputRef.current?.focus()
    }
    const newVal = Math.min(Math.max(value + diff, min), max)
    onChange?.(newVal)
  }
  return (
    <div className={cn("group flex items-stretch rounded-md text-base font-mono font-semibold  text-transparent focus-within:text-primary", className, value === 0 ? "bg-dashedInput focus-within:bg-none hover:bg-none hover:text-primary" : "bg-transparent text-primary")}>
      <button
        aria-hidden="true"
        tabIndex={-1}
        className="flex items-center pl-[.5em] pr-[.325em]"
        disabled={min != null && value <= min}
        onPointerDown={handlePointerDown(-1)}
      >
        <Minus className="size-3" absoluteStrokeWidth strokeWidth={3.5} />
      </button>
      <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
        <input
          ref={inputRef}
          className={cn(
            showCaret ? 'caret-primary' : 'caret-transparent',
            'spin-hide w-[1.5em] bg-transparent text-center font-mono text-transparent outline-none'
          )}
          // Make sure to disable kerning, to match NumberFlow:
          style={{ fontKerning: 'none' }}
          type="number"
          min={min}
          step={1}
          autoComplete="off"
          // inputMode="numeric"
          max={max}
          value={value}
          onInput={handleInput}
        />
        <NumberFlow
          value={value}
          locales="en-US"
          format={{ useGrouping: false }}
          aria-hidden="true"
          animated={animated}
          onAnimationsStart={() => setShowCaret(false)}
          onAnimationsFinish={() => setShowCaret(true)}
          className="pointer-events-none"
          willChange
        />
      </div>
      <button
        aria-hidden="true"
        tabIndex={-1}
        className="flex items-center pl-[.325em] pr-[.5em]"
        disabled={max != null && value >= max}
        onPointerDown={handlePointerDown(1)}
      >
        <Plus className="size-3" absoluteStrokeWidth strokeWidth={3.5} />
      </button>
    </div>
  )
}

function DatePickerField({ field, disabled }: {
  field: {
    name: string;
    state: { value: Date | null | undefined };
    handleChange: (value: Date | null) => void;
    handleBlur: () => void;
  };
  disabled?: boolean
}) {
  const calendarSelectedDate = field.state.value ?? undefined;

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
          // onBlur={field.handleBlur}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {field.state.value ? format(field.state.value instanceof Date ? field.state.value : new Date(field.state.value), "PPP") : <span>Seleccionar fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 pointer-events-auto">
        <Calendar
          mode="single"
          selected={calendarSelectedDate instanceof Date ? calendarSelectedDate : undefined}
          onSelect={(dateValue) => field.handleChange(dateValue ?? null)}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
} 