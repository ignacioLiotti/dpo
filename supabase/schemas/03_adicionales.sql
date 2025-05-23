-- Create tipos_adicional table
create table "tipos_adicional" (
  "id" uuid primary key default gen_random_uuid(),
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Create adicionales table
create table "adicionales" (
  "id" uuid primary key default gen_random_uuid(),
  "obra_id" uuid not null references obras(id),
  "numero" integer not null check (numero > 0),
  "expediente" text,
  "monto" decimal(15,2) not null check (monto > 0),
  "fecha_aprobacion" timestamptz,
  "tipo_adicional_id" uuid not null references tipos_adicional(id),
  "descripcion" text check (char_length(descripcion) <= 1000),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- Add constraints
  constraint "unique_obra_adicional_numero" unique ("obra_id", "numero")
);

-- Enable Row Level Security
alter table "tipos_adicional" enable row level security;
alter table "adicionales" enable row level security;

-- Create indexes
create index "adicionales_obra_id_idx" on "adicionales" ("obra_id");
create index "adicionales_tipo_adicional_id_idx" on "adicionales" ("tipo_adicional_id");

-- Add updated_at triggers
create trigger update_tipos_adicional_updated_at
  before update on "tipos_adicional"
  for each row
  execute function update_updated_at_column();

create trigger update_adicionales_updated_at
  before update on "adicionales"
  for each row
  execute function update_updated_at_column(); 