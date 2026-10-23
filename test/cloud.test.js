import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {cloudConfig} from '../docs/data/cloud-config.js';
import {connectCloud} from '../docs/assets/cloud.js';

test('real Supabase SDK binds delayed sync requests to the original account token',async()=>{
 const context={console,URL,URLSearchParams,Headers,Request,Response,TextEncoder,TextDecoder,AbortController,AbortSignal,setTimeout,clearTimeout,setInterval,clearInterval,atob,btoa,fetch,crypto,WebSocket:globalThis.WebSocket};
 vm.runInNewContext(readFileSync(new URL('../docs/vendor/supabase-2.118.0.js',import.meta.url),'utf8'),context);
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
 }finally{cloudConfig.url='';cloudConfig.publishableKey='';delete globalThis.supabase;}
});
