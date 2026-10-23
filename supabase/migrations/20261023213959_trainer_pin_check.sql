begin;
-- Only the trusted login Edge Function can execute this function.
-- The two bucket updates are atomic, including simultaneous requests.
create function public.pokeguide_check_trainer(p_username text,p_pin text,p_ip_hash text,p_action text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_name text := lower(btrim(p_username));
 v_profile pokeguide_private.trainers%rowtype;
 v_attempts integer;
 v_hash text;
begin
 if v_name is null or v_name !~ '^[a-z0-9][a-z0-9_-]{2,23}$'
 or p_pin is null or p_pin !~ '^[A-Za-z0-9]{4}$'
 or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$'
 or p_action is null or p_action not in ('login','register') then
  return jsonb_build_object('ok',false,'code','invalid_input');
 end if;
 insert into pokeguide_private.auth_limits as old(bucket,started_at,attempts)
 values ('ip:'||p_ip_hash,now(),1)
 on conflict(bucket) do update set
  attempts=case when old.started_at < now()-interval '15 minutes' then 1 else old.attempts+1 end,
  started_at=case when old.started_at < now()-interval '15 minutes' then now() else old.started_at end
 returning attempts into v_attempts;
 if v_attempts>90 then return jsonb_build_object('ok',false,'code','rate_limited'); end if;
 insert into pokeguide_private.auth_limits as old(bucket,started_at,attempts)
 values ('name:'||v_name,now(),1)
 on conflict(bucket) do update set
  attempts=case when old.started_at < now()-interval '15 minutes' then 1 else old.attempts+1 end,
  started_at=case when old.started_at < now()-interval '15 minutes' then now() else old.started_at end
 returning attempts into v_attempts;
 if v_attempts>5 then return jsonb_build_object('ok',false,'code','rate_limited'); end if;
 select * into v_profile from pokeguide_private.trainers where username=v_name;
 if p_action='register' then
  return case when v_profile.user_id is null then jsonb_build_object('ok',true)
   else jsonb_build_object('ok',false,'code','username_taken') end;
 end if;
 -- An unknown name performs the same expensive bcrypt operation as a known name.
 v_hash:=coalesce(v_profile.pin_hash,extensions.gen_salt('bf',12));
 if extensions.crypt(p_pin,v_hash)<>v_hash or v_profile.user_id is null then
  return jsonb_build_object('ok',false,'code','invalid_credentials');
 end if;
 update pokeguide_private.auth_limits set attempts=0,started_at=now() where bucket='name:'||v_name;
 return jsonb_build_object('ok',true,'user_id',v_profile.user_id,'auth_email',v_profile.auth_email);
end;
$$;
revoke all on function public.pokeguide_check_trainer(text,text,text,text) from public,anon,authenticated;
grant execute on function public.pokeguide_check_trainer(text,text,text,text) to service_role;
commit;
