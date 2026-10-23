import {createClient} from 'npm:@supabase/supabase-js@2.118.0';

const allowedOrigins=new Set(['https://donknutzen.github.io','http://terminal.local:4173','http://localhost:8080']);
const url=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey=Deno.env.get('SUPABASE_ANON_KEY')!;
const clientOptions={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
 if(origin&&allowedOrigins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!allowedOrigins.has(origin))return reply({code:'origin_denied'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({code:'method_not_allowed'},405);
 if(Number(req.headers.get('content-length')||0)>1024)return reply({code:'invalid_input'},400);
 try{
  const text=await req.text();if(text.length>1024)return reply({code:'invalid_input'},400);
  let body;try{body=JSON.parse(text);}catch{return reply({code:'invalid_input'},400);}
  const {username,pin,action}=body||{};
  if(typeof username!=='string'||!/[A-Za-z0-9]/.test(username)||!(/^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/).test(username.trim())||typeof pin!=='string'||!(/^[A-Za-z0-9]{4}$/).test(pin)||!['login','register'].includes(action))return reply({code:'invalid_input'},400);
  const name=username.trim(),normalized=name.toLowerCase();
  // The name-based bucket is authoritative even if a proxy IP header is absent.
  const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const ipHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip))),b=>b.toString(16).padStart(2,'0')).join('');
  const admin=createClient(url,serviceKey,clientOptions);
  const {data:checked,error:checkError}=await admin.rpc('pokeguide_check_trainer',{p_username:name,p_pin:pin,p_ip_hash:ipHash,p_action:action});
  if(checkError)return reply({code:'service_unavailable'},503);
  if(!checked?.ok)return reply({code:checked?.code||'invalid_credentials'},checked?.code==='rate_limited'?429:checked?.code==='username_taken'?409:401);
  let email=checked.auth_email;
  if(action==='register'){
   email=crypto.randomUUID()+'@trainers.pokeguide.invalid';
   const {data:created,error:createError}=await admin.auth.admin.createUser({email,password:crypto.randomUUID()+crypto.randomUUID(),email_confirm:true,user_metadata:{trainer_name:name,username:normalized}});
   if(createError||!created.user)return reply({code:'service_unavailable'},503);
   const {data:saved,error:saveError}=await admin.rpc('pokeguide_register_trainer',{p_username:name,p_pin:pin,p_user_id:created.user.id,p_auth_email:email});
   if(saveError||!saved){await admin.auth.admin.deleteUser(created.user.id);return reply({code:saveError?'service_unavailable':'username_taken'},saveError?503:409);}
  }
  // Generate and consume an internal one-time login proof after the PIN check.
  // This does not send email. Neither this proof nor any admin key reaches clients.
  const {data:proof,error:proofError}=await admin.auth.admin.generateLink({type:'magiclink',email});
  if(proofError||!proof.properties?.hashed_token)return reply({code:'service_unavailable'},503);
  const auth=createClient(url,anonKey,clientOptions);
  const {data:signed,error:sessionError}=await auth.auth.verifyOtp({token_hash:proof.properties.hashed_token,type:'email'});
  if(sessionError||!signed.session)return reply({code:'service_unavailable'},503);
  return reply({session:{access_token:signed.session.access_token,refresh_token:signed.session.refresh_token}});
 }catch{return reply({code:'service_unavailable'},503);}
});
