-- Four-character trainer PINs are checked only on the server.
-- These tables are deliberately outside the exposed Data API schemas.
begin;
create schema if not exists pokeguide_private;
revoke all on schema pokeguide_private from public, anon, authenticated;
create table pokeguide_private.trainers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{2,23}$'),
 display_name text not null check (length(display_name) between 3 and 24),
 auth_email text not null unique,
 pin_hash text not null,
 created_at timestamptz not null default now()
);
create table pokeguide_private.auth_limits (
 bucket text primary key,
 started_at timestamptz not null default now(),
 attempts integer not null default 0
);
create index pokeguide_auth_limits_expiry on pokeguide_private.auth_limits(started_at);
alter table pokeguide_private.trainers enable row level security;
alter table pokeguide_private.auth_limits enable row level security;
revoke all on all tables in schema pokeguide_private from public,anon,authenticated;

commit;
