import {frlgData as data} from '../data/frlg-data.js?v=9';
import {speciesIndex} from '../data/species-index.js';
import {caughtIn,markCaught,writeRecord} from './platform-model.js?v=9';
export {data};
export const nameOf=id=>speciesIndex[id-1]?.name||'Unbekannt';
export const stages=[['Start · Pokédex erhalten',0],['Felsorden · Weg zum Mondberg',1],['Azuria · Bill & Quellorden',2],['Orania · M.S. Anne',3],['Zerschneider · Felstunnel',4],['Prismania · Rocket-Versteck',5],['Silph Scope · Pokéflöte · Saffronia',6],['Fuchsania · Seelenorden & Safari',7],['Zinnoberinsel · Vulkanorden',8],['Bills Auftrag · Eiland Eins–Drei',9],['Sieben Orden · Vertania-Arena',10],['Acht Orden · Siegesstraße',11],['Pokémon-Liga geschafft',12],['Nationaldex · Rubin-Auftrag',13],['Bunt-Pass · Eiland Vier–Sieben',14],['Lorelei geholfen · Punktloch',15],['Beide Passwörter · Rocket-Lager',16],['Saphir abgegeben · Netzwerk repariert',17]];
export const gear=[['balls','Pokébälle'],['cut','Zerschneider einsetzbar'],['surf','Surfer einsetzbar'],['strength','Stärke einsetzbar'],['smash','Zertrümmerer einsetzbar'],['waterfall','Kaskade einsetzbar'],['oldrod','Angel · Orania'],['goodrod','Profiangel · Fuchsania'],['superrod','Superangel · Route 12'],['finder','Detektor · 30 Arten, Route 11'],['bike','Fahrrad · Azuria'],['tanoby','Tanoby-Schlüssel gelöst'],['event','Historische Event-Tickets vorhanden']];
export const methodNames={grass:'Gras / Höhlenboden',surf:'Surfer',oldrod:'Angel',goodrod:'Profiangel',superrod:'Superangel',smash:'Zertrümmerer',gift:'Geschenk / Kauf',static:'Einmaliger Kampf',fossil:'Fossil wiederbeleben',prize:'Spielhalle',trade:'NPC-Tausch',egg:'Ei-Geschenk',roamer:'Wanderpokémon',event:'Historisches Event'};
export const kindNames={ground:'Sichtbarer Fund',hidden:'Versteckt',person:'Person / Belohnung'};
export const get=(lib,ed,key,fallback=0)=>lib.records[`setting.${ed}.${key}`]?.value??fallback;
export const has=(lib,ed,flag)=>lib.records[`unlock.${ed}.${flag}`]?.value===true;
export const stageOf=(lib,ed)=>get(lib,ed,'frlgStage',0);
export const areaBy=id=>data.areas.find(a=>a.id===id);
export const areaOf=map=>areaBy(data.maps[map]?.area);
export const mapStage=map=>data.maps[map]?.stage??areaOf(map)?.stage??99;
export const lastArea=(lib,ed)=>areaBy(get(lib,ed,'lastLocation','pallet_town'))?.id||'pallet_town';
export const itemName=item=>data.itemNames[item]||item.replace(/^ITEM_/,'').toLowerCase().replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
export function flags(lib,ed){const s=stageOf(lib,ed),f=new Set(gear.filter(([id])=>has(lib,ed,id)).map(([id])=>id));if(s>=6)f.add('flute');if(s>=9)f.add('tri');if(s>=13)f.add('national');if(s>=14)f.add('rainbow');if(s>=17)f.add('network');return f;}
const flagNames={...Object.fromEntries(gear),flute:'Pokéflöte',tri:'Tri-Pass',national:'Nationaldex',rainbow:'Bunt-Pass',network:'Celios Netzwerk repariert','npc-trade':'passendes Tausch-Pokémon',wireless:'Drahtlos-Verbindung / Beerenpulver'};
export function requirements(source,lib,ed){
 const f=flags(lib,ed),missing=[];const stage=mapStage(source.map);
 if(stage===99&&!f.has('event'))missing.push('historisches Event-Ticket');else if(stage!==99&&stage>stageOf(lib,ed))missing.push(stages.find(x=>x[1]===stage)?.[0]||'späterer Spielabschnitt');
 let needed=[...(source.requires||[])];if(source.underfoot)needed.push('finder');if(source.map?.includes('SSANNE')&&has(lib,ed,'ssanneGone'))missing.push('Schiff bereits abgelegt · Fund verpasst');if(['surf','oldrod','goodrod','superrod','smash'].includes(source.method))needed.push(source.method);
 if(['grass','surf','oldrod','goodrod','superrod','smash','static','roamer','event'].includes(source.method))needed.push('balls');
 if(source.map?.includes('TANOBY')&&source.species===201)needed.push('tanoby');
 if(source.choice){const selected=get(lib,ed,source.choice,0);if(!selected)missing.push(source.choice==='starter'?'Starter bestätigen':source.choice==='dojo'?'Dojo-Wahl bestätigen':'Fossil-Wahl bestätigen');else if(selected!==source.choiceValue)missing.push('andere Wahl · Tausch oder Zucht nötig');}
 if(source.tradeFor&&!caughtIn(lib,'frlg').includes(source.tradeFor))missing.push(nameOf(source.tradeFor)+' zum Tauschen');
 for(const key of new Set(needed))if(!f.has(key))missing.push(flagNames[key]||'besondere Voraussetzung');
 return [...new Set(missing)];
}
export const directSources=(id,ed)=>[...data.encounters,...data.specials].filter(x=>x.edition===ed&&x.species===id);
function evoText(e){const p=nameOf(e.from),n=e.param;switch(e.method){
 case'level':return p+' auf Level '+n+' bringen';case'friendship':return p+' mit hoher Freundschaft ein Level aufsteigen lassen';case'friendship_day':case'friendship_night':return p+' in Rubin/Saphir/Smaragd zur passenden Tageszeit mit hoher Freundschaft entwickeln und zurücktauschen';case'item':return itemName(n)+' auf '+p+' anwenden';case'trade':return p+' tauschen und zurücktauschen';case'trade_item':return p+' mit '+itemName(n)+' tauschen und zurücktauschen';case'beauty':return p+' in Rubin/Saphir/Smaragd mit Pokériegeln auf hohe Schönheit bringen, dann ein Level aufsteigen lassen';case'level_atk_gt_def':return p+' ab Level '+n+' mit Angriff > Verteidigung entwickeln';case'level_atk_eq_def':return p+' ab Level '+n+' mit Angriff = Verteidigung entwickeln';case'level_atk_lt_def':return p+' ab Level '+n+' mit Angriff < Verteidigung entwickeln';case'level_silcoon':case'level_cascoon':return p+' ab Level '+n+' entwickeln; Ergebnis hängt vom Persönlichkeitwert ab (nicht frei wählbar)';case'level_ninjask':return p+' auf Level '+n+' entwickeln';case'level_shedinja':return p+' auf Level '+n+' entwickeln: freier Teamplatz und Pokéball im Beutel nötig';default:return p+' entwickeln';}}
