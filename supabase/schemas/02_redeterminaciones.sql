-- Create tipos_redeterminacion table
create table "tipos_redeterminacion" (
  "id" uuid primary key default gen_random_uuid(),
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Create redeterminaciones table
create table "redeterminaciones" (
  "id" uuid primary key default gen_random_uuid(),
  "obra_id" uuid not null references obras(id),
  "numero" integer not null check (numero > 0),
  "expediente" text,
  "monto" decimal(15,2) not null check (monto > 0),
  "fecha_basico" timestamptz not null,
  "tipo_redeterminacion_id" uuid not null references tipos_redeterminacion(id),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- Add constraints
  constraint "unique_obra_numero" unique ("obra_id", "numero")
);

-- Enable Row Level Security
alter table "tipos_redeterminacion" enable row level security;
alter table "redeterminaciones" enable row level security;

-- Create indexes
create index "redeterminaciones_obra_id_idx" on "redeterminaciones" ("obra_id");
create index "redeterminaciones_tipo_redeterminacion_id_idx" on "redeterminaciones" ("tipo_redeterminacion_id");

-- Add updated_at triggers
create trigger update_tipos_redeterminacion_updated_at
  before update on "tipos_redeterminacion"
  for each row
  execute function update_updated_at_column();

create trigger update_redeterminaciones_updated_at
  before update on "redeterminaciones"
  for each row
  execute function update_updated_at_column(); 