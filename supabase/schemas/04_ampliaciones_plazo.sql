-- Create tipos_ampliacion_plazo table
create table "tipos_ampliacion_plazo" (
  "id" uuid primary key default gen_random_uuid(),
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Create ampliaciones_plazo table
create table "ampliaciones_plazo" (
  "id" uuid primary key default gen_random_uuid(),
  "obra_id" uuid not null references obras(id),
  "numero" integer not null check (numero > 0),
  "expediente" text,
  "dias" integer not null check (dias > 0),
  "fecha_aprobacion" timestamptz,
  "tipo_ampliacion_plazo_id" uuid not null references tipos_ampliacion_plazo(id),
  "descripcion" text check (char_length(descripcion) <= 1000),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- Add constraints
  constraint "unique_obra_ampliacion_numero" unique ("obra_id", "numero")
);

-- Enable Row Level Security
alter table "tipos_ampliacion_plazo" enable row level security;
alter table "ampliaciones_plazo" enable row level security;

-- Create indexes
create index "ampliaciones_plazo_obra_id_idx" on "ampliaciones_plazo" ("obra_id");
create index "ampliaciones_plazo_tipo_ampliacion_plazo_id_idx" on "ampliaciones_plazo" ("tipo_ampliacion_plazo_id");

-- Add updated_at triggers
create trigger update_tipos_ampliacion_plazo_updated_at
  before update on "tipos_ampliacion_plazo"
  for each row
  execute function update_updated_at_column();

create trigger update_ampliaciones_plazo_updated_at
  before update on "ampliaciones_plazo"
  for each row
  execute function update_updated_at_column(); 