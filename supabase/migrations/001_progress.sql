-- User-owned progress for GitHub Pages. Run once in the project's SQL editor.
-- Auth is handled by Supabase Auth. No password is stored in this table.
begin;
create table public.pokeguide_records (
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 key text not null check (length(key) between 1 and 180 and key ~ '^[a-zA-Z0-9_.-]+$'),
 value jsonb not null check (pg_column_size(value) <= 2048),
 stamp text collate "C" not null check (stamp ~ '^[0-9]{13}-[0-9]{6}-[a-zA-Z0-9-]{8,64}$'),
 updated_at timestamptz not null default now(),
 primary key (user_id,key)
);
alter table public.pokeguide_records enable row level security;
revoke all on public.pokeguide_records from anon, authenticated;
grant select, insert, update on public.pokeguide_records to authenticated;
create policy "read own progress" on public.pokeguide_records for select to authenticated using ((select auth.uid())=user_id);
create policy "insert own progress" on public.pokeguide_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy "update own progress" on public.pokeguide_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Atomic per-key merge. Older offline snapshots cannot overwrite newer changes.
-- SECURITY INVOKER retains row-level authorization for every statement.
create function public.apply_pokeguide_records(entries jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if jsonb_typeof(entries) <> 'array' or jsonb_array_length(entries) > 400 or pg_column_size(entries)>1048576 then
  raise exception 'Invalid progress batch' using errcode='22023';
 end if;
 insert into public.pokeguide_records as stored (user_id,key,value,stamp)
 select auth.uid(), entry->>'key', entry->'value', entry->>'stamp'
 from jsonb_array_elements(entries) as entry
 on conflict (user_id,key) do update set value=excluded.value,stamp=excluded.stamp,updated_at=now()
 where excluded.stamp > stored.stamp;
end;
$$;
revoke all on function public.apply_pokeguide_records(jsonb) from public, anon;
grant execute on function public.apply_pokeguide_records(jsonb) to authenticated;
commit;
