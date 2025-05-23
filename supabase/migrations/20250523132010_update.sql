create type "public"."obra_estado" as enum ('PLANIFICADA', 'EN_EJECUCION', 'FINALIZADA', 'SUSPENDIDA', 'CANCELADA');

create sequence "public"."areas_id_seq";

create sequence "public"."reparticiones_id_seq";

create sequence "public"."tipos_obra_id_seq";

create table "public"."adicionales" (
    "id" uuid not null default gen_random_uuid(),
    "obra_id" uuid not null,
    "numero" integer not null,
    "expediente" text,
    "monto" numeric(15,2) not null,
    "fecha_aprobacion" timestamp with time zone,
    "tipo_adicional_id" uuid not null,
    "descripcion" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."adicionales" enable row level security;

create table "public"."ampliaciones_plazo" (
    "id" uuid not null default gen_random_uuid(),
    "obra_id" uuid not null,
    "numero" integer not null,
    "expediente" text,
    "dias" integer not null,
    "fecha_aprobacion" timestamp with time zone,
    "tipo_ampliacion_plazo_id" uuid not null,
    "descripcion" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."ampliaciones_plazo" enable row level security;

create table "public"."areas" (
    "id" integer not null default nextval('areas_id_seq'::regclass),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."areas" enable row level security;

create table "public"."obras" (
    "id" uuid not null default gen_random_uuid(),
    "obra_name" text not null,
    "provincia" text not null,
    "departamento" text not null,
    "calle" text not null,
    "ubicacion_google_maps" text,
    "presupuesto" numeric(15,2) not null,
    "descripcion" text,
    "fecha_inicio" timestamp with time zone,
    "fecha_fin" timestamp with time zone,
    "estado" obra_estado not null,
    "reparticion_id" integer not null,
    "area_id" integer not null,
    "tipo_obra_id" integer not null,
    "presupuesto_oficial" numeric(15,2),
    "fecha_basico" timestamp with time zone,
    "expediente" text,
    "fecha_creacion" timestamp with time zone not null default now(),
    "fecha_inicio_prevista" timestamp with time zone,
    "duracion" integer,
    "user_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."obras" enable row level security;

create table "public"."redeterminaciones" (
    "id" uuid not null default gen_random_uuid(),
    "obra_id" uuid not null,
    "numero" integer not null,
    "expediente" text,
    "monto" numeric(15,2) not null,
    "fecha_basico" timestamp with time zone not null,
    "tipo_redeterminacion_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."redeterminaciones" enable row level security;

create table "public"."reparticiones" (
    "id" integer not null default nextval('reparticiones_id_seq'::regclass),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."reparticiones" enable row level security;

create table "public"."tipos_adicional" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tipos_adicional" enable row level security;

create table "public"."tipos_ampliacion_plazo" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tipos_ampliacion_plazo" enable row level security;

create table "public"."tipos_obra" (
    "id" integer not null default nextval('tipos_obra_id_seq'::regclass),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tipos_obra" enable row level security;

create table "public"."tipos_redeterminacion" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tipos_redeterminacion" enable row level security;

alter sequence "public"."areas_id_seq" owned by "public"."areas"."id";

alter sequence "public"."reparticiones_id_seq" owned by "public"."reparticiones"."id";

alter sequence "public"."tipos_obra_id_seq" owned by "public"."tipos_obra"."id";

CREATE INDEX adicionales_obra_id_idx ON public.adicionales USING btree (obra_id);

CREATE UNIQUE INDEX adicionales_pkey ON public.adicionales USING btree (id);

CREATE INDEX adicionales_tipo_adicional_id_idx ON public.adicionales USING btree (tipo_adicional_id);

CREATE INDEX ampliaciones_plazo_obra_id_idx ON public.ampliaciones_plazo USING btree (obra_id);

CREATE UNIQUE INDEX ampliaciones_plazo_pkey ON public.ampliaciones_plazo USING btree (id);

CREATE INDEX ampliaciones_plazo_tipo_ampliacion_plazo_id_idx ON public.ampliaciones_plazo USING btree (tipo_ampliacion_plazo_id);

CREATE UNIQUE INDEX areas_pkey ON public.areas USING btree (id);

CREATE INDEX obras_area_id_idx ON public.obras USING btree (area_id);

CREATE INDEX obras_estado_idx ON public.obras USING btree (estado);

CREATE UNIQUE INDEX obras_pkey ON public.obras USING btree (id);

CREATE INDEX obras_reparticion_id_idx ON public.obras USING btree (reparticion_id);

CREATE INDEX obras_tipo_obra_id_idx ON public.obras USING btree (tipo_obra_id);

CREATE INDEX redeterminaciones_obra_id_idx ON public.redeterminaciones USING btree (obra_id);

CREATE UNIQUE INDEX redeterminaciones_pkey ON public.redeterminaciones USING btree (id);

CREATE INDEX redeterminaciones_tipo_redeterminacion_id_idx ON public.redeterminaciones USING btree (tipo_redeterminacion_id);

CREATE UNIQUE INDEX reparticiones_pkey ON public.reparticiones USING btree (id);

CREATE UNIQUE INDEX tipos_adicional_pkey ON public.tipos_adicional USING btree (id);

CREATE UNIQUE INDEX tipos_ampliacion_plazo_pkey ON public.tipos_ampliacion_plazo USING btree (id);

CREATE UNIQUE INDEX tipos_obra_pkey ON public.tipos_obra USING btree (id);

CREATE UNIQUE INDEX tipos_redeterminacion_pkey ON public.tipos_redeterminacion USING btree (id);

CREATE UNIQUE INDEX unique_obra_adicional_numero ON public.adicionales USING btree (obra_id, numero);

CREATE UNIQUE INDEX unique_obra_ampliacion_numero ON public.ampliaciones_plazo USING btree (obra_id, numero);

CREATE UNIQUE INDEX unique_obra_numero ON public.redeterminaciones USING btree (obra_id, numero);

alter table "public"."adicionales" add constraint "adicionales_pkey" PRIMARY KEY using index "adicionales_pkey";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_pkey" PRIMARY KEY using index "ampliaciones_plazo_pkey";

alter table "public"."areas" add constraint "areas_pkey" PRIMARY KEY using index "areas_pkey";

alter table "public"."obras" add constraint "obras_pkey" PRIMARY KEY using index "obras_pkey";

alter table "public"."redeterminaciones" add constraint "redeterminaciones_pkey" PRIMARY KEY using index "redeterminaciones_pkey";

alter table "public"."reparticiones" add constraint "reparticiones_pkey" PRIMARY KEY using index "reparticiones_pkey";

alter table "public"."tipos_adicional" add constraint "tipos_adicional_pkey" PRIMARY KEY using index "tipos_adicional_pkey";

alter table "public"."tipos_ampliacion_plazo" add constraint "tipos_ampliacion_plazo_pkey" PRIMARY KEY using index "tipos_ampliacion_plazo_pkey";

alter table "public"."tipos_obra" add constraint "tipos_obra_pkey" PRIMARY KEY using index "tipos_obra_pkey";

alter table "public"."tipos_redeterminacion" add constraint "tipos_redeterminacion_pkey" PRIMARY KEY using index "tipos_redeterminacion_pkey";

alter table "public"."adicionales" add constraint "adicionales_descripcion_check" CHECK ((char_length(descripcion) <= 1000)) not valid;

alter table "public"."adicionales" validate constraint "adicionales_descripcion_check";

alter table "public"."adicionales" add constraint "adicionales_monto_check" CHECK ((monto > (0)::numeric)) not valid;

alter table "public"."adicionales" validate constraint "adicionales_monto_check";

alter table "public"."adicionales" add constraint "adicionales_numero_check" CHECK ((numero > 0)) not valid;

alter table "public"."adicionales" validate constraint "adicionales_numero_check";

alter table "public"."adicionales" add constraint "adicionales_obra_id_fkey" FOREIGN KEY (obra_id) REFERENCES obras(id) not valid;

alter table "public"."adicionales" validate constraint "adicionales_obra_id_fkey";

alter table "public"."adicionales" add constraint "adicionales_tipo_adicional_id_fkey" FOREIGN KEY (tipo_adicional_id) REFERENCES tipos_adicional(id) not valid;

alter table "public"."adicionales" validate constraint "adicionales_tipo_adicional_id_fkey";

alter table "public"."adicionales" add constraint "unique_obra_adicional_numero" UNIQUE using index "unique_obra_adicional_numero";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_descripcion_check" CHECK ((char_length(descripcion) <= 1000)) not valid;

alter table "public"."ampliaciones_plazo" validate constraint "ampliaciones_plazo_descripcion_check";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_dias_check" CHECK ((dias > 0)) not valid;

alter table "public"."ampliaciones_plazo" validate constraint "ampliaciones_plazo_dias_check";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_numero_check" CHECK ((numero > 0)) not valid;

alter table "public"."ampliaciones_plazo" validate constraint "ampliaciones_plazo_numero_check";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_obra_id_fkey" FOREIGN KEY (obra_id) REFERENCES obras(id) not valid;

alter table "public"."ampliaciones_plazo" validate constraint "ampliaciones_plazo_obra_id_fkey";

alter table "public"."ampliaciones_plazo" add constraint "ampliaciones_plazo_tipo_ampliacion_plazo_id_fkey" FOREIGN KEY (tipo_ampliacion_plazo_id) REFERENCES tipos_ampliacion_plazo(id) not valid;

alter table "public"."ampliaciones_plazo" validate constraint "ampliaciones_plazo_tipo_ampliacion_plazo_id_fkey";

alter table "public"."ampliaciones_plazo" add constraint "unique_obra_ampliacion_numero" UNIQUE using index "unique_obra_ampliacion_numero";

alter table "public"."obras" add constraint "fecha_fin_after_inicio" CHECK (((fecha_fin IS NULL) OR (fecha_inicio IS NULL) OR (fecha_fin >= fecha_inicio))) not valid;

alter table "public"."obras" validate constraint "fecha_fin_after_inicio";

alter table "public"."obras" add constraint "obras_area_id_fkey" FOREIGN KEY (area_id) REFERENCES areas(id) not valid;

alter table "public"."obras" validate constraint "obras_area_id_fkey";

alter table "public"."obras" add constraint "obras_calle_check" CHECK (((char_length(calle) >= 2) AND (char_length(calle) <= 255))) not valid;

alter table "public"."obras" validate constraint "obras_calle_check";

alter table "public"."obras" add constraint "obras_departamento_check" CHECK (((char_length(departamento) >= 2) AND (char_length(departamento) <= 100))) not valid;

alter table "public"."obras" validate constraint "obras_departamento_check";

alter table "public"."obras" add constraint "obras_descripcion_check" CHECK ((char_length(descripcion) <= 1000)) not valid;

alter table "public"."obras" validate constraint "obras_descripcion_check";

alter table "public"."obras" add constraint "obras_duracion_check" CHECK (((duracion IS NULL) OR (duracion >= 0))) not valid;

alter table "public"."obras" validate constraint "obras_duracion_check";

alter table "public"."obras" add constraint "obras_expediente_check" CHECK ((char_length(expediente) <= 100)) not valid;

alter table "public"."obras" validate constraint "obras_expediente_check";

alter table "public"."obras" add constraint "obras_obra_name_check" CHECK (((char_length(obra_name) >= 3) AND (char_length(obra_name) <= 255))) not valid;

alter table "public"."obras" validate constraint "obras_obra_name_check";

alter table "public"."obras" add constraint "obras_presupuesto_check" CHECK ((presupuesto > (0)::numeric)) not valid;

alter table "public"."obras" validate constraint "obras_presupuesto_check";

alter table "public"."obras" add constraint "obras_provincia_check" CHECK (((char_length(provincia) >= 2) AND (char_length(provincia) <= 100))) not valid;

alter table "public"."obras" validate constraint "obras_provincia_check";

alter table "public"."obras" add constraint "obras_reparticion_id_fkey" FOREIGN KEY (reparticion_id) REFERENCES reparticiones(id) not valid;

alter table "public"."obras" validate constraint "obras_reparticion_id_fkey";

alter table "public"."obras" add constraint "obras_tipo_obra_id_fkey" FOREIGN KEY (tipo_obra_id) REFERENCES tipos_obra(id) not valid;

alter table "public"."obras" validate constraint "obras_tipo_obra_id_fkey";

alter table "public"."obras" add constraint "presupuesto_oficial_positive" CHECK (((presupuesto_oficial IS NULL) OR (presupuesto_oficial > (0)::numeric))) not valid;

alter table "public"."obras" validate constraint "presupuesto_oficial_positive";

alter table "public"."redeterminaciones" add constraint "redeterminaciones_monto_check" CHECK ((monto > (0)::numeric)) not valid;

alter table "public"."redeterminaciones" validate constraint "redeterminaciones_monto_check";

alter table "public"."redeterminaciones" add constraint "redeterminaciones_numero_check" CHECK ((numero > 0)) not valid;

alter table "public"."redeterminaciones" validate constraint "redeterminaciones_numero_check";

alter table "public"."redeterminaciones" add constraint "redeterminaciones_obra_id_fkey" FOREIGN KEY (obra_id) REFERENCES obras(id) not valid;

alter table "public"."redeterminaciones" validate constraint "redeterminaciones_obra_id_fkey";

alter table "public"."redeterminaciones" add constraint "redeterminaciones_tipo_redeterminacion_id_fkey" FOREIGN KEY (tipo_redeterminacion_id) REFERENCES tipos_redeterminacion(id) not valid;

alter table "public"."redeterminaciones" validate constraint "redeterminaciones_tipo_redeterminacion_id_fkey";

alter table "public"."redeterminaciones" add constraint "unique_obra_numero" UNIQUE using index "unique_obra_numero";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_obra_total_amount(p_obra_id uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(o.presupuesto_oficial, 0) +
    coalesce(sum(r.monto), 0) +
    coalesce(sum(a.monto), 0)
  from obras o
  left join redeterminaciones r on r.obra_id = o.id
  left join adicionales a on a.obra_id = o.id
  where o.id = p_obra_id
  group by o.id, o.presupuesto_oficial;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_obra_total_extension_days(p_obra_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(sum(dias), 0)
  from ampliaciones_plazo ap
  where ap.obra_id = p_obra_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_redeterminacion(p_obra_id uuid)
 RETURNS TABLE(id uuid, numero integer, monto numeric, fecha_basico timestamp with time zone, tipo_redeterminacion_id uuid, tipo_redeterminacion_nombre text)
 LANGUAGE sql
 STABLE
AS $function$
  select 
    r.id,
    r.numero,
    r.monto,
    r.fecha_basico,
    r.tipo_redeterminacion_id,
    tr.nombre as tipo_redeterminacion_nombre
  from redeterminaciones r
  join tipos_redeterminacion tr on tr.id = r.tipo_redeterminacion_id
  where r.obra_id = p_obra_id
  order by r.numero desc
  limit 1;
$function$
;

create or replace view "public"."obras_adicionales" as  SELECT o.id AS obra_id,
    o.obra_name AS obra_nombre,
    count(a.id) AS cantidad_adicionales,
    COALESCE(sum(a.monto), (0)::numeric) AS monto_total_adicionales
   FROM (obras o
     LEFT JOIN adicionales a ON ((a.obra_id = o.id)))
  GROUP BY o.id, o.obra_name;


create or replace view "public"."obras_ampliaciones_plazo" as  SELECT o.id AS obra_id,
    o.obra_name AS obra_nombre,
    count(ap.id) AS cantidad_ampliaciones,
    COALESCE(sum(ap.dias), (0)::bigint) AS dias_totales_ampliacion
   FROM (obras o
     LEFT JOIN ampliaciones_plazo ap ON ((ap.obra_id = o.id)))
  GROUP BY o.id, o.obra_name;


create or replace view "public"."obras_completas" as  SELECT o.id,
    o.obra_name,
    o.provincia,
    o.departamento,
    o.calle,
    o.ubicacion_google_maps,
    o.presupuesto,
    o.descripcion,
    o.fecha_inicio,
    o.fecha_fin,
    o.estado,
    o.reparticion_id,
    o.area_id,
    o.tipo_obra_id,
    o.presupuesto_oficial,
    o.fecha_basico,
    o.expediente,
    o.fecha_creacion,
    o.fecha_inicio_prevista,
    o.duracion,
    o.user_id,
    o.created_at,
    o.updated_at,
    r.nombre AS reparticion_nombre,
    a.nombre AS area_nombre,
    t.nombre AS tipo_obra_nombre
   FROM (((obras o
     LEFT JOIN reparticiones r ON ((r.id = o.reparticion_id)))
     LEFT JOIN areas a ON ((a.id = o.area_id)))
     LEFT JOIN tipos_obra t ON ((t.id = o.tipo_obra_id)));


create or replace view "public"."obras_redeterminaciones" as  SELECT o.id AS obra_id,
    o.obra_name AS obra_nombre,
    count(r.id) AS cantidad_redeterminaciones,
    COALESCE(sum(r.monto), (0)::numeric) AS monto_total_redeterminaciones
   FROM (obras o
     LEFT JOIN redeterminaciones r ON ((r.obra_id = o.id)))
  GROUP BY o.id, o.obra_name;


create or replace view "public"."obras_resumen" as  SELECT o.id,
    o.obra_name,
    o.provincia,
    o.departamento,
    o.calle,
    o.ubicacion_google_maps,
    o.presupuesto,
    o.descripcion,
    o.fecha_inicio,
    o.fecha_fin,
    o.estado,
    o.reparticion_id,
    o.area_id,
    o.tipo_obra_id,
    o.presupuesto_oficial,
    o.fecha_basico,
    o.expediente,
    o.fecha_creacion,
    o.fecha_inicio_prevista,
    o.duracion,
    o.user_id,
    o.created_at,
    o.updated_at,
    r.nombre AS reparticion_nombre,
    a.nombre AS area_nombre,
    t.nombre AS tipo_obra_nombre,
    COALESCE("or".cantidad_redeterminaciones, (0)::bigint) AS cantidad_redeterminaciones,
    COALESCE("or".monto_total_redeterminaciones, (0)::numeric) AS monto_total_redeterminaciones,
    COALESCE(oa.cantidad_adicionales, (0)::bigint) AS cantidad_adicionales,
    COALESCE(oa.monto_total_adicionales, (0)::numeric) AS monto_total_adicionales,
    COALESCE(oap.cantidad_ampliaciones, (0)::bigint) AS cantidad_ampliaciones,
    COALESCE(oap.dias_totales_ampliacion, (0)::bigint) AS dias_totales_ampliacion,
    ((o.presupuesto_oficial + COALESCE("or".monto_total_redeterminaciones, (0)::numeric)) + COALESCE(oa.monto_total_adicionales, (0)::numeric)) AS monto_total
   FROM ((((((obras o
     LEFT JOIN reparticiones r ON ((r.id = o.reparticion_id)))
     LEFT JOIN areas a ON ((a.id = o.area_id)))
     LEFT JOIN tipos_obra t ON ((t.id = o.tipo_obra_id)))
     LEFT JOIN obras_redeterminaciones "or" ON (("or".obra_id = o.id)))
     LEFT JOIN obras_adicionales oa ON ((oa.obra_id = o.id)))
     LEFT JOIN obras_ampliaciones_plazo oap ON ((oap.obra_id = o.id)));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."adicionales" to "anon";

grant insert on table "public"."adicionales" to "anon";

grant references on table "public"."adicionales" to "anon";

grant select on table "public"."adicionales" to "anon";

grant trigger on table "public"."adicionales" to "anon";

grant truncate on table "public"."adicionales" to "anon";

grant update on table "public"."adicionales" to "anon";

grant delete on table "public"."adicionales" to "authenticated";

grant insert on table "public"."adicionales" to "authenticated";

grant references on table "public"."adicionales" to "authenticated";

grant select on table "public"."adicionales" to "authenticated";

grant trigger on table "public"."adicionales" to "authenticated";

grant truncate on table "public"."adicionales" to "authenticated";

grant update on table "public"."adicionales" to "authenticated";

grant delete on table "public"."adicionales" to "service_role";

grant insert on table "public"."adicionales" to "service_role";

grant references on table "public"."adicionales" to "service_role";

grant select on table "public"."adicionales" to "service_role";

grant trigger on table "public"."adicionales" to "service_role";

grant truncate on table "public"."adicionales" to "service_role";

grant update on table "public"."adicionales" to "service_role";

grant delete on table "public"."ampliaciones_plazo" to "anon";

grant insert on table "public"."ampliaciones_plazo" to "anon";

grant references on table "public"."ampliaciones_plazo" to "anon";

grant select on table "public"."ampliaciones_plazo" to "anon";

grant trigger on table "public"."ampliaciones_plazo" to "anon";

grant truncate on table "public"."ampliaciones_plazo" to "anon";

grant update on table "public"."ampliaciones_plazo" to "anon";

grant delete on table "public"."ampliaciones_plazo" to "authenticated";

grant insert on table "public"."ampliaciones_plazo" to "authenticated";

grant references on table "public"."ampliaciones_plazo" to "authenticated";

grant select on table "public"."ampliaciones_plazo" to "authenticated";

grant trigger on table "public"."ampliaciones_plazo" to "authenticated";

grant truncate on table "public"."ampliaciones_plazo" to "authenticated";

grant update on table "public"."ampliaciones_plazo" to "authenticated";

grant delete on table "public"."ampliaciones_plazo" to "service_role";

grant insert on table "public"."ampliaciones_plazo" to "service_role";

grant references on table "public"."ampliaciones_plazo" to "service_role";

grant select on table "public"."ampliaciones_plazo" to "service_role";

grant trigger on table "public"."ampliaciones_plazo" to "service_role";

grant truncate on table "public"."ampliaciones_plazo" to "service_role";

grant update on table "public"."ampliaciones_plazo" to "service_role";

grant delete on table "public"."areas" to "anon";

grant insert on table "public"."areas" to "anon";

grant references on table "public"."areas" to "anon";

grant select on table "public"."areas" to "anon";

grant trigger on table "public"."areas" to "anon";

grant truncate on table "public"."areas" to "anon";

grant update on table "public"."areas" to "anon";

grant delete on table "public"."areas" to "authenticated";

grant insert on table "public"."areas" to "authenticated";

grant references on table "public"."areas" to "authenticated";

grant select on table "public"."areas" to "authenticated";

grant trigger on table "public"."areas" to "authenticated";

grant truncate on table "public"."areas" to "authenticated";

grant update on table "public"."areas" to "authenticated";

grant delete on table "public"."areas" to "service_role";

grant insert on table "public"."areas" to "service_role";

grant references on table "public"."areas" to "service_role";

grant select on table "public"."areas" to "service_role";

grant trigger on table "public"."areas" to "service_role";

grant truncate on table "public"."areas" to "service_role";

grant update on table "public"."areas" to "service_role";

grant delete on table "public"."obras" to "anon";

grant insert on table "public"."obras" to "anon";

grant references on table "public"."obras" to "anon";

grant select on table "public"."obras" to "anon";

grant trigger on table "public"."obras" to "anon";

grant truncate on table "public"."obras" to "anon";

grant update on table "public"."obras" to "anon";

grant delete on table "public"."obras" to "authenticated";

grant insert on table "public"."obras" to "authenticated";

grant references on table "public"."obras" to "authenticated";

grant select on table "public"."obras" to "authenticated";

grant trigger on table "public"."obras" to "authenticated";

grant truncate on table "public"."obras" to "authenticated";

grant update on table "public"."obras" to "authenticated";

grant delete on table "public"."obras" to "service_role";

grant insert on table "public"."obras" to "service_role";

grant references on table "public"."obras" to "service_role";

grant select on table "public"."obras" to "service_role";

grant trigger on table "public"."obras" to "service_role";

grant truncate on table "public"."obras" to "service_role";

grant update on table "public"."obras" to "service_role";

grant delete on table "public"."redeterminaciones" to "anon";

grant insert on table "public"."redeterminaciones" to "anon";

grant references on table "public"."redeterminaciones" to "anon";

grant select on table "public"."redeterminaciones" to "anon";

grant trigger on table "public"."redeterminaciones" to "anon";

grant truncate on table "public"."redeterminaciones" to "anon";

grant update on table "public"."redeterminaciones" to "anon";

grant delete on table "public"."redeterminaciones" to "authenticated";

grant insert on table "public"."redeterminaciones" to "authenticated";

grant references on table "public"."redeterminaciones" to "authenticated";

grant select on table "public"."redeterminaciones" to "authenticated";

grant trigger on table "public"."redeterminaciones" to "authenticated";

grant truncate on table "public"."redeterminaciones" to "authenticated";

grant update on table "public"."redeterminaciones" to "authenticated";

grant delete on table "public"."redeterminaciones" to "service_role";

grant insert on table "public"."redeterminaciones" to "service_role";

grant references on table "public"."redeterminaciones" to "service_role";

grant select on table "public"."redeterminaciones" to "service_role";

grant trigger on table "public"."redeterminaciones" to "service_role";

grant truncate on table "public"."redeterminaciones" to "service_role";

grant update on table "public"."redeterminaciones" to "service_role";

grant delete on table "public"."reparticiones" to "anon";

grant insert on table "public"."reparticiones" to "anon";

grant references on table "public"."reparticiones" to "anon";

grant select on table "public"."reparticiones" to "anon";

grant trigger on table "public"."reparticiones" to "anon";

grant truncate on table "public"."reparticiones" to "anon";

grant update on table "public"."reparticiones" to "anon";

grant delete on table "public"."reparticiones" to "authenticated";

grant insert on table "public"."reparticiones" to "authenticated";

grant references on table "public"."reparticiones" to "authenticated";

grant select on table "public"."reparticiones" to "authenticated";

grant trigger on table "public"."reparticiones" to "authenticated";

grant truncate on table "public"."reparticiones" to "authenticated";

grant update on table "public"."reparticiones" to "authenticated";

grant delete on table "public"."reparticiones" to "service_role";

grant insert on table "public"."reparticiones" to "service_role";

grant references on table "public"."reparticiones" to "service_role";

grant select on table "public"."reparticiones" to "service_role";

grant trigger on table "public"."reparticiones" to "service_role";

grant truncate on table "public"."reparticiones" to "service_role";

grant update on table "public"."reparticiones" to "service_role";

grant delete on table "public"."tipos_adicional" to "anon";

grant insert on table "public"."tipos_adicional" to "anon";

grant references on table "public"."tipos_adicional" to "anon";

grant select on table "public"."tipos_adicional" to "anon";

grant trigger on table "public"."tipos_adicional" to "anon";

grant truncate on table "public"."tipos_adicional" to "anon";

grant update on table "public"."tipos_adicional" to "anon";

grant delete on table "public"."tipos_adicional" to "authenticated";

grant insert on table "public"."tipos_adicional" to "authenticated";

grant references on table "public"."tipos_adicional" to "authenticated";

grant select on table "public"."tipos_adicional" to "authenticated";

grant trigger on table "public"."tipos_adicional" to "authenticated";

grant truncate on table "public"."tipos_adicional" to "authenticated";

grant update on table "public"."tipos_adicional" to "authenticated";

grant delete on table "public"."tipos_adicional" to "service_role";

grant insert on table "public"."tipos_adicional" to "service_role";

grant references on table "public"."tipos_adicional" to "service_role";

grant select on table "public"."tipos_adicional" to "service_role";

grant trigger on table "public"."tipos_adicional" to "service_role";

grant truncate on table "public"."tipos_adicional" to "service_role";

grant update on table "public"."tipos_adicional" to "service_role";

grant delete on table "public"."tipos_ampliacion_plazo" to "anon";

grant insert on table "public"."tipos_ampliacion_plazo" to "anon";

grant references on table "public"."tipos_ampliacion_plazo" to "anon";

grant select on table "public"."tipos_ampliacion_plazo" to "anon";

grant trigger on table "public"."tipos_ampliacion_plazo" to "anon";

grant truncate on table "public"."tipos_ampliacion_plazo" to "anon";

grant update on table "public"."tipos_ampliacion_plazo" to "anon";

grant delete on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant insert on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant references on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant select on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant trigger on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant truncate on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant update on table "public"."tipos_ampliacion_plazo" to "authenticated";

grant delete on table "public"."tipos_ampliacion_plazo" to "service_role";

grant insert on table "public"."tipos_ampliacion_plazo" to "service_role";

grant references on table "public"."tipos_ampliacion_plazo" to "service_role";

grant select on table "public"."tipos_ampliacion_plazo" to "service_role";

grant trigger on table "public"."tipos_ampliacion_plazo" to "service_role";

grant truncate on table "public"."tipos_ampliacion_plazo" to "service_role";

grant update on table "public"."tipos_ampliacion_plazo" to "service_role";

grant delete on table "public"."tipos_obra" to "anon";

grant insert on table "public"."tipos_obra" to "anon";

grant references on table "public"."tipos_obra" to "anon";

grant select on table "public"."tipos_obra" to "anon";

grant trigger on table "public"."tipos_obra" to "anon";

grant truncate on table "public"."tipos_obra" to "anon";

grant update on table "public"."tipos_obra" to "anon";

grant delete on table "public"."tipos_obra" to "authenticated";

grant insert on table "public"."tipos_obra" to "authenticated";

grant references on table "public"."tipos_obra" to "authenticated";

grant select on table "public"."tipos_obra" to "authenticated";

grant trigger on table "public"."tipos_obra" to "authenticated";

grant truncate on table "public"."tipos_obra" to "authenticated";

grant update on table "public"."tipos_obra" to "authenticated";

grant delete on table "public"."tipos_obra" to "service_role";

grant insert on table "public"."tipos_obra" to "service_role";

grant references on table "public"."tipos_obra" to "service_role";

grant select on table "public"."tipos_obra" to "service_role";

grant trigger on table "public"."tipos_obra" to "service_role";

grant truncate on table "public"."tipos_obra" to "service_role";

grant update on table "public"."tipos_obra" to "service_role";

grant delete on table "public"."tipos_redeterminacion" to "anon";

grant insert on table "public"."tipos_redeterminacion" to "anon";

grant references on table "public"."tipos_redeterminacion" to "anon";

grant select on table "public"."tipos_redeterminacion" to "anon";

grant trigger on table "public"."tipos_redeterminacion" to "anon";

grant truncate on table "public"."tipos_redeterminacion" to "anon";

grant update on table "public"."tipos_redeterminacion" to "anon";

grant delete on table "public"."tipos_redeterminacion" to "authenticated";

grant insert on table "public"."tipos_redeterminacion" to "authenticated";

grant references on table "public"."tipos_redeterminacion" to "authenticated";

grant select on table "public"."tipos_redeterminacion" to "authenticated";

grant trigger on table "public"."tipos_redeterminacion" to "authenticated";

grant truncate on table "public"."tipos_redeterminacion" to "authenticated";

grant update on table "public"."tipos_redeterminacion" to "authenticated";

grant delete on table "public"."tipos_redeterminacion" to "service_role";

grant insert on table "public"."tipos_redeterminacion" to "service_role";

grant references on table "public"."tipos_redeterminacion" to "service_role";

grant select on table "public"."tipos_redeterminacion" to "service_role";

grant trigger on table "public"."tipos_redeterminacion" to "service_role";

grant truncate on table "public"."tipos_redeterminacion" to "service_role";

grant update on table "public"."tipos_redeterminacion" to "service_role";

CREATE TRIGGER update_adicionales_updated_at BEFORE UPDATE ON public.adicionales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ampliaciones_plazo_updated_at BEFORE UPDATE ON public.ampliaciones_plazo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redeterminaciones_updated_at BEFORE UPDATE ON public.redeterminaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reparticiones_updated_at BEFORE UPDATE ON public.reparticiones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_adicional_updated_at BEFORE UPDATE ON public.tipos_adicional FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_ampliacion_plazo_updated_at BEFORE UPDATE ON public.tipos_ampliacion_plazo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_obra_updated_at BEFORE UPDATE ON public.tipos_obra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_redeterminacion_updated_at BEFORE UPDATE ON public.tipos_redeterminacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


