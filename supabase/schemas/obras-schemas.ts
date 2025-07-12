    // supabase/schemas/obras-schemas.ts
    import { z } from "zod";
    import { Constants } from '@/supabase.types'; // Import the generated enums

    // Predefined values with incremental IDs
    export const AREAS = {
      CONSTRUCCIONES: { id: 1, nombre: "Construcciones" },
      PROYECTOS: { id: 2, nombre: "Proyectos" },
      INSPECCIONES: { id: 3, nombre: "Inspecciones" },
      ADMINISTRACION: { id: 4, nombre: "Administración" },
    } as const;

    export const REPARTICIONES = {
      ARQUITECTURA: { id: 1, nombre: "Dirección de Arquitectura" },
      VIVIENDA: { id: 2, nombre: "Dirección de Vivienda" },
      VIALIDAD: { id: 3, nombre: "Dirección de Vialidad" },
      HIDRAULICA: { id: 4, nombre: "Dirección de Hidráulica" },
    } as const;

    export const TIPOS_OBRA = {
      OBRA_NUEVA: { id: 1, nombre: "Obra Nueva" },
      REFACCION: { id: 2, nombre: "Refacción" },
      AMPLIACION: { id: 3, nombre: "Ampliación" },
      RESTAURACION: { id: 4, nombre: "Restauración" },
      INFRAESTRUCTURA_VIAL: { id: 5, nombre: "Infraestructura Vial" },
      INFRAESTRUCTURA_HIDRAULICA: { id: 6, nombre: "Infraestructura Hidráulica" },
    } as const;

    // Helper types
    export type Area = typeof AREAS[keyof typeof AREAS];
    export type Reparticion = typeof REPARTICIONES[keyof typeof REPARTICIONES];
    export type TipoObra = typeof TIPOS_OBRA[keyof typeof TIPOS_OBRA];

    // Arrays for easy mapping in UI
    export const AREAS_ARRAY = Object.values(AREAS);
    export const REPARTICIONES_ARRAY = Object.values(REPARTICIONES);
    export const TIPOS_OBRA_ARRAY = Object.values(TIPOS_OBRA);

    // Use the enum values from supabase.types.ts for consistency
    // Ensure this array matches the one in supabase.types.ts Constants.public.Enums.obra_estado
    const obraEstadoEnumValues = Constants.public.Enums.obra_estado;

    export const obraBaseSchema = z.object({
      // Existing fields
      obra_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(255, "El nombre no puede exceder los 255 caracteres."),
      provincia: z.string().min(2, "La provincia debe tener al menos 2 caracteres.").max(100, "La provincia no puede exceder los 100 caracteres."),
      departamento: z.string().min(2, "El departamento debe tener al menos 2 caracteres.").max(100, "El departamento no puede exceder los 100 caracteres."),
      calle: z.string().min(2, "La calle debe tener al menos 2 caracteres.").max(255, "La calle no puede exceder los 255 caracteres."),
      ubicacion_google_maps: z.string().url("La ubicación debe ser una URL válida de Google Maps").optional().nullable(),
      presupuesto: z.number().positive("El presupuesto debe ser un número positivo."),
      user_id: z.string().uuid("ID de usuario inválido.").optional().nullable(),

      // Add other fields from your form's defaultValues / supabase.types.ts Insert type
      // Ensure types (string, number, date, nullability, optionality) match your needs and Supabase schema
      descripcion: z.string().optional().nullable(),
      fecha_inicio: z.date().nullable(), // Or z.coerce.date() if input might be string
      fecha_fin: z.date().nullable(),    // Or z.coerce.date()
      estado: z.enum(obraEstadoEnumValues).default(obraEstadoEnumValues[0]), // Use the imported enum values
      reparticion_id: z.number().int().min(1).max(Object.keys(REPARTICIONES).length),
      area_id: z.number().int().min(1).max(Object.keys(AREAS).length),
      tipo_obra_id: z.number().int().min(1).max(Object.keys(TIPOS_OBRA).length),
      presupuesto_oficial: z.number().optional().nullable(),
      fecha_basico: z.date().nullable(), // Or z.coerce.date()
      expediente: z.string().optional().nullable(),
      fecha_creacion: z.date().default(() => new Date()), // Default to now
      fecha_inicio_prevista: z.date().nullable(), // Or z.coerce.date()
      duracion: z.number().int("La duración debe ser un número entero.").min(0, "La duración no puede ser negativa.").optional().nullable(),
    });

    export type ObraBaseFormValues = z.infer<typeof obraBaseSchema>;

    // updateObraSchema remains as is or can be adjusted if needed
    export const updateObraSchema = obraBaseSchema.extend({
      id: z.string().uuid("ID de obra inválido."),
    });
    export type UpdateObraFormValues = z.infer<typeof updateObraSchema>;

    // The old obraEstadoEnum can be removed if you're using the one from supabase.types.ts
    // export const obraEstadoEnum = z.enum(["pendiente", "en_progreso", "completada"]);