const babyParents={172:[25,26],173:[35,36],174:[39,40],175:[176],236:[106,107,237],238:[124],239:[125],240:[126],298:[183,184],360:[202]};
function familyChildren(id,seen=new Set()){if(seen.has(id))return[];seen.add(id);return [id,...Object.values(data.species).filter(x=>x.evolutions.some(e=>e.from===id)).flatMap(x=>familyChildren(x.id,seen))];}
function breedingParents(id){const s=data.species[id];if(babyParents[id])return babyParents[id];if(!s||s.evolutions.length||s.eggGroups.some(x=>['UNDISCOVERED','DITTO'].includes(x)))return[];return familyChildren(id);}
export function options(id,lib,ed,seen=new Set()){
 if(seen.has(id))return[];seen=new Set(seen).add(id);const owned=new Set(caughtIn(lib,'frlg')),out=[];
 for(const source of directSources(id,ed)){const missing=requirements(source,lib,ed);out.push({type:'direct',source,ready:!missing.length,status:source.historicalEvent?'event':missing.some(x=>x.includes('andere Wahl'))?'external':!missing.length?'now':'later',missing,text:methodNames[source.method]||source.method,area:areaOf(source.map),rank:missing.some(x=>x.includes('andere Wahl'))?8:source.historicalEvent?9:missing.length?3+Math.min(mapStage(source.map),17)/100:0});}
 for(const e of data.species[id]?.evolutions||[]){const external=['friendship_day','friendship_night','beauty'].includes(e.method),parent=owned.has(e.from),parentOptions=parent?[]:options(e.from,lib,ed,seen),best=parentOptions.sort((a,b)=>a.rank-b.rank)[0],native=parent||best&&best.status!=='external'&&best.status!=='event';
  const missing=[];if(id>151&&!flags(lib,ed).has('national'))missing.push('Nationaldex');if(!parent)missing.push(nameOf(e.from)+' zuerst erhalten');if(e.method.startsWith('trade'))missing.push('Tauschpartner');
  const ready=parent&&!missing.length&&!external;out.push({type:'evolution',from:e.from,ready,status:external||!native?'external':ready?'now':'later',missing,text:evoText(e),item:e.param.startsWith('ITEM_')?e.param:null,rank:external||!native?8:ready?0.3:2.5,prerequisite:best});
 }
 const potential=breedingParents(id),parents=potential.filter(p=>owned.has(p)),candidate=parents[0]||potential.find(p=>p!==id&&directSources(p,ed).some(s=>!s.historicalEvent));if(candidate){const ready=parents.length>0&&flags(lib,ed).has('rainbow');out.push({type:'breed',ready,status:ready?'now':'later',missing:ready?[]:[...(!flags(lib,ed).has('rainbow')?['Bunt-Pass · Pension Eiland Vier']:[]),...(!parents.length?[nameOf(candidate)+' zuerst erhalten']:[])],text:nameOf(candidate)+' in der Pension auf Eiland Vier mit geeignetem Partner (ggf. Ditto) züchten'+(id===298?' · Seerauch tragen':id===360?' · Laxrauch tragen':''),rank:ready?0.2:2.6});}
 if(!out.length||out.every(x=>x.status==='external'||x.status==='event')){const other=ed==='firered'?'leafgreen':'firered',otherSources=directSources(id,other).filter(x=>!x.historicalEvent);out.push({type:'external',ready:false,status:'external',missing:[],text:otherSources.length?'Aus '+(other==='firered'?'Feuerrot':'Blattgrün')+' tauschen · dort z. B. '+(areaOf(otherSources[0].map)?.name||'erhältlich'):'Aus einem kompatiblen Spiel der 3. Generation tauschen'+([151,251,385].includes(id)?' · historisches Event-Pokémon':''),rank:out.some(x=>x.status==='event')?9.5:8.5});}
 return out.sort((a,b)=>a.rank-b.rank);
}
export function missingPlan(lib,ed,max=151){const owned=new Set(caughtIn(lib,'frlg'));return speciesIndex.filter(s=>s.id<=max&&!owned.has(s.id)).map(s=>({...s,options:options(s.id,lib,ed)}));}
export function routeMons(lib,ed,area){const owned=new Set(caughtIn(lib,'frlg')),groups=new Map();for(const s of [...data.encounters,...data.specials].filter(x=>x.edition===ed&&areaOf(x.map)?.id===area)){
 let g=groups.get(s.species);if(!g){g={id:s.species,owned:owned.has(s.species),sources:[],ready:false};groups.set(s.species,g);}const missing=requirements(s,lib,ed);g.sources.push({...s,missing});g.ready||=!missing.length;
 }return [...groups.values()].sort((a,b)=>a.id-b.id);}
