-- Drop views in reverse dependency order
drop view if exists "obras_resumen" cascade;
drop view if exists "obras_redeterminaciones" cascade;
drop view if exists "obras_adicionales" cascade;
drop view if exists "obras_ampliaciones_plazo" cascade;
drop view if exists "obras_completas" cascade;

-- View for obras with their basic relationships
create or replace view "obras_completas" as
select 
  o.*,
  r.nombre as reparticion_nombre,
  a.nombre as area_nombre,
  t.nombre as tipo_obra_nombre
from obras o
left join reparticiones r on r.id = o.reparticion_id
left join areas a on a.id = o.area_id
left join tipos_obra t on t.id = o.tipo_obra_id;

-- View for obras with their total redeterminaciones amount
create or replace view "obras_redeterminaciones" as
select 
  o.id as obra_id,
  o.obra_name as obra_nombre,
  count(r.id) as cantidad_redeterminaciones,
  coalesce(sum(r.monto), 0) as monto_total_redeterminaciones
from obras o
left join redeterminaciones r on r.obra_id = o.id
group by o.id, o.obra_name;

-- View for obras with their total adicionales amount
create or replace view "obras_adicionales" as
select 
  o.id as obra_id,
  o.obra_name as obra_nombre,
  count(a.id) as cantidad_adicionales,
  coalesce(sum(a.monto), 0) as monto_total_adicionales
from obras o
left join adicionales a on a.obra_id = o.id
group by o.id, o.obra_name;

-- View for obras with their total ampliaciones de plazo
create or replace view "obras_ampliaciones_plazo" as
select 
  o.id as obra_id,
  o.obra_name as obra_nombre,
  count(ap.id) as cantidad_ampliaciones,
  coalesce(sum(ap.dias), 0) as dias_totales_ampliacion
from obras o
left join ampliaciones_plazo ap on ap.obra_id = o.id
group by o.id, o.obra_name;

-- View for obras with all their summaries
create or replace view "obras_resumen" as
select 
  o.*,
  r.nombre as reparticion_nombre,
  a.nombre as area_nombre,
  t.nombre as tipo_obra_nombre,
  coalesce("or".cantidad_redeterminaciones, 0) as cantidad_redeterminaciones,
  coalesce("or".monto_total_redeterminaciones, 0) as monto_total_redeterminaciones,
  coalesce(oa.cantidad_adicionales, 0) as cantidad_adicionales,
  coalesce(oa.monto_total_adicionales, 0) as monto_total_adicionales,
  coalesce(oap.cantidad_ampliaciones, 0) as cantidad_ampliaciones,
  coalesce(oap.dias_totales_ampliacion, 0) as dias_totales_ampliacion,
  o.presupuesto_oficial + coalesce("or".monto_total_redeterminaciones, 0) + coalesce(oa.monto_total_adicionales, 0) as monto_total
from obras o
left join reparticiones r on r.id = o.reparticion_id
left join areas a on a.id = o.area_id
left join tipos_obra t on t.id = o.tipo_obra_id
left join obras_redeterminaciones "or" on "or".obra_id = o.id
left join obras_adicionales oa on oa.obra_id = o.id
left join obras_ampliaciones_plazo oap on oap.obra_id = o.id; 