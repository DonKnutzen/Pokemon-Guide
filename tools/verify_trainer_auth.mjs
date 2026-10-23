// Optional live smoke test. Creates two isolated QA accounts; never prints credentials.
// QA_RECEIPT can name a local JSON file containing only the created user IDs for cleanup.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {cloudConfig} from '../docs/data/cloud-config.js?v=8';
import {connectCloud} from '../docs/assets/cloud.js';
import {emptyLibrary,markCaught,caughtIn,writeRecord,pendingRows} from '../docs/assets/platform-model.js';
import {syncLibrary} from '../docs/assets/sync-engine.js';

const context={console,URL,URLSearchParams,Headers,Request,Response,TextEncoder,TextDecoder,AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,atob,btoa,fetch,crypto,WebSocket:globalThis.WebSocket};
vm.runInNewContext(readFileSync(new URL('../docs/vendor/supabase-2.118.0.js',import.meta.url),'utf8'),context);
globalThis.supabase=context.supabase;
const suffix=randomUUID().replaceAll('-','').slice(0,12),nameA='qa_a_'+suffix,nameB='qa_b_'+suffix;
const pinA='aB'+String(Math.floor(Math.random()*100)).padStart(2,'0'),pinB='xY'+String(Math.floor(Math.random()*100)).padStart(2,'0');
const created=[],checks=[];let cloud;
function check(label,condition){assert.ok(condition,label);checks.push(label);}
async function attempt(action,username,pin,extraHeaders={}){
 const res=await fetch(cloudConfig.url+'/functions/v1/trainer-auth',{method:'POST',headers:{apikey:cloudConfig.publishableKey,'Content-Type':'application/json',...extraHeaders},body:JSON.stringify({action,username,pin})});
 const data=await res.json();return {status:res.status,data};
}
async function api(path,token,init={}){
 return fetch(cloudConfig.url+path,{...init,headers:{apikey:cloudConfig.publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json',...init.headers}});
}
try{
 cloud=await connectCloud(()=>{});
 let data=await cloud.signUp(nameA,pinA);const userA=data.session.user.id;created.push({id:userA,username:nameA});
 check('registration installs authenticated session',!!userA);
 await cloud.signOut();data=await cloud.signIn(nameA.toUpperCase(),pinA);
 check('username is case insensitive',data.session.user.id===userA);
 check('trainer display name is available',data.session.user.user_metadata.trainer_name===nameA);
 check('wrong PIN case is rejected',(await attempt('login',nameA,pinA.toUpperCase())).status===401);
 check('duplicate normalized username is rejected',(await attempt('register',nameA.toUpperCase(),pinA)).status===409);
 for(const invalid of ['123','12345','ab!2','äb12'])check('invalid PIN '+invalid.length+' characters rejected',(await attempt('login',nameA,invalid)).status===400);
 await cloud.signIn(nameA,pinA);
 const first=emptyLibrary('qa-device-one');markCaught(first,'gold',25,true,'route29');markCaught(first,'red',4,true);writeRecord(first,'item.gold.qa-fund',true);
 await syncLibrary(first,await cloud.transport(userA));check('cloud acknowledges progress',pendingRows(first).length===0);
 await cloud.signOut();data=await cloud.signIn(nameA,pinA);
 const second=emptyLibrary('qa-device-two');await syncLibrary(second,await cloud.transport(userA));
 check('new device receives caught Pokémon and items',caughtIn(second,'gsc').includes(25)&&caughtIn(second,'rby').includes(4)&&second.records['item.gold.qa-fund']?.value===true);
 check('editions retain separate item state',!second.records['item.silver.qa-fund']);
 markCaught(second,'silver',25,false);await syncLibrary(second,await cloud.transport(userA));await syncLibrary(first,await cloud.transport(userA));
 check('undo syncs across devices and shared series',!caughtIn(first,'gsc').includes(25)&&caughtIn(first,'rby').includes(4));
 const refreshed=await cloud.client.auth.refreshSession();check('session refresh keeps account identity',!refreshed.error&&refreshed.data.user.id===userA);
 await cloud.signOut();data=await cloud.signUp(nameB,pinB);const userB=data.session.user.id;created.push({id:userB,username:nameB});const tokenB=data.session.access_token;
 const other=emptyLibrary('qa-device-three');await syncLibrary(other,await cloud.transport(userB));check('second account starts empty',Object.keys(other.records).length===0);
 const foreign=await api('/rest/v1/pokeguide_records?user_id=eq.'+userA,tokenB);check('RLS hides another account rows',foreign.ok&&(await foreign.json()).length===0);
 const forged=await api('/rest/v1/pokeguide_records',tokenB,{method:'POST',body:JSON.stringify({user_id:userA,key:'caught.gsc.1',value:{caught:true},stamp:Date.now()+'-000000-qa-forgery'})});check('RLS rejects writing another user identity',forged.status===403);
 for(const token of [cloudConfig.publishableKey,tokenB]){
  const rpc=await api('/rest/v1/rpc/pokeguide_check_trainer',token,{method:'POST',body:JSON.stringify({p_username:nameA,p_pin:pinA,p_ip_hash:'0'.repeat(64),p_action:'login'})});
  check('private PIN RPC inaccessible to browser role',rpc.status===401||rpc.status===403);
 }
 const privateTable=await api('/rest/v1/trainers',tokenB);check('credential table is not exposed',privateTable.status===404);
 const deniedOrigin=await attempt('login',nameA,pinA,{Origin:'https://example.com'});check('unapproved browser origin denied',deniedOrigin.status===403);
 const preflight=await fetch(cloudConfig.url+'/functions/v1/trainer-auth',{method:'OPTIONS',headers:{Origin:'https://donknutzen.github.io','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'apikey,content-type'}});check('production CORS preflight accepted',preflight.status===204&&preflight.headers.get('access-control-allow-origin')==='https://donknutzen.github.io');
 await cloud.signOut();await cloud.signIn(nameB,pinB);await cloud.signOut();
 for(let i=0;i<5;i++)check('wrong PIN attempt rejected',(await attempt('login',nameB,'ZZZZ')).status===401);
 const limited=await attempt('login',nameB,pinB);check('sixth username attempt is rate limited',limited.status===429&&limited.data.code==='rate_limited');
 const anon=await fetch(cloudConfig.url+'/rest/v1/pokeguide_records?select=key',{headers:{apikey:cloudConfig.publishableKey}});check('anonymous progress access denied',anon.status===401||anon.status===403);
 console.log(JSON.stringify({passed:checks.length,checks,createdAccounts:created.length}));
}catch(error){console.error(JSON.stringify({failed:true,message:error?.message||'Smoke test failed',code:error?.code||null,completedChecks:checks}));process.exitCode=1;}
finally{
 if(process.env.QA_RECEIPT)writeFileSync(process.env.QA_RECEIPT,JSON.stringify({project:'wrmlkpuhyqxkehbvzoxx',created},null,2));
 if(cloud){await cloud.client.auth.stopAutoRefresh();await cloud.signOut().catch(()=>{});}
 delete globalThis.supabase;
}
