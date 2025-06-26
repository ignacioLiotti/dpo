drop trigger if exists "obra_documents_updated_at" on "public"."obra_documents";

drop policy "obra_documents_delete_policy" on "public"."obra_documents";

drop policy "obra_documents_insert_policy" on "public"."obra_documents";

drop policy "obra_documents_select_policy" on "public"."obra_documents";

drop policy "obra_documents_update_policy" on "public"."obra_documents";

revoke delete on table "public"."obra_documents" from "anon";

revoke insert on table "public"."obra_documents" from "anon";

revoke references on table "public"."obra_documents" from "anon";

revoke select on table "public"."obra_documents" from "anon";

revoke trigger on table "public"."obra_documents" from "anon";

revoke truncate on table "public"."obra_documents" from "anon";

revoke update on table "public"."obra_documents" from "anon";

revoke delete on table "public"."obra_documents" from "authenticated";

revoke insert on table "public"."obra_documents" from "authenticated";

revoke references on table "public"."obra_documents" from "authenticated";

revoke select on table "public"."obra_documents" from "authenticated";

revoke trigger on table "public"."obra_documents" from "authenticated";

revoke truncate on table "public"."obra_documents" from "authenticated";

revoke update on table "public"."obra_documents" from "authenticated";

revoke delete on table "public"."obra_documents" from "service_role";

revoke insert on table "public"."obra_documents" from "service_role";

revoke references on table "public"."obra_documents" from "service_role";

revoke select on table "public"."obra_documents" from "service_role";

revoke trigger on table "public"."obra_documents" from "service_role";

revoke truncate on table "public"."obra_documents" from "service_role";

revoke update on table "public"."obra_documents" from "service_role";

alter table "public"."obra_documents" drop constraint "obra_documents_obra_id_fkey";

alter table "public"."obra_documents" drop constraint "obra_documents_user_id_fkey";

alter table "public"."obra_documents" drop constraint "obra_documents_pkey";

drop index if exists "public"."obra_documents_category_idx";

drop index if exists "public"."obra_documents_created_at_idx";

drop index if exists "public"."obra_documents_obra_id_idx";

drop index if exists "public"."obra_documents_pkey";

drop index if exists "public"."obra_documents_type_idx";

drop index if exists "public"."obra_documents_user_id_idx";

drop table "public"."obra_documents";

set check_function_bodies = off;

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


