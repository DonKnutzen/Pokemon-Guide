import {cloudConfig} from '../data/cloud-config.js?v=8';
let sdkPromise;
export function configured(config=cloudConfig){
 try{
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url)||typeof config.publishableKey!=='string')return false;
  if(/^sb_publishable_[a-zA-Z0-9_-]+$/.test(config.publishableKey))return true;
  const payload=JSON.parse(atob(config.publishableKey.split('.')[1].replaceAll('-','+').replaceAll('_','/')));
  return payload.role==='anon';
 }catch{return false;}
}
function sdk(){
 if(globalThis.supabase)return Promise.resolve(globalThis.supabase);
 sdkPromise ||= new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('../vendor/supabase-2.118.0.js',import.meta.url).href;script.onload=()=>globalThis.supabase?resolve(globalThis.supabase):reject(Error('Anmeldung konnte nicht geladen werden.'));script.onerror=()=>{sdkPromise=null;script.remove();reject(Error('Anmeldung konnte nicht geladen werden.'));};document.head.append(script);
 });return sdkPromise;
}
export async function connectCloud(onSession){
 if(!configured())return null;
 const {createClient}=await sdk(),client=createClient(cloudConfig.url,cloudConfig.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'pokeguide:auth:v1'}});
 client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>onSession(session,event),0);});
 return {
  client,
  async transport(expectedUser){
   const {data:{session},error}=await client.auth.getSession();
   if(error||!session||session.user.id!==expectedUser)throw Error('Account changed');
   // Bind the whole operation to this session, including delayed requests.
   // A sign-out/sign-in in another tab cannot send old progress to a new account.
   const bearer='Bearer '+session.access_token;
   return {async push(rows){const {error}=await client.rpc('apply_pokeguide_records',{entries:rows}).setHeader('Authorization',bearer);if(error)throw error;},async pull(offset,limit){const {data,error}=await client.from('pokeguide_records').select('key,value,stamp').order('key').range(offset,offset+limit-1).setHeader('Authorization',bearer);if(error)throw error;return data;}};
  },
  async signIn(username,pin){return authenticate('login',username,pin);},
  async signUp(username,pin){return authenticate('register',username,pin);},
  async signOut(){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;}
 };
 async function authenticate(action,username,pin){
  const name=typeof username==='string'?username.trim():'';
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/.test(name)||typeof pin!=='string'||!/^[A-Za-z0-9]{4}$/.test(pin))throw Object.assign(Error('Invalid trainer credentials'),{code:'invalid_input'});
  const response=await fetch(cloudConfig.url+'/functions/v1/trainer-auth',{method:'POST',headers:{'Content-Type':'application/json',apikey:cloudConfig.publishableKey},body:JSON.stringify({action,username:name,pin}),signal:AbortSignal.timeout(20000)});
  const result=await response.json().catch(()=>({code:'service_unavailable'}));
  if(!response.ok||!result.session?.access_token||!result.session?.refresh_token)throw Object.assign(Error('Trainer authentication failed'),{code:result.code||'service_unavailable'});
  const {data,error}=await client.auth.setSession(result.session);if(error)throw error;return data;
 }
}
export function authError(error){
 const code=error?.code;
 if(code==='invalid_credentials')return 'Nutzername oder PIN stimmen nicht.';
 if(code==='username_taken')return 'Dieser Nutzername ist schon vergeben. Wähle einen anderen oder melde dich an.';
 if(code==='rate_limited')return 'Zu viele Versuche. Bitte warte 15 Minuten und versuche es dann erneut.';
 if(code==='invalid_input')return 'Bitte nutze einen gültigen Nutzernamen und genau vier Buchstaben oder Zahlen als PIN.';
 if(code==='service_unavailable')return 'Die Anmeldung ist gerade nicht erreichbar. Bitte versuche es gleich erneut.';
 if(error instanceof TypeError||error?.name==='TimeoutError'||error?.message?.includes('fetch'))return 'Keine Verbindung. Dein Fortschritt bleibt auf diesem Gerät gespeichert.';
 return 'Das hat nicht geklappt. Bitte versuche es erneut.';
}
