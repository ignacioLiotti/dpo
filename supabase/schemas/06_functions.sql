-- Basic calculation functions that don't depend on views
create or replace function calculate_obra_total_amount(p_obra_id uuid)
returns decimal(15,2)
language sql
stable
as $$
  select 
    coalesce(o.presupuesto_oficial, 0) +
    coalesce(sum(r.monto), 0) +
    coalesce(sum(a.monto), 0)
  from obras o
  left join redeterminaciones r on r.obra_id = o.id
  left join adicionales a on a.obra_id = o.id
  where o.id = p_obra_id
  group by o.id, o.presupuesto_oficial;
$$;

-- Function to calculate the total days of extension for an obra
create or replace function calculate_obra_total_extension_days(p_obra_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(dias), 0)
  from ampliaciones_plazo ap
  where ap.obra_id = p_obra_id;
$$;

-- Function to get the latest redeterminacion for an obra
create or replace function get_latest_redeterminacion(p_obra_id uuid)
returns table (
  id uuid,
  numero integer,
  monto decimal(15,2),
  fecha_basico timestamptz,
  tipo_redeterminacion_id uuid,
  tipo_redeterminacion_nombre text
)
language sql
stable
as $$
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
$$; 