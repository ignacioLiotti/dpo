-- Create obra estado enum
create type "obra_estado" as enum (
  'PLANIFICADA',
  'EN_EJECUCION',
  'FINALIZADA',
  'SUSPENDIDA',
  'CANCELADA'
); 