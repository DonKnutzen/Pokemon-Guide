import test from 'node:test';
import assert from 'node:assert/strict';
import {guide} from '../docs/data/gold-silver.js';
import {collectionData as data} from '../docs/data/collection-data.js';
import {blankProgress,restoreProgress,mergeBackup} from '../docs/assets/model.js';
import {routeCatches,setCaught,acquisition,routeItemGroups} from '../docs/assets/journey-model.js';
const allOpen=()=>{const s=blankProgress(guide);s.collection.gold.unlocks=data.flags.map(f=>f.id);return s;};

test('catching a species removes it from every later route, while its evolution stays missing',()=>{
 const s=allOpen();assert.ok(routeCatches(data,s,'route_29').now.some(p=>p.id===19));
 setCaught(s,19,true,'route_29');
 for(const location of data.locations){const groups=routeCatches(data,s,location.id);assert.ok(![...groups.now,...groups.later].some(p=>p.id===19));}
 const evolved=data.encounters.find(e=>e.edition==='gold'&&e.species===20);
 assert.ok(routeCatches(data,s,evolved.location).now.some(p=>p.id===20));
 assert.equal(s.collection.gold.catchLocations[19],'route_29');
});
test('a rod catch is visible under later and moves to now when that rod is confirmed',()=>{
 const s=blankProgress(guide);s.collection.gold.unlocks=['balls'];
 const before=routeCatches(data,s,'cherrygrove_city');assert.ok(before.later.some(p=>p.id===129));
 const poliwag=routeCatches(data,s,'route_30').later.find(p=>p.id===60);assert.equal(poliwag.best.method,'oldrod');
 s.collection.gold.unlocks.push('oldrod');
 const after=routeCatches(data,s,'cherrygrove_city');assert.ok(after.now.some(p=>p.id===129));
 assert.ok(!after.later.some(p=>p.id===129));
});
test('legacy edition representation stays isolated before platform migration',()=>{
 const s=allOpen();setCaught(s,16,true,'route_29');s.edition='silver';s.collection.silver.unlocks=['balls'];
 assert.ok(routeCatches(data,s,'route_29').now.some(p=>p.id===16));assert.deepEqual(s.collection.silver.caught,[]);
});
test('undoing a catch makes the species visible again and clears its attribution',()=>{
 const s=allOpen();setCaught(s,16,true,'route_29');setCaught(s,16,false);
 assert.ok(routeCatches(data,s,'route_29').now.some(p=>p.id===16));assert.equal(s.collection.gold.catchLocations[16],undefined);
});
test('legacy saves and backup merges preserve catches and validate catch locations',()=>{
 const s=blankProgress(guide);setCaught(s,16,true,'route_29');const backup=JSON.parse(JSON.stringify(s));backup.collection.gold.catchLocations[16]='foreign';
 const clean=restoreProgress(backup,guide);assert.equal(clean.collection.gold.catchLocations[16],undefined);
 const other=blankProgress(guide);setCaught(other,19,true,'route_30');const merged=mergeBackup(s,other,guide);
 assert.deepEqual(merged.collection.gold.catchLocations,{'16':'route_29','19':'route_30'});
 const old=JSON.parse(JSON.stringify(s));delete old.collection.gold.catchLocations;assert.deepEqual(restoreProgress(old,guide).collection.gold.caught,[16]);
});
test('edition-only species and starters never masquerade as regular local wild catches',()=>{
 assert.equal(acquisition(data,'silver',167).kind,'trade');assert.equal(acquisition(data,'gold',167).kind,'local');
 const s=blankProgress(guide);s.collection.gold.starter=152;
 assert.ok(!routeCatches(data,s,'new_bark_town').later.some(p=>p.id===155||p.id===158));
 assert.equal(acquisition(data,'gold',151).kind,'external');
 assert.equal(acquisition(data,'gold',172).kind,'breed');
});
test('route item rows retain collected state and defer Surf-only finds',()=>{
 const s=blankProgress(guide);let groups=routeItemGroups(data,s,'cherrygrove_city');const water=groups.later.find(i=>i.item==='MYSTIC_WATER');assert.ok(water);
 s.collection.gold.unlocks=['surf'];groups=routeItemGroups(data,s,'cherrygrove_city');assert.ok(groups.now.some(i=>i.id===water.id));
 s.collection.gold.items=[water.id];groups=routeItemGroups(data,s,'cherrygrove_city');assert.ok(groups.done.some(i=>i.id===water.id));assert.ok(!groups.now.some(i=>i.id===water.id));
});
