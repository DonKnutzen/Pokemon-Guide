import test from 'node:test';
import assert from 'node:assert/strict';
import {guide} from '../docs/data/gold-silver.js';
import {collectionData as data} from '../docs/data/collection-data.js';
import {games,series} from '../docs/data/catalog.js';
import {speciesIndex} from '../docs/data/species-index.js';
import {blankProgress} from '../docs/assets/model.js';
import {emptyLibrary,restoreLibrary,writeRecord,markCaught,caughtIn,allCaught,guideView,applyGuideView,migrateLegacy,mergeRecords,pendingRows,importLibrary,catchRecord,accountKey,GUEST_KEY,mergeDeviceLibrary} from '../docs/assets/platform-model.js';
import {routeCatches,routeItemGroups,setCaught} from '../docs/assets/journey-model.js';
import {syncLibrary} from '../docs/assets/sync-engine.js';
const fresh=device=>emptyLibrary(device||'device-one');
const rows=lib=>Object.entries(lib.records).map(([key,r])=>({key,...r}));

test('catalog has eleven distinct editions, four sharing scopes and complete 386-species names',()=>{
 assert.equal(games.length,11);assert.equal(series.length,4);assert.equal(new Set(games.map(g=>g.id)).size,11);
 assert.equal(speciesIndex.length,386);assert.equal(speciesIndex[385].name,'Deoxys');
 for(const s of series)assert.ok(games.some(g=>g.series===s.id));
});
test('a Gold catch hides in Silver as well, but leaves Red and the evolution unmarked',()=>{
 const lib=fresh();let view=guideView(lib,guide);view.collection.gold.unlocks=['balls'];setCaught(view,16,true,'route_29');applyGuideView(lib,view,guide);
 lib.selectedEdition='silver';view=guideView(lib,guide);view.collection.silver.unlocks=['balls'];
 assert.deepEqual(view.collection.silver.caught,[16]);assert.deepEqual(caughtIn(lib,'rby'),[]);
 assert.ok(![...routeCatches(data,view,'route_29').now,...routeCatches(data,view,'route_29').later].some(p=>p.id===16));assert.ok(!caughtIn(lib,'gsc').includes(17));
 assert.deepEqual(catchRecord(lib,'gsc',16),{caught:true,edition:'gold',location:'route_29'});
});
test('each series shares catches internally and remains independent of the others',()=>{
 const lib=fresh();for(const [edition,scope]of [['blue','rby'],['crystal','gsc'],['sapphire','rse'],['leafgreen','frlg']]){
  markCaught(lib,edition,25,true);assert.ok(caughtIn(lib,scope).includes(25));
 }
 assert.deepEqual(allCaught(lib),[25]);markCaught(lib,'red',25,false);assert.deepEqual(caughtIn(lib,'rby'),[]);assert.deepEqual(caughtIn(lib,'gsc'),[25]);
});
test('items, route, starter, time, equipment and story remain per-edition after reload',()=>{
 const lib=fresh(),view=guideView(lib,guide),item=data.items.find(i=>i.edition==='gold'&&i.location==='route_29'&&i.kind!=='shop');
 view.collection.gold.items=[item.id];view.collection.gold.unlocks=['balls'];view.collection.gold.visited=['route_29'];view.collection.gold.lastLocation='route_29';view.collection.gold.starter=152;view.collection.gold.time='nite';view.completed.gold=['start-clock'];applyGuideView(lib,view,guide);
 const clean=guideView(restoreLibrary(JSON.parse(JSON.stringify(lib)),'device-two'),guide);
 assert.deepEqual(clean.collection.silver.items,[]);assert.deepEqual(clean.collection.silver.unlocks,[]);assert.equal(clean.collection.silver.starter,0);assert.equal(clean.collection.silver.time,'all');assert.deepEqual(clean.completed.silver,[]);assert.equal(clean.collection.silver.lastLocation,'new_bark_town');assert.ok(routeItemGroups(data,clean,item.location).done.some(i=>i.id===item.id));
});
test('legacy migration unions catches, keeps edition fields and does not repeat after undo',()=>{
 const old=blankProgress(guide);old.edition='silver';old.collection.gold.caught=[16];old.collection.gold.catchLocations={16:'route_29'};old.collection.silver.caught=[19];old.collection.silver.unlocks=['oldrod'];old.collection.silver.lastLocation='cherrygrove_city';old.completed.gold=['start-clock'];
 const lib=fresh();migrateLegacy(lib,old,guide);assert.deepEqual(caughtIn(lib,'gsc'),[16,19]);assert.equal(lib.selectedEdition,'silver');assert.deepEqual(guideView(lib,guide).collection.gold.unlocks,[]);assert.deepEqual(guideView(lib,guide).collection.silver.unlocks,['oldrod']);
 markCaught(lib,'gold',16,false);migrateLegacy(lib,old,guide);assert.deepEqual(caughtIn(lib,'gsc'),[19]);
});
test('invalid series, species, record values and attribution are rejected',()=>{
 const lib=fresh();markCaught(lib,'red',151,true);const raw=JSON.parse(JSON.stringify(lib)),r=raw.records['caught.rby.151'];
 raw.records['caught.rby.252']={...r};raw.records['caught.gsc.25']={...r,value:{caught:true,edition:'red'}};raw.records['setting.gold.starter']={...r,value:4};raw.records['item.gold.invalid']={...r,value:'yes'};
 const clean=restoreLibrary(raw,'device-two');assert.equal(Object.keys(clean.records).length,1);assert.deepEqual(caughtIn(clean,'rby'),[151]);assert.throws(()=>markCaught(lib,'red',252,true));
});
test('independent offline catches merge and a newer undo wins over an old caught value',()=>{
 const a=fresh('device-one'),b=fresh('device-two');markCaught(a,'gold',16,true);markCaught(b,'silver',19,true);mergeRecords(a,rows(b));mergeRecords(b,rows(a));assert.deepEqual(caughtIn(a,'gsc'),[16,19]);
 const stale=rows(a);markCaught(a,'silver',16,false);mergeRecords(b,rows(a));mergeRecords(b,stale);assert.deepEqual(caughtIn(b,'gsc'),[19]);
});
test('logical clocks advance past merged records on devices with slow physical clocks',()=>{
 const a=fresh(),b=fresh('device-two');writeRecord(a,'caught.gsc.25',{caught:true,edition:'gold'},9000000000000);mergeRecords(b,rows(a));writeRecord(b,'caught.gsc.25',{caught:false},1);assert.ok(b.records['caught.gsc.25'].stamp>a.records['caught.gsc.25'].stamp);
});
test('backup and guest imports add positive progress across rows without clearing existing catches',()=>{
 const account=fresh(),guest=fresh('guest-device');markCaught(account,'red',1,true);markCaught(guest,'blue',4,true);markCaught(guest,'gold',25,true);markCaught(guest,'blue',1,false);importLibrary(account,guest);assert.deepEqual(caughtIn(account,'rby'),[1,4]);assert.deepEqual(caughtIn(account,'gsc'),[25]);
 assert.notEqual(accountKey('user-a'),accountKey('user-b'));assert.notEqual(accountKey('user-a'),GUEST_KEY);
});
test('sync never acknowledges edits made during a pending write and preserves the remote independent catch',async()=>{
 const lib=fresh(),remote=fresh('remote-device');markCaught(lib,'gold',16,true);markCaught(remote,'silver',19,true);let first=true;
 await syncLibrary(lib,{async push(batch){mergeRecords(remote,batch);if(first){first=false;markCaught(lib,'gold',16,false);}},async pull(){return rows(remote);}});
 assert.deepEqual(caughtIn(lib,'gsc'),[19]);assert.equal(pendingRows(lib).length,1);assert.equal(pendingRows(lib)[0].value.caught,false);
 await syncLibrary(lib,{async push(batch){mergeRecords(remote,batch);},async pull(){return rows(remote);}});assert.equal(pendingRows(lib).length,0);assert.deepEqual(caughtIn(remote,'gsc'),[19]);
});
test('failed network writes remain pending and a changed account cannot receive a late response',async()=>{
 const lib=fresh(),remote=fresh('remote-device');markCaught(lib,'gold',25,true);await assert.rejects(syncLibrary(lib,{async push(){throw Error('offline');},async pull(){return [];}}));assert.equal(pendingRows(lib).length,1);
 let current=true;markCaught(remote,'gold',19,true);const before=JSON.stringify(lib.records);await syncLibrary(lib,{async push(){},async pull(){current=false;return rows(remote);}},{isCurrent:()=>current});assert.equal(JSON.stringify(lib.records),before);
});
test('sync paginates beyond the provider default and sends bounded batches',async()=>{
 const lib=fresh();for(let i=1;i<=251;i++)markCaught(lib,'gold',i,true);for(let i=1;i<=386;i++)markCaught(lib,'ruby',i,true);for(let i=1;i<=386;i++)markCaught(lib,'firered',i,true);
 const sent=[],remote=new Map();await syncLibrary(lib,{async push(batch){sent.push(batch.length);for(const r of batch)remote.set(r.key,r);},async pull(offset,size){return [...remote.values()].sort((a,b)=>a.key.localeCompare(b.key)).slice(offset,offset+size);}});
 assert.equal(sent.length,3);assert.ok(sent.every(n=>n<=400));assert.equal(pendingRows(lib).length,0);assert.equal(Object.keys(lib.records).length,1023);
});

import {configured} from '../docs/assets/cloud.js';
test('only public Supabase keys are accepted and secret/service-role keys are rejected',()=>{
 const url='https://pokemon-test.supabase.co';
 assert.equal(configured({url,publishableKey:'sb_publishable_example_123'}),true);
 assert.equal(configured({url,publishableKey:'sb_secret_example_123'}),false);
 const jwt=role=>'eyJ.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
 assert.equal(configured({url,publishableKey:jwt('anon')}),true);assert.equal(configured({url,publishableKey:jwt('service_role')}),false);
 assert.equal(configured({url:'http://example.com',publishableKey:'sb_publishable_test'}),false);
});

test('a second local tab retains unsynced writes even after the first tab closes',()=>{
 const a=fresh(),b=fresh('device-two');markCaught(a,'gold',25,true);mergeDeviceLibrary(b,restoreLibrary(JSON.parse(JSON.stringify(a)),'device-two'));assert.equal(pendingRows(b).length,1);
 markCaught(b,'silver',19,true);const reopened=restoreLibrary(JSON.parse(JSON.stringify(b)),'device-three');assert.equal(pendingRows(reopened).length,2);assert.deepEqual(caughtIn(reopened,'gsc'),[19,25]);
});
