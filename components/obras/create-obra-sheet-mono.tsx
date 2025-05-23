'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react'
import { Minus, Plus } from 'lucide-react'

import { obraBaseSchema, type ObraBaseFormValues, obraEstadoEnum } from '@/lib/schemas/obra-schemas';
import { createObraAction } from '@/app/actions/obras/create-obra-action';

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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/utils';
import { CustomDateFieldWithDuration } from './custom-date-field-with-duration';
import { CustomDateField } from './custom-date-field';
import { AnimatedTextarea } from '@/components/ui/animated-textarea';
import { Separator } from '../ui/separator';

// Mock data for selects - replace with actual fetched data
const mockSelectOptions = [
  { value: 'id-1', label: 'Option 1' },
  { value: 'id-2', label: 'Option 2' },
  { value: 'id-3', label: 'Option 3' },
];

interface CreateObraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // onObraCreated?: (newObra: Obra) => void; // Callback for optimistic updates/refresh
}

export function CreateObraSheet({ isOpen, onClose }: CreateObraSheetProps) {
  // Initialize form first
  const form = useForm<ObraBaseFormValues>({
    defaultValues: {
      nombre: '',
      descripcion: '',
      fechaInicio: null,
      fechaFin: null,
      estado: '',
      reparticionId: '',
      areaId: '',
      tipoObraId: '',
      presupuestoOficial: null,
      fechaBasico: null,
      expediente: '',
    },
    onSubmit: async ({ value }) => {
      execute(value);
    },
    validators: {
      onChange: obraBaseSchema,
    },
  });

  // Initialize action after form, so execute is available in onSubmit if needed (though not strictly necessary here)
  const { execute, status } = useAction(createObraAction, {
    onSuccess: (actionResponseData) => {
      if (actionResponseData?.success && actionResponseData.data) {
        toast.success(`Obra "${actionResponseData.data.nombre}" creada con éxito.`);
        form.reset();
        onClose();
        // onObraCreated?.(actionResponseData.data); // Adjust if Obra is nested deeper
      } else {
        toast.error(actionResponseData?.error?.message || 'Error al crear la obra.');
      }
    },
    onError: (error) => {
      let errorMessage = 'Ocurrió un error al crear la obra.';
      if (error.serverError) {
        errorMessage = `Error del servidor: ${error.serverError}`;
      } else if (error.validationErrors) {
        errorMessage = 'Error de validación. Por favor revise los campos.';
      } else if (error.fetchError) {
        errorMessage = `Error de red: ${error.fetchError}`;
      } else if (error.bindArgsValidationErrors) {
        errorMessage = 'Error en los argumentos de la acción.';
      }
      toast.error(errorMessage);
    },
  });

  const isLoading = status === 'executing';

  // Handle sheet open change for resetting form if needed
  React.useEffect(() => {
    if (!isOpen) {
      // Optional: Reset form when sheet closes if desired
      // form.reset();
    }
  }, [isOpen, form]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl rounded-2xl w-full overflow-y-auto bg-white/60 backdrop-blur-sm p-2">
        <div className='flex flex-col gap-6 bg-white border w-full h-full p-4 rounded-xl' >
          <form
            id="create-obra-form" // Give form an ID
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="pb-6 gap-3"
          >
            {/* Mimic structure of ObraEditForm / InvoiceForm */}
            <form.Field
              name="nombre"
              validators={{ onChange: obraBaseSchema.shape.nombre }}
              children={(field) => (
                <FieldWrapper label="" className="pb-2" field={field as any}>
                  <CustomInput
                    variant="cammo"
                    id={field.name}
                    name={field.name}
                    value={field.state.value ? field.state.value : 'Obra 01'}
                    className="w-full text-3xl"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isLoading}
                  />
                </FieldWrapper>
              )}
            />

            <div className="flex flex-col pb-6 gap-6">

              <div className='flex flex-col'>
                <form.Field
                  name="expediente"
                  validators={{ onChange: obraBaseSchema.shape.expediente }}
                  children={(field) => (
                    <FieldWrapper label="Expediente" className='flex-row items-center' field={field as any}>
                      <CustomInput
                        variant="show-empty"
                        id={field.name}
                        name={field.name}
                        value={field.state.value ? field.state.value : 'EXP-0001'}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isLoading}
                      />
                    </FieldWrapper>
                  )}
                />
                <form.Field
                  name="fechaCreacion"
                  validators={{ onChange: obraBaseSchema.shape.fechaCreacion }}
                  children={(field) => (
                    <CustomDateField
                      field={field as any}
                      label="Fecha de Creación"
                      value={field.state.value ? field.state.value : new Date()}
                      disabled={isLoading}
                    />
                  )}
                />
                <form.Field
                  name="fechaInicioPrevista"
                  validators={{ onChange: obraBaseSchema.shape.fechaInicioPrevista }}
                  children={(field) => (
                    <CustomDateField
                      field={field as any}
                      label="Fecha de Inicio Prevista"
                      value={field.state.value ? field.state.value : ''}
                      emptyValue={'No definida'}
                      className='w-full'
                      disabled={isLoading}
                    />
                  )}
                />

                {/* <form.Field
                name="fechaInicio"
                validators={{ onChange: obraBaseSchema.shape.fechaInicio }}
                children={(field) => (
                  <CustomDateField
                    field={field as any}
                    label="Fecha de Inicio"
                    value={field.state.value ? field.state.value : new Date()}
                    disabled={isLoading}
                  />
                )}
              />
              <form.Field
                name="duracion"
                validators={{ onChange: obraBaseSchema.shape.duracion }}
                children={(field) => (
                  <FieldWrapper label="Duración en días:" className="font-mono text-xs text-primary/80 max-w-full flex-row items-center" field={field as any}>
                    <NumberFlowInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value ? field.state.value : 0}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      disabled={isLoading}
                      className="text-base font-normal"
                      min={0}
                      max={365}
                    />
                  </FieldWrapper>
                )}
              />
              <form.Field
                name="fechaFin"
                validators={{ onChange: obraBaseSchema.shape.fechaFin }}
                children={(field) => (
                  <CustomDateField
                    field={field as any}
                    label="Fecha de Fin"
                    disabled={isLoading}
                  />
                )}
              /> */}

              </div>

              <Separator className='w-full' variant="dashed" />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-10 w-2/3'>

                <div className='flex flex-col gap-4'>

                  <form.Field
                    name="fechaBasico"
                    validators={{ onChange: obraBaseSchema.shape.fechaBasico }}
                    children={(field) => (
                      <CustomDateField
                        field={field as any}
                        label="Fecha de Básico"
                        disabled={isLoading}
                        value={""}
                        className='w-full max-w-full flex-col gap-2 h-max '
                      />
                    )}
                  />
                  {/* Repeat similar Select fields for areaId and tipoObraId using mockSelectOptions */}
                  <form.Field
                    name="areaId"
                    validators={{ onChange: obraBaseSchema.shape.areaId }}
                    children={(field) => (
                      <FieldWrapper label="Área:" className='' field={field as any}>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={field.name} onBlur={field.handleBlur}
                            className={cn('text-sm border-none h-min p-0 pl-3 w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:data-[placeholder]:text-muted-foreground data-[placeholder]:text-transparent focus:data-[placeholder]:text-muted-foreground',
                              field.state.value ? 'text-primary' : 'bg-dashedInput focus:bg-none hover:bg-none hover:text-primary text-transparent')}
                          >
                            <SelectValue placeholder="Seleccionar área" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSelectOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label} (Área)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                  <form.Field
                    name="tipoObraId"
                    validators={{ onChange: obraBaseSchema.shape.tipoObraId }}
                    children={(field) => (
                      <FieldWrapper label="Tipo de Obra:" className='' field={field as any}>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={field.name} onBlur={field.handleBlur}
                            className={cn('text-sm border-none h-min p-0 pl-3 w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:data-[placeholder]:text-muted-foreground data-[placeholder]:text-transparent focus:data-[placeholder]:text-muted-foreground',
                              field.state.value ? 'text-primary' : 'bg-dashedInput focus:bg-none hover:bg-none hover:text-primary text-transparent')}
                          >
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSelectOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label} (Tipo)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />
                </div>

                <div className='flex flex-col gap-4'>
                  <form.Field
                    name="estado"
                    validators={{ onChange: obraBaseSchema.shape.estado }}
                    children={(field) => (
                      <FieldWrapper label="Estado Inicial:" className=' min-w-max' field={field as any}>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={field.name} onBlur={field.handleBlur}
                            className={cn('text-sm border-none h-min p-0 pl-3 w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[placeholder]:text-transparent hover:data-[placeholder]:text-muted-foreground focus:data-[placeholder]:text-muted-foreground',
                              field.state.value ? 'text-primary' : 'bg-dashedInput focus:bg-none hover:bg-none hover:text-primary text-transparent')}
                          >
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

                  {/* Selects for related entities - using mock data */}
                  <form.Field
                    name="reparticionId"
                    validators={{ onChange: obraBaseSchema.shape.reparticionId }}
                    children={(field) => (
                      <FieldWrapper label="Repartición:" className='' field={field as any}>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={field.name} onBlur={field.handleBlur}
                            className={cn('text-sm border-none h-min p-0 pl-3 w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:data-[placeholder]:text-muted-foreground data-[placeholder]:text-transparent focus:data-[placeholder]:text-muted-foreground',
                              field.state.value ? 'text-primary' : 'bg-dashedInput focus:bg-none hover:bg-none hover:text-primary text-transparent')}
                          >
                            <SelectValue placeholder="Seleccionar repartición" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSelectOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldWrapper>
                    )}
                  />

                </div>

              </div>

            </div>


            <form.Field
              name="descripcion"
              validators={{ onChange: obraBaseSchema.shape.descripcion }}
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
                  <FieldWrapper label="Descripción (Opcional)" field={field as any}>
                    <AnimatedTextarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Detalles adicionales sobre la obra..."
                      disabled={isLoading}
                      error={hasError}
                      className={`${baseClasses} ${dynamicClasses}`}
                      rows={3}
                    />
                  </FieldWrapper>
                );
              }}
            />

            <form.Field
              name="presupuestoOficial"
              validators={{
                onChange: obraBaseSchema.shape.presupuestoOficial,
              }}
              children={(field) => (
                <FieldWrapper label="Presupuesto Oficial" field={field as any}>
                  <CustomInput
                    variant="show-empty"
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.handleChange(val === '' ? null : parseFloat(val));
                    }}
                    className='text-xs'
                    disabled={isLoading}
                    step="0.01"
                  />
                </FieldWrapper>
              )}
            />
          </form>
          <SheetFooter className="mt-auto pt-6">
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" form="create-obra-form" disabled={isLoading || !form.state.canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creando...' : 'Crear Obra'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet >
  );
}

// --- Reusable Helper Components (copied from ObraEditForm for simplicity) ---

function FieldWrapper({ label, className, field, children }: {
  label: string;
  className?: string;
  field: { name: string; state: { meta: { touchedErrors?: string[] } } };
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2 ", className)}>
      <Label htmlFor={field.name} className={cn("text-xs font-mono text-primary/80 min-w-max", className)}>{label}</Label>
      {children}
      {field.state.meta.touchedErrors && field.state.meta.touchedErrors.length > 0 && (
        <p className="text-sm text-destructive">
          {field.state.meta.touchedErrors.join(', ')}
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
          selected={calendarSelectedDate}
          onSelect={(dateValue) => field.handleChange(dateValue ?? null)}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
} 