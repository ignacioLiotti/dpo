import { z } from "zod";

// Base validation helpers
const uuidSchema = z.string().uuid("ID inválido");

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

// Obra estado enum - matching database enum
export const obraEstadoEnum = z.enum(["PLANIFICADA", "EN_EJECUCION", "FINALIZADA", "SUSPENDIDA", "CANCELADA"]);
export type ObraEstado = z.infer<typeof obraEstadoEnum>;

// Base obra schema for creation
export const createObraSchema = z.object({
  obra_name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(255, "El nombre no puede exceder los 255 caracteres"),
  provincia: z.string()
    .min(2, "La provincia debe tener al menos 2 caracteres")
    .max(100, "La provincia no puede exceder los 100 caracteres"),
  departamento: z.string()
    .min(2, "El departamento debe tener al menos 2 caracteres")
    .max(100, "El departamento no puede exceder los 100 caracteres"),
  calle: z.string()
    .min(2, "La calle debe tener al menos 2 caracteres")
    .max(255, "La calle no puede exceder los 255 caracteres"),
  ubicacion_google_maps: z.string()
    .url("La ubicación debe ser una URL válida de Google Maps")
    .optional()
    .nullable(),
  presupuesto: z.number()
    .positive("El presupuesto debe ser un número positivo"),
  descripcion: z.string()
    .max(1000, "La descripción no puede exceder los 1000 caracteres")
    .optional()
    .nullable(),
  fecha_inicio: z.coerce.date().nullable().optional(),
  fecha_fin: z.coerce.date().nullable().optional(),
  estado: obraEstadoEnum.default("PLANIFICADA"),
  reparticion_id: z.number()
    .int()
    .min(1)
    .max(Object.keys(REPARTICIONES).length),
  area_id: z.number()
    .int()
    .min(1)
    .max(Object.keys(AREAS).length),
  tipo_obra_id: z.number()
    .int()
    .min(1)
    .max(Object.keys(TIPOS_OBRA).length),
  presupuesto_oficial: z.number()
    .positive("El presupuesto oficial debe ser un número positivo")
    .optional()
    .nullable(),
  fecha_basico: z.coerce.date().nullable().optional(),
  expediente: z.string()
    .max(100, "El expediente no puede exceder los 100 caracteres")
    .optional()
    .nullable(),
  fecha_inicio_prevista: z.coerce.date().nullable().optional(),
  duracion: z.number()
    .int("La duración debe ser un número entero")
    .min(0, "La duración no puede ser negativa")
    .optional()
    .nullable(),
  user_id: uuidSchema.optional().nullable(),
});

// Update obra schema (includes ID)
export const updateObraSchema = createObraSchema.extend({
  id: uuidSchema,
});

// Delete obra schema
export const deleteObraSchema = z.object({
  id: uuidSchema,
});

// Get obra schema
export const getObraSchema = z.object({
  id: uuidSchema,
});

// Filter obras schema
export const filterObrasSchema = z.object({
  search: z.string().optional(),
  estado: obraEstadoEnum.optional(),
  reparticion_id: z.number().optional(),
  area_id: z.number().optional(),
  tipo_obra_id: z.number().optional(),
  fecha_inicio: z.coerce.date().optional(),
  fecha_fin: z.coerce.date().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Export types
export type CreateObraFormValues = z.infer<typeof createObraSchema>;
export type UpdateObraFormValues = z.infer<typeof updateObraSchema>;
export type DeleteObraFormValues = z.infer<typeof deleteObraSchema>;
export type GetObraFormValues = z.infer<typeof getObraSchema>;
export type FilterObrasFormValues = z.infer<typeof filterObrasSchema>;

// Legacy export for backward compatibility
export const obraBaseSchema = createObraSchema;
export type ObraBaseFormValues = CreateObraFormValues; 