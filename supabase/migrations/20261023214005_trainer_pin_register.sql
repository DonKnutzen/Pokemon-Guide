begin;
create function public.pokeguide_register_trainer(p_username text,p_pin text,p_user_id uuid,p_auth_email text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_username is null or lower(btrim(p_username)) !~ '^[a-z0-9][a-z0-9_-]{2,23}$'
 or p_pin is null or p_pin !~ '^[A-Za-z0-9]{4}$'
 or p_user_id is null or p_auth_email is null then return false; end if;
 if not exists(select 1 from auth.users where id=p_user_id and email=p_auth_email) then return false; end if;
 insert into pokeguide_private.trainers(user_id,username,display_name,auth_email,pin_hash)
 values(p_user_id,lower(btrim(p_username)),btrim(p_username),p_auth_email,extensions.crypt(p_pin,extensions.gen_salt('bf',12)))
 on conflict(username) do nothing;
 return found;
end;
$$;
revoke all on function public.pokeguide_register_trainer(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.pokeguide_register_trainer(text,text,uuid,text) to service_role;
commit;
