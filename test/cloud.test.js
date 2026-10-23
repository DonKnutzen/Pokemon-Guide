import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {cloudConfig} from '../docs/data/cloud-config.js?v=8';
import {connectCloud} from '../docs/assets/cloud.js';

test('real Supabase SDK binds delayed sync requests to the original account token',async()=>{
 const context={console,URL,URLSearchParams,Headers,Request,Response,TextEncoder,TextDecoder,AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,atob,btoa,fetch,crypto,WebSocket:globalThis.WebSocket};
 vm.runInNewContext(readFileSync(new URL('../docs/vendor/supabase-2.118.0.js',import.meta.url),'utf8'),context);
 const originalConfig={...cloudConfig};
 const requests=[];globalThis.supabase={createClient:(url,key,options)=>context.supabase.createClient(url,key,{...options,auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(url,init)=>{requests.push({url:String(url),headers:new Headers(init.headers)});return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});}}})};
 cloudConfig.url='https://pokemon-test.supabase.co';cloudConfig.publishableKey='sb_publishable_test_only';
 try{
  const cloud=await connectCloud(()=>{});cloud.client.auth.getSession=async()=>({data:{session:{user:{id:'account-a'},access_token:'token-account-a'}}});
  const transport=await cloud.transport('account-a');
  cloud.client.auth.getSession=async()=>({data:{session:{user:{id:'account-b'},access_token:'token-account-b'}}});
  await transport.push([{key:'caught.gsc.25',value:{caught:true},stamp:'1700000000000-000001-device-one'}]);await transport.pull(800,800);
  assert.equal(requests.length,2);for(const request of requests)assert.equal(request.headers.get('Authorization'),'Bearer token-account-a');
  assert.ok(requests[0].url.endsWith('/rest/v1/rpc/apply_pokeguide_records'));assert.equal(new URL(requests[1].url).searchParams.get('offset'),'800');assert.equal(new URL(requests[1].url).searchParams.get('limit'),'800');
  await assert.rejects(cloud.transport('account-a'),/Account changed/);
 }finally{Object.assign(cloudConfig,originalConfig);delete globalThis.supabase;}
});


test('trainer login accepts exactly four alphanumeric characters and installs a server session',async()=>{
 const originalConfig={...cloudConfig},originalFetch=globalThis.fetch,requests=[],installed=[];
 cloudConfig.url='https://pokemon-test.supabase.co';cloudConfig.publishableKey='sb_publishable_test_only';
 globalThis.supabase={createClient:()=>({auth:{onAuthStateChange(){},async setSession(session){installed.push(session);return {data:{session},error:null};}}})};
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body),headers:init.headers});return Response.json({session:{access_token:'test-access',refresh_token:'test-refresh'}});};
 try{
  const cloud=await connectCloud(()=>{});
  for(const pin of ['123','12345','äB12','ab!2','ab 2'])await assert.rejects(cloud.signIn('Trainer',pin),error=>error.code==='invalid_input');
  await assert.rejects(cloud.signUp('ab','Ab12'),error=>error.code==='invalid_input');
  assert.equal(requests.length,0);
  await cloud.signUp(' Trainer_1 ','aB09');await cloud.signIn('trainer_1','0000');
  assert.equal(requests.length,2);assert.equal(installed.length,2);
  assert.deepEqual(requests[0].body,{action:'register',username:'Trainer_1',pin:'aB09'});
  assert.deepEqual(requests[1].body,{action:'login',username:'trainer_1',pin:'0000'});
  assert.equal(requests[0].url,'https://pokemon-test.supabase.co/functions/v1/trainer-auth');
  assert.equal(requests[0].headers.apikey,'sb_publishable_test_only');
 }finally{Object.assign(cloudConfig,originalConfig);globalThis.fetch=originalFetch;delete globalThis.supabase;}
});

test('server rejections never create a session or substitute a different login method',async()=>{
 const originalConfig={...cloudConfig},originalFetch=globalThis.fetch;let installed=0;
 cloudConfig.url='https://pokemon-test.supabase.co';cloudConfig.publishableKey='sb_publishable_test_only';
 globalThis.supabase={createClient:()=>({auth:{onAuthStateChange(){},async setSession(){installed++;throw Error('must not install rejected credentials');}}})};
 try{
  const cloud=await connectCloud(()=>{});
  for(const [status,code]of [[401,'invalid_credentials'],[409,'username_taken'],[429,'rate_limited'],[503,'service_unavailable']]){
   globalThis.fetch=async()=>Response.json({code},{status});
   await assert.rejects(cloud.signIn('Trainer','aB09'),error=>error.code===code);
  }
  assert.equal(installed,0);
 }finally{Object.assign(cloudConfig,originalConfig);globalThis.fetch=originalFetch;delete globalThis.supabase;}
});