export function routeItems(lib,ed,area){return data.items.filter(x=>x.edition===ed&&areaOf(x.map)?.id===area).map(x=>({...x,taken:lib.records[`item.${ed}.${x.id}`]?.value===true}));}
export function suggestStage(ids,ed){
 function earliestNative(id,seen=new Set()){if(seen.has(id))return 99;seen=new Set(seen).add(id);const direct=directSources(id,ed).filter(s=>!s.historicalEvent&&s.method!=='roamer'&&s.method!=='trade').map(s=>mapStage(s.map));const evolved=(data.species[id]?.evolutions||[]).filter(e=>!['friendship_day','friendship_night','beauty'].includes(e.method)).map(e=>Math.max(id>151?13:0,earliestNative(e.from,seen)));return Math.min(99,...direct,...evolved);}
 const clues=[];for(const id of ids){const earliest=earliestNative(id);if(earliest>0&&earliest<99)clues.push({id,stage:earliest});}
 clues.sort((a,b)=>b.stage-a.stage);return {stage:clues[0]?.stage||0,clues:clues.slice(0,3),warning:'Fänge können getauscht oder aus der anderen Edition stammen. Der Vorschlag schaltet nichts frei.'};
}
export function applyOwned(lib,ed,ids,max){const selected=new Set(ids);for(let id=1;id<=max;id++){const current=lib.records[`caught.frlg.${id}`]?.value?.caught===true;if(current!==selected.has(id))markCaught(lib,ed,id,selected.has(id));}}
export function setStage(lib,ed,value){if(Number.isInteger(value)&&value>=0&&value<=17)writeRecord(lib,`setting.${ed}.frlgStage`,value);}
