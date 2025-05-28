'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { CalendarIcon, FileText, Hash, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { certificateSchema, type CertificateFormValues } from '@/supabase/schemas/obra-documents-schemas';
import { createObraDocumentAction } from '@/app/actions/obra-documents/create-obra-document-action';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CreateCertificateFormProps {
  obraId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCertificateForm({ obraId, onSuccess, onCancel }: CreateCertificateFormProps) {
  const form = useForm<CertificateFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>({
    defaultValues: {
      obra_id: obraId,
      titulo: '',
      tipo: 'CERTIFICADO' as const,
      numero_documento: '',
      fecha_emision: new Date(),
      descripcion: '',
      archivo_url: null,
      user_id: null,
    },
    onSubmit: async ({ value }) => {
      console.log("Submitting certificate:", value);
      execute(value);
    },
    validators: {
      onSubmit: certificateSchema,
    },
  });

  const { execute, status } = useAction(createObraDocumentAction, {
    onSuccess: (actionResponseData) => {
      if (actionResponseData.data?.success && actionResponseData.data.data) {
        toast.success(`Certificado "${actionResponseData.data.data.titulo}" creado con éxito.`);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(actionResponseData.data?.error?.message || 'Error al crear el certificado.');
      }
    },
    onError: (errorData) => {
      console.error("Action error:", errorData);
      let errorMessage = 'Ocurrió un error al crear el certificado.';

      if (errorData.error) {
        if (errorData.error.serverError) {
          errorMessage = `Error del servidor: ${errorData.error.serverError}`;
        } else if (errorData.error.validationErrors) {
          errorMessage = 'Error de validación. Por favor revise los campos.';
        }
      }

      toast.error(errorMessage);
    },
  });

  const isLoading = status === 'executing';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Crear Certificado
        </CardTitle>
        <CardDescription>
          Complete los datos del certificado para esta obra
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Título */}
          <form.Field
            name="titulo"
            validators={{
              onChange: ({ value }) =>
                !value ? 'El título es requerido' : 
                value.length < 3 ? 'El título debe tener al menos 3 caracteres' : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Título del Certificado
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Ej: Certificado de Avance de Obra N°1"
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-red-500"
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Número de Documento */}
          <form.Field
            name="numero_documento"
            validators={{
              onChange: ({ value }) =>
                !value ? 'El número de certificado es requerido' : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Número de Certificado
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Ej: CERT-001-2024"
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-red-500"
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Fecha de Emisión */}
          <form.Field name="fecha_emision">
            {(field) => (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Emisión
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.state.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.state.value ? (
                        format(field.state.value, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.state.value}
                      onSelect={(date) => field.handleChange(date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </form.Field>

          {/* Descripción */}
          <form.Field name="descripcion">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Descripción adicional del certificado..."
                  rows={3}
                />
              </div>
            )}
          </form.Field>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creando...' : 'Crear Certificado'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 