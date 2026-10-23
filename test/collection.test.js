import test from 'node:test';
import assert from 'node:assert/strict';
import {guide} from '../docs/data/gold-silver.js';
import {collectionData as data} from '../docs/data/collection-data.js';
import {blankProgress,restoreProgress,mergeBackup} from '../docs/assets/model.js';
import {locationPokemon,availability,unlockedFlags,returnTargets,restoreCollections} from '../docs/assets/collection-model.js';

test('all species, collection IDs, map coordinates and requirements are valid',()=>{
 assert.equal(Object.keys(data.species).length,251);
 assert.equal(data.species[1].name,'Bisasam');assert.equal(data.species[251].name,'Celebi');
 const flags=new Set(data.flags.map(f=>f.id)),locations=new Set(data.locations.map(l=>l.id));
 const tasks=new Set(guide.chapters.flatMap(c=>c.steps).map(s=>s.id));
 for(const f of data.flags)for(const id of [...f.steps,...Object.values(f.stepsByEdition||{}).flat()])assert.ok(tasks.has(id),id);
 for(const e of [...data.items,...data.encounters]){
  assert.ok(data.maps[e.map],e.map);assert.ok(locations.has(e.location),e.location);
  for(const req of e.requirements)assert.ok(flags.has(req),req);
  if(e.species)assert.ok(data.species[e.species]);
  if(e.x!==undefined){assert.ok(e.x>=0&&e.x<data.maps[e.map].size[0],e.id);assert.ok(e.y>=0&&e.y<data.maps[e.map].size[1],e.id);}
 }
 for(const ed of ['gold','silver']){const items=data.items.filter(i=>i.edition===ed);assert.equal(new Set(items.map(i=>i.id)).size,items.length);}
});
test('first Route 29 visit introduces exactly the four normal wild species',()=>{
 const mons=locationPokemon(data,'gold','route_29');
 assert.deepEqual(mons.filter(m=>m.newWild).map(m=>m.id).sort((a,b)=>a-b),[16,19,161,163]);
 assert.ok(!mons.find(m=>m.id===214).newWild,'Heracross is a later headbutt return, not a first-visit catch');
});
test('Route 30 new species differ correctly between Gold and Silver',()=>{
 const gold=locationPokemon(data,'gold','route_30').filter(m=>m.newWild).map(m=>m.id);
 const silver=locationPokemon(data,'silver','route_30').filter(m=>m.newWild).map(m=>m.id);
 assert.ok(gold.includes(10)&&gold.includes(11)&&gold.includes(167));
 assert.ok(!gold.includes(13)&&!gold.includes(165));
 assert.ok(silver.includes(13)&&silver.includes(14)&&silver.includes(165));
});
test('daytime filters do not offer a night-only Hoothoot catch',()=>{
 const state=blankProgress(guide);state.collection.gold.unlocks=['balls'];state.collection.gold.time='day';
 const e=data.encounters.find(e=>e.edition==='gold'&&e.map==='ROUTE_29'&&e.species===163);
 assert.equal(availability(e,unlockedFlags(data,state),state.collection.gold).available,false);
 state.collection.gold.time='nite';assert.equal(availability(e,unlockedFlags(data,state),state.collection.gold).available,true);
});
test('unused city headbutt tables never become fake catch locations',()=>{
 assert.ok(!data.encounters.some(e=>e.method==='headbutt'&&['NEW_BARK_TOWN','VIOLET_CITY','ECRUTEAK_CITY','MAHOGANY_TOWN','BLACKTHORN_CITY'].includes(e.map)));
});
test('Alph grass and dark cave upper section are not offered on the first visit',()=>{
 const state=blankProgress(guide);state.collection.gold.unlocks=['balls'];const flags=unlockedFlags(data,state);
 for(const e of data.encounters.filter(e=>e.edition==='gold'&&(['RUINS_OF_ALPH_OUTSIDE','DARK_CAVE_BLACKTHORN_ENTRANCE'].includes(e.map))))assert.equal(availability(e,flags,state.collection.gold).available,false);
});
test('Mystic Water is deferred until Surf and then appears as a return target',()=>{
 const state=blankProgress(guide),co=state.collection.gold;co.visited=['cherrygrove_city'];
 const water=data.items.find(i=>i.edition==='gold'&&i.map==='CHERRYGROVE_CITY'&&i.item==='MYSTIC_WATER');
 assert.equal(availability(water,unlockedFlags(data,state),co).available,false);
 co.unlocks.push('surf');assert.ok(returnTargets(data,state).some(t=>t.items.some(i=>i.id===water.id)));
 co.items.push(water.id);assert.ok(!returnTargets(data,state).some(t=>t.items.some(i=>i.id===water.id)));
});
test('gym TM gifts require the matching victory, not just entering the city',()=>{
 const state=blankProgress(guide),co=state.collection.gold;
 const reward=data.items.find(i=>i.edition==='gold'&&i.map==='AZALEA_GYM'&&i.item==='TM_FURY_CUTTER');
 assert.equal(availability(reward,unlockedFlags(data,state),co).available,false);
 state.completed.gold.push('azalea-gym');assert.equal(availability(reward,unlockedFlags(data,state),co).available,true);
});
test('later headbutt Pokémon in visited Route 29 become return targets',()=>{
 const state=blankProgress(guide);state.collection.gold.visited=['route_29'];state.collection.gold.unlocks=['balls','headbutt'];
 const row=returnTargets(data,state).find(t=>t.location.id==='route_29');assert.ok(row.pokemon.some(p=>p.id===214));
});
test('wings are actual prerequisites, independently of the radio module',()=>{
 const state=blankProgress(guide);state.collection.gold.unlocks=['balls','cut','surf','whirl','radio','radioKanto'];
 const lugia=data.encounters.find(e=>e.edition==='gold'&&e.species===249);
 assert.equal(availability(lugia,unlockedFlags(data,state),state.collection.gold).available,false);
 state.collection.gold.unlocks.push('silverWing');assert.equal(availability(lugia,unlockedFlags(data,state),state.collection.gold).available,true);
});
test('weekday, swarm and item access conditions remain distinct',()=>{
 const state=blankProgress(guide),co=state.collection.gold;co.unlocks=data.flags.map(f=>f.id).filter(id=>!id.startsWith('swarm_'));co.weekday=2;
 const lapras=data.encounters.find(e=>e.edition==='gold'&&e.species===131&&e.method==='static');
 assert.equal(availability(lapras,unlockedFlags(data,state),co).available,false);
 co.weekday=5;assert.equal(availability(lapras,unlockedFlags(data,state),co).available,true);
 const swarm=data.encounters.find(e=>e.edition==='gold'&&e.special);assert.equal(availability(swarm,unlockedFlags(data,state),co).available,false);
 const bow=data.items.find(i=>i.edition==='gold'&&i.map==='ROUTE_29'&&i.item==='PINK_BOW');
 assert.ok(bow.requirements.includes('falk'));assert.deepEqual(bow.weekdays,[2]);
});
test('old v1 saves and backups preserve story progress while adding collection fields',()=>{
 const old={version:1,guideId:guide.id,edition:'gold',completed:{gold:['start-clock'],silver:[]},lastChapter:{gold:'neuborkia',silver:'neuborkia'}};
 const restored=restoreProgress(old,guide);assert.deepEqual(restored.completed.gold,['start-clock']);assert.deepEqual(restored.collection.gold.caught,[]);
 restored.collection.gold.caught=[16];const merged=mergeBackup(restored,old,guide);assert.deepEqual(merged.collection.gold.caught,[16]);
});
test('collection backups merge editions without crossing catches or accepting foreign IDs',()=>{
 const a=blankProgress(guide),b=blankProgress(guide);a.collection.gold.caught=[16];b.collection.gold.caught=[19];b.collection.silver.caught=[152];
 const merged=mergeBackup(a,b,guide);assert.deepEqual(merged.collection.gold.caught,[16,19]);assert.deepEqual(merged.collection.silver.caught,[152]);
 const clean=restoreCollections({gold:{caught:[0,1,252,'16',1],items:['foreign'],unlocks:['foreign']}},data);
 assert.deepEqual(clean.gold.caught,[1]);assert.deepEqual(clean.gold.items,[]);assert.deepEqual(clean.gold.unlocks,[]);
});
test('original map pickups are covered and event-only Pokémon are labelled',()=>{
 const items=data.items.filter(i=>i.edition==='gold');
 assert.equal(items.filter(i=>i.kind==='ground').length,136); // two park ground duplicates share the same game events
 assert.equal(items.filter(i=>i.kind==='hidden').length,87); // 87 scripted + café, minus duplicate park
 assert.ok(data.species[151].external&&data.species[251].external);
 assert.ok(!data.species[142].external&&!data.species[143].external);
 assert.ok(data.species[144].external&&data.species[145].external&&data.species[146].external);
});
