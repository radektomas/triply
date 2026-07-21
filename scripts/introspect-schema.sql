-- Schema + RLS introspection for Triply.
--
-- Run this in the Supabase SQL editor (or any psql session with the database
-- password) and paste the output back. It is READ-ONLY: every statement is a
-- SELECT against the system catalogs. Nothing is created, altered or dropped.
--
-- Why it exists: the PostgREST OpenAPI schema exposes columns, types, defaults
-- and primary keys, but NOT foreign keys into hidden schemas (auth.users),
-- indexes, triggers, CHECK constraints, or RLS policies. Those gaps are what
-- block (a) finishing the baseline migration and (b) listing RLS policies
-- verbatim.
--
-- Section 5 is the important one for the security review: it lists every table
-- in `public` with RLS on/off and its row counts, so tables with NO protection
-- at all stand out immediately.

\echo '=== 1. Columns (profiles, saved_destinations) ==='
select table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'saved_destinations')
order by table_name, ordinal_position;

\echo '=== 2. Constraints: PK / FK / UNIQUE / CHECK ==='
select con.conrelid::regclass::text as table_name,
       con.conname                  as constraint_name,
       case con.contype when 'p' then 'PRIMARY KEY'
                        when 'f' then 'FOREIGN KEY'
                        when 'u' then 'UNIQUE'
                        when 'c' then 'CHECK'
                        else con.contype::text end as kind,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public'
order by table_name, kind, constraint_name;

\echo '=== 3. Indexes ==='
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

\echo '=== 4. Triggers ==='
select tgrelid::regclass::text as table_name,
       tgname                  as trigger_name,
       pg_get_triggerdef(oid)  as definition
from pg_trigger
where not tgisinternal
  and tgrelid::regclass::text not like 'pg_%'
order by table_name, trigger_name;

\echo '=== 5. RLS status for EVERY table in public (tables with rls_enabled=false are unprotected) ==='
select c.relname                              as table_name,
       c.relrowsecurity                       as rls_enabled,
       c.relforcerowsecurity                  as rls_forced,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count,
       c.reltuples::bigint                    as approx_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity asc, policy_count asc, c.relname;

\echo '=== 6. Every RLS policy, verbatim ==='
select tablename, policyname, permissive, roles, cmd,
       qual        as using_expression,
       with_check  as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

\echo '=== 7. Table-level grants to the anon / authenticated roles ==='
-- A table with RLS enabled but no policies is safe; a table with RLS DISABLED
-- but a SELECT grant to anon is readable by anyone holding the public anon key.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;
