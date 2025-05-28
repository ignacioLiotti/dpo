-- Create reparticiones table
create table "reparticiones" (
  "id" serial primary key,
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Create areas table
create table "areas" (
  "id" serial primary key,
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Create tipos_obra table
create table "tipos_obra" (
  "id" serial primary key,
  "nombre" text not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Insert predefined values for reparticiones
INSERT INTO "reparticiones" ("id", "nombre") VALUES
  (1, 'Dirección de Arquitectura'),
  (2, 'Dirección de Vivienda'),
  (3, 'Dirección de Vialidad'),
  (4, 'Dirección de Hidráulica');

-- Insert predefined values for areas
INSERT INTO "areas" ("id", "nombre") VALUES
  (1, 'Construcciones'),
  (2, 'Proyectos'),
  (3, 'Inspecciones'),
  (4, 'Administración');

-- Insert predefined values for tipos_obra
INSERT INTO "tipos_obra" ("id", "nombre") VALUES
  (1, 'Obra Nueva'),
  (2, 'Refacción'),
  (3, 'Ampliación'),
  (4, 'Restauración'),
  (5, 'Infraestructura Vial'),
  (6, 'Infraestructura Hidráulica');

-- Reset the sequences to start after our predefined values
SELECT setval('reparticiones_id_seq', 4);
SELECT setval('areas_id_seq', 4);
SELECT setval('tipos_obra_id_seq', 6);

-- Create obras table
create table "obras" (
  "id" uuid primary key default gen_random_uuid(),
  "obra_name" text not null check (char_length(obra_name) >= 3 and char_length(obra_name) <= 255),
  "provincia" text not null check (char_length(provincia) >= 2 and char_length(provincia) <= 100),
  "departamento" text not null check (char_length(departamento) >= 2 and char_length(departamento) <= 100),
  "calle" text not null check (char_length(calle) >= 2 and char_length(calle) <= 255),
  "ubicacion_google_maps" text,
  "presupuesto" decimal(15,2) not null check (presupuesto > 0),
  "descripcion" text check (char_length(descripcion) <= 1000),
  "fecha_inicio" timestamptz,
  "fecha_fin" timestamptz,
  "estado" obra_estado not null,
  "reparticion_id" integer not null references reparticiones(id),
  "area_id" integer not null references areas(id),
  "tipo_obra_id" integer not null references tipos_obra(id), 
  "presupuesto_oficial" decimal(15,2),
  "fecha_basico" timestamptz,
  "expediente" text check (char_length(expediente) <= 100),
  "fecha_creacion" timestamptz not null default now(),
  "fecha_inicio_prevista" timestamptz,
  "duracion" integer check (duracion is null or duracion >= 0),
  "user_id" uuid,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- Add constraints
  constraint "fecha_fin_after_inicio" check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio),
  constraint "presupuesto_oficial_positive" check (presupuesto_oficial is null or presupuesto_oficial > 0)
);

-- Enable Row Level Security
alter table "obras" enable row level security;
alter table "reparticiones" enable row level security;
alter table "areas" enable row level security;
alter table "tipos_obra" enable row level security;

-- Create indexes
create index "obras_reparticion_id_idx" on "obras" ("reparticion_id");
create index "obras_area_id_idx" on "obras" ("area_id");
create index "obras_tipo_obra_id_idx" on "obras" ("tipo_obra_id");
create index "obras_estado_idx" on "obras" ("estado");

-- Create updated_at trigger function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_obras_updated_at
  before update on "obras"
  for each row
  execute function update_updated_at_column();

create trigger update_reparticiones_updated_at
  before update on "reparticiones"
  for each row
  execute function update_updated_at_column();

create trigger update_areas_updated_at
  before update on "areas"
  for each row
  execute function update_updated_at_column();

create trigger update_tipos_obra_updated_at
  before update on "tipos_obra"
  for each row
  execute function update_updated_at_column(); 