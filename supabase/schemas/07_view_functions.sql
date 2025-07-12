-- Function to get obras by estado
create or replace function get_obras_by_estado(p_estado obra_estado)
returns setof obras_resumen
language sql
stable
as $$
  select *
  from obras_resumen obr
  where obr.estado = p_estado
  order by updated_at desc;
$$;

-- Function to search obras by text
create or replace function search_obras(p_search_text text)
returns setof obras_resumen
language sql
stable
as $$
  select *
  from obras_resumen
  where 
    obra_name ilike '%' || p_search_text || '%' or
    descripcion ilike '%' || p_search_text || '%' or
    expediente ilike '%' || p_search_text || '%' or
    reparticion_nombre ilike '%' || p_search_text || '%' or
    area_nombre ilike '%' || p_search_text || '%' or
    tipo_obra_nombre ilike '%' || p_search_text || '%'
  order by updated_at desc;
$$; 