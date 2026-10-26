import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {data,routeMons,routeItems,requirements,directSources,options,suggestStage,applyOwned,setStage,stageOf,flags} from '../docs/assets/frlg-model.js';
import {emptyLibrary,markCaught,caughtIn,writeRecord,restoreLibrary} from '../docs/assets/platform-model.js';
const fresh=()=>{const l=emptyLibrary('frlg-test-device');l.selectedEdition='firered';return l;};
const unlock=(l,...ids)=>{for(const id of ids)writeRecord(l,'unlock.firered.'+id,true);};
test('FRLG source facts cover both complete wild tables and all physical pickup fields',()=>{
 assert.equal(Object.keys(data.species).length,386);
 for(const ed of ['firered','leafgreen']){
  assert.equal(data.encounters.filter(x=>x.edition===ed).length,ed==='firered'?1007:1009);
  assert.equal(data.items.filter(x=>x.edition===ed&&x.kind==='hidden').length,171);
  assert.equal(data.items.filter(x=>x.edition===ed&&x.kind==='ground').length,168);
  const ids=new Set();for(const it of data.items.filter(x=>x.edition===ed)){assert(!ids.has(it.id),it.id);ids.add(it.id);const m=data.maps[it.map];assert(m,it.map);if(it.x!==null&&it.x!==undefined){assert(it.x>=0&&it.x<m.width,it.id);assert(it.y>=0&&it.y<m.height,it.id);assert(m.terrain,it.map);}}
 }
 const atlases=new Set(Object.values(data.maps).filter(m=>m.terrain).map(m=>m.terrain[0]));for(const i of atlases){const b=fs.readFileSync(new URL('../docs/assets/frlg-maps/terrain-'+i+'.webp',import.meta.url));assert(b.length>100);assert.equal(b.subarray(0,4).toString(),'RIFF');}
});
test('edition-specific Route 24 species differ and shared catches disappear everywhere',()=>{
 const l=fresh();unlock(l,'balls');setStage(l,'firered',17);setStage(l,'leafgreen',17);writeRecord(l,'unlock.leafgreen.balls',true);
 assert(routeMons(l,'firered','route_24').some(x=>x.id===43));assert(!routeMons(l,'leafgreen','route_24').some(x=>x.id===43));assert(routeMons(l,'leafgreen','route_24').some(x=>x.id===69));
 markCaught(l,'firered',43,true,'route_24');assert(routeMons(l,'firered','route_25').find(x=>x.id===43).owned);assert(caughtIn(l,'frlg').includes(43));assert(!caughtIn(l,'gsc').includes(43));assert(!caughtIn(l,'frlg').includes(44));
});
test('all three rods are independent; Surf cannot unlock an unowned rod',()=>{
 const l=fresh();setStage(l,'firered',17);unlock(l,'balls','surf','oldrod');const rows=data.encounters.filter(x=>x.edition==='firered');
 assert.deepEqual(requirements(rows.find(x=>x.method==='oldrod'),l,'firered'),[]);
 assert(requirements(rows.find(x=>x.method==='superrod'),l,'firered').some(x=>x.includes('Superangel')));
});
test('Mewtwo, roamers and Unown retain their actual late-game requirements',()=>{
 const l=fresh();setStage(l,'firered',12);unlock(l,'balls','surf','strength');const mewtwo=directSources(150,'firered')[0];assert(requirements(mewtwo,l,'firered').length);setStage(l,'firered',17);assert.deepEqual(requirements(mewtwo,l,'firered'),[]);
 writeRecord(l,'setting.firered.starter',1);const roamer=directSources(244,'firered').find(x=>x.method==='roamer');assert.deepEqual(requirements(roamer,l,'firered'),[]);assert(requirements(directSources(245,'firered').find(x=>x.method==='roamer'),l,'firered').some(x=>x.includes('andere Wahl')));
 const unown=directSources(201,'firered')[0];assert(requirements(unown,l,'firered').includes('Tanoby-Schlüssel gelöst'));unlock(l,'tanoby');assert.deepEqual(requirements(unown,l,'firered'),[]);
});
test('Pichu breeding is offered through native Pikachu; Crobat needs National Dex',()=>{
 const l=fresh();markCaught(l,'firered',25,true);assert(options(172,l,'firered').some(x=>x.type==='breed'&&x.status==='later'));setStage(l,'firered',14);assert(options(172,l,'firered').some(x=>x.type==='breed'&&x.ready));
 markCaught(l,'firered',42,true);setStage(l,'firered',12);assert(options(169,l,'firered').some(x=>x.type==='evolution'&&x.missing.includes('Nationaldex')));
 setStage(l,'firered',13);assert(options(169,l,'firered').some(x=>x.type==='evolution'&&x.ready));
});
test('Espeon and Umbreon never pretend FRLG has a day/night evolution clock',()=>{
 const l=fresh();markCaught(l,'firered',133,true);setStage(l,'firered',17);for(const id of [196,197]){const o=options(id,l,'firered').find(x=>x.type==='evolution');assert.equal(o.status,'external');assert.match(o.text,/Rubin\/Saphir\/Smaragd/);}
});
test('old-save bulk setup changes only its selected range and preserves existing attribution/items/other editions',()=>{
 const l=fresh();markCaught(l,'firered',25,true,'viridian_forest');markCaught(l,'leafgreen',175,true);markCaught(l,'gold',25,true);writeRecord(l,'item.firered.test-pickup',true);writeRecord(l,'unlock.leafgreen.surf',true);setStage(l,'leafgreen',14);
 const attribution=structuredClone(l.records['caught.frlg.25']);applyOwned(l,'firered',[25,1,2],151);setStage(l,'firered',4);
 assert.deepEqual(l.records['caught.frlg.25'],attribution);assert(caughtIn(l,'frlg').includes(175));assert(caughtIn(l,'gsc').includes(25));assert(l.records['item.firered.test-pickup'].value);assert.equal(stageOf(l,'leafgreen'),14);
 const reloaded=restoreLibrary(JSON.parse(JSON.stringify(l)),'another-test-device');assert.equal(stageOf(reloaded,'firered'),4);assert(flags(reloaded,'leafgreen').has('surf'));
});
test('stage inference is advisory even with traded late-game Pokémon',()=>{
 const l=fresh(),before=JSON.stringify(l),hint=suggestStage([150,175,1],'firered');assert(hint.stage>=14);assert.match(hint.warning,/schaltet nichts frei/);assert.equal(JSON.stringify(l),before);assert.equal(stageOf(l,'firered'),0);
});
test('Kaskade, exact-tile Detektor rewards, SS Anne and event islands remain explicit',()=>{
 const l=fresh();const waterfall=data.items.find(x=>x.item==='ITEM_HM07');assert(waterfall);assert.equal(waterfall.map,'MAP_FOUR_ISLAND_ICEFALL_CAVE_1F');
 for(const item of ['ITEM_SOOTHE_BELL','ITEM_MACHO_BRACE','ITEM_LEFTOVERS'])assert(data.items.some(x=>x.item===item&&x.underfoot));
 assert(routeItems(l,'firered','s_s_anne').length>0);assert(directSources(249,'firered').every(x=>x.historicalEvent));assert(options(249,l,'firered').every(x=>!x.ready));
});

test('progress hints account for early evolution instead of only late wild encounters',()=>{
 const hint=suggestStage([64],'firered');assert(hint.stage<17);assert(hint.stage<=2);
});

test('native event encounters keep their event label in the default missing plan',()=>{
 const l=fresh();for(const id of [249,250,386])assert.equal(options(id,l,'firered')[0].status,'event');
});
