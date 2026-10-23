import {cloudConfig} from '../data/cloud-config.js';
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
 const {createClient}=await sdk(),client=createClient(cloudConfig.url,cloudConfig.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'pokeguide:auth:v1'}});
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
  async signIn(email,password){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;},
  async signUp(email,password){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:new URL('./',document.baseURI).href+'#account'}});if(error)throw error;return data;},
  async reset(email){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('./',document.baseURI).href+'#account'});if(error)throw error;},
  async updatePassword(password){const {error}=await client.auth.updateUser({password});if(error)throw error;},
  async signOut(){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;}
 };
}
export function authError(error){
 const code=error?.code;
 if(code==='invalid_credentials')return 'E-Mail oder Passwort stimmen nicht.';
 if(code==='email_not_confirmed')return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
 if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit')return 'Zu viele Versuche. Bitte versuche es später erneut.';
 if(code==='weak_password')return 'Bitte wähle ein längeres Passwort mit verschiedenen Zeichen.';
 if(code==='user_already_exists')return 'Dieses Konto ist bereits registriert. Bitte melde dich an.';
 if(error instanceof TypeError||error?.message?.includes('fetch'))return 'Keine Verbindung. Dein Fortschritt bleibt auf diesem Gerät gespeichert.';
 return 'Das hat nicht geklappt. Bitte versuche es erneut.';
}
