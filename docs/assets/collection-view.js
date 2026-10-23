import {collectionData as data} from '../data/collection-data.js';
import {methodNames,timeNames,kindNames,dayNames,unlockedFlags,availability,locationPokemon,returnTargets,evolutionText} from './collection-model.js';
const el=(tag,cls='',text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const anchor=(href,text,cls='')=>{const e=el('a',cls,text);e.href=href;return e;};
const norm=t=>String(t).toLocaleLowerCase('de').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/ß/g,'ss');
const name=id=>data.species[id].name;
const flagName=id=>data.flags.find(f=>f.id===id)?.label||id;
const location=id=>data.locations.find(l=>l.id===id);
const mapName=id=>data.maps[id]?.label||id;
const locationLink=id=>'#collect/'+id;
const matches=(text,q)=>norm(q).split(/\s+/).every(t=>norm(text).includes(t));
const badge=(text,cls='')=>el('span','collect-chip '+cls,text);
function info(text){return el('p','collect-intro',text);}
function checkbox(id,label,checked,onchange){const row=el('label','collect-check');const input=el('input');input.type='checkbox';input.id=id;input.checked=checked;row.append(input,el('span','',label));input.addEventListener('change',()=>onchange(input.checked));return row;}
function sourceDetails(){const d=el('details','source-note');d.id='collection-sources';d.append(el('summary','','Quellen, Vergleichsregel und Umfang'));for(const n of data.notes)d.append(el('p','',n));d.append(anchor(data.sourceUrl,'Fang- und Funddaten: Original-Gold-/Silber-Spieldaten (pret/pokegold)'));d.append(info('Deutsche Pokémon-Namen: PokéAPI. Die Inhaltsregeln gelten für die Originalspiele Gold und Silber, nicht für Kristall oder die Remakes.'));return d;}
function requirementText(entry){const parts=[];if(entry.requirements.length)parts.push(...entry.requirements.map(flagName));if(entry.weekdays)parts.push(entry.weekdays.map(n=>dayNames[n]).join(' / '));if(entry.time&&entry.time!=='all')parts.push(timeNames[entry.time]);return parts.join(' · ');}
function section(title,subtitle){const wrap=el('section','collect-section');wrap.append(el('h2','',title));if(subtitle)wrap.append(info(subtitle));return wrap;}

export function renderCollectionSummary(state){
 const co=state.collection[state.edition],box=el('div','collection-summary');
 box.append(anchor(locationLink(co.lastLocation),'Pokémon & Items auf deiner Reise →','collection-summary-title'));
 box.append(el('span','',co.caught.length+'/251 im Pokédex · '+data.items.filter(i=>i.edition===state.edition&&i.kind!=='shop'&&co.items.includes(i.id)).length+' Fundorte erledigt'));
 return box;
}
const chapterAreas={
 neuborkia:['new_bark_town','route_29'], 'mr-pokemon':['route_46','cherrygrove_city','route_30','route_31'],viola:['dark_cave','violet_city','sprout_tower','ruins_of_alph'],einheitstunnel:['route_32','union_cave','route_33'],azalea:['azalea_town','slowpoke_well'],steineichenwald:['ilex_forest','route_34'],dukatia:['goldenrod_city','radio_tower'],mogelbaum:['route_35','national_park','route_36','route_37'],teak:['ecruteak_city','burned_tower','tin_tower'],leuchtturm:['route_38','route_39','olivine_city','lighthouse'],anemonia:['route_40','route_41','cianwood_city'],jasmin:['olivine_city','route_42','mt_mortar'],'see-des-zorns':['mahogany_town','route_43','lake_of_rage'],'rocket-versteck':['mahogany_town'],radioturm:['radio_tower','goldenrod_city'],eispfad:['route_44','ice_path'],ebenholz:['blackthorn_city','dragons_den','route_45'],siegerstrasse:['route_27','tohjo_falls','route_26','victory_road','route_23'],'top-vier':['indigo_plateau'],'ms-aqua':['fast_ship','vermilion_city'],orania:['vermilion_city','route_6'],saffronia:['saffron_city','route_8','lavender_town'],kraftwerk:['rock_tunnel','route_10','power_plant','route_9','cerulean_city','route_24','route_25'],azuria:['route_25','cerulean_city'],'radiomodul-kanto':['lav_radio_tower','saffron_city'],prismania:['route_7','celadon_city'],fuchsania:['route_16','route_17','route_18','fuchsia_city','route_15','route_14','route_13','route_12'],'relaxo-marmoria':['route_11','digletts_cave','route_2','pewter_city'],zinnober:['viridian_city','route_1','pallet_town','route_21','cinnabar_island','route_20','seafoam_islands','route_19'],vertania:['viridian_city'],silberberg:['route_22','route_28','silver_cave'],'alph-ruinen':['ruins_of_alph'],legendaere:['tin_tower','whirl_islands'],abstecher:['union_cave','national_park','route_3','mt_moon','route_4']
};
export function chapterCollectionLinks(id){const areas=chapterAreas[id]||[],d=el('details','chapter-collection-links');d.append(el('summary','','Pokémon & Items in diesem Abschnitt ('+areas.length+' Gebiete)'));const links=el('div','area-links');for(const id of areas)if(location(id))links.append(anchor(locationLink(id),location(id).name));d.append(links);return d;}

export function renderCollection(root,route,state,commit,query=''){
 const edition=state.edition,co=state.collection[edition],flags=unlockedFlags(data,state);let checkSequence=0;
 const save=(change,focus)=>{
   const open=[...root.querySelectorAll('details[open][id]')].map(d=>d.id),scrollY=window.scrollY;
   change(co);commit();
   for(const id of open){const d=document.getElementById(id);if(d)d.open=true;}
   if(focus)document.getElementById(focus)?.focus({preventScroll:true});
   window.scrollTo({top:scrollY,behavior:'instant'});
 };
 const head=el('header','collection-header');head.append(el('div','eyebrow','DEIN SAMMELBEGLEITER · '+(edition==='gold'?'GOLD':'SILBER')),el('h1','',({collect:'Auf jeder Route alles im Blick.',dex:'Dein Pokédex.',items:'Dein Item-Guide.',returns:'Zeit für einen kleinen Umweg.'})[route.page]));
 head.append(info('Story spielen, neue Arten erkennen und offene Funde zur passenden Zeit nachholen. Dein Story-Fortschritt bleibt erhalten.'));root.append(head);
 const inventory=el('details','inventory-panel');inventory.id='collection-inventory';inventory.append(el('summary','','Spielstand & Ausrüstung bestätigen · '+flags.size+' Freischaltungen'));
 inventory.append(info('Hier bestätigen, was du im Spiel bereits erhalten hast. Passende Story-Häkchen und abgehakte Angel-Funde werden ebenfalls berücksichtigt. Ein Gebietsbesuch schaltet keine VM frei.'));
 const grid=el('div','inventory-grid');
 const inferred=unlockedFlags(data,{...state,collection:{...state.collection,[edition]:{...co,unlocks:[]}}});
 for(const f of data.flags){const id='unlock-'+f.id,row=checkbox(id,f.label+(inferred.has(f.id)?' · aus Story/Fundliste':''),flags.has(f.id),checked=>save(c=>{c.unlocks=checked?[...new Set([...c.unlocks,f.id])]:c.unlocks.filter(x=>x!==f.id);},id));row.querySelector('input').disabled=inferred.has(f.id);grid.append(row);}
 inventory.append(grid);
 const starterLabel=el('label','filter-label','Dein gewählter Starter');const starter=el('select');starter.id='starter-choice';for(const [id,label] of [[0,'Noch nicht ausgewählt'],[152,'Endivie'],[155,'Feurigel'],[158,'Karnimani']]){const op=el('option','',label);op.value=id;starter.append(op);}starter.value=co.starter;starterLabel.append(starter);starter.addEventListener('change',()=>save(c=>{c.starter=Number(starter.value);},'starter-choice'));inventory.append(starterLabel);root.append(inventory);
 const filters=el('div','collection-filters');
 function filter(label,id,options,value,update){const l=el('label','filter-label',label),s=el('select');s.id=id;for(const [v,t]of options){const o=el('option','',t);o.value=v;s.append(o);}s.value=String(value);s.addEventListener('change',()=>save(c=>update(c,s.value),id));l.append(s);filters.append(l);}
 filter('Spiel-Tageszeit','game-time',Object.entries(timeNames).filter(([k])=>k!=='mornday'),co.time,(c,v)=>c.time=v);
 filter('Spiel-Wochentag','game-day',[['all','Alle Wochentage'],...dayNames.map((s,i)=>[i,s])],co.weekday,(c,v)=>c.weekday=v==='all'?'all':Number(v));
 const counts=el('span','collection-counts',co.caught.length+'/251 Pokémon · '+co.visited.length+(co.visited.length===1?' Gebiet besucht':' Gebiete besucht'));filters.append(counts);root.append(filters);

 function caughtRow(id){const key='caught-'+id+'-'+(checkSequence++);return checkbox(key,'Gefangen / erhalten',co.caught.includes(id),yes=>save(c=>{c.caught=yes?[...new Set([...c.caught,id])]:c.caught.filter(n=>n!==id);},key));}
 function encounterLines(entries){
   const list=el('ul','encounter-lines'),seen=new Set();
   for(const e of entries){const status=availability(e,flags,co);const levels=e.levels.length?' · Level '+(e.levels.length===1?e.levels[0]:Math.min(...e.levels)+'–'+Math.max(...e.levels)):'';
     let text=methodNames[e.method]+' · '+timeNames[e.time]+levels+(e.chance?' · ca. '+Math.min(100,e.chance)+' %':'');
     text+=' · '+mapName(e.map);
     if(seen.has(text))continue;seen.add(text);
     const li=el('li',status.available?'encounter-available':'encounter-later');li.append(el('span','',text));
     if(!status.available){const missing=[...status.missing.map(flagName)];if(!status.clock)missing.push(timeNames[e.time]);if(!status.weekday)missing.push(e.weekdays.map(i=>dayNames[i]).join('/'));if(!status.starter)missing.push('Andere Starterwahl / Tausch nötig');li.append(el('small','','Voraussetzung: '+missing.join(' · ')));}
     if(e.weekdays)li.append(el('small','',e.weekdays.map(n=>dayNames[n]).join(' / ')));
     if(e.note)li.append(el('small','',e.note));list.append(li);
   }return list;
 }
 function pokemonCard(row,compact=false){
   const sp=data.species[row.id],card=el('article','pokemon-card'+(co.caught.includes(row.id)?' collected':'')),title=el('div','collect-card-title');
   title.append(el('span','dex-number','#'+String(row.id).padStart(3,'0')),el('h3','',sp.name));
   if(row.newWild)title.append(badge('Erstmals wild','new'));card.append(title);
   const now=row.entries.some(e=>availability(e,flags,co).available);
   card.append(badge(now?'Mit deinem Stand erreichbar':'Voraussetzungen fehlen',now?'ready':'later'));
   if(compact){const details=el('details','encounter-details');details.id='encounters-'+row.id;details.append(el('summary','','Fangorte & Bedingungen ('+row.entries.length+')'),encounterLines(row.entries));card.append(details);}else card.append(encounterLines(row.entries));
   card.append(caughtRow(row.id));return card;
 }
 function itemCard(item){
   const card=el('article','item-card'+(co.items.includes(item.id)?' collected':'')),title=el('div','collect-card-title');
   title.append(el('h3','',item.name),badge(kindNames[item.kind]));card.append(title);
   card.append(el('p','item-place',mapName(item.map)));
   if(item.x!==undefined){const m=data.maps[item.map];const horiz=item.x<m.size[0]/3?'Westen':item.x>m.size[0]*2/3?'Osten':'Mitte',vert=item.y<m.size[1]/3?'Norden':item.y>m.size[1]*2/3?'Süden':'Mitte';card.append(el('p','item-coordinates',vert+' / '+horiz+' · Raster X '+item.x+', Y '+item.y));}
   if(item.note)card.append(el('p','item-note',item.note));
   const status=availability(item,flags,co);const req=requirementText(item);if(req)card.append(el('p','item-requirements','Voraussetzungen: '+req));
   card.append(badge(status.available?(status.special?'Anlass / Erfolg nötig':'Mit deinem Stand erreichbar'):'Später / andere Zeit',status.available?'ready':'later'));
   const id='item-'+item.id;card.append(checkbox(id,item.kind==='shop'?'Einmal beschafft':'Erhalten / eingesammelt',co.items.includes(item.id),yes=>save(c=>{c.items=yes?[...new Set([...c.items,item.id])]:c.items.filter(x=>x!==item.id);},id)));return card;
 }
 function itemList(parent,list,empty='Hier sind keine passenden Einträge.'){const wrap=el('div','item-grid');for(const item of list)wrap.append(itemCard(item));if(!list.length)wrap.append(info(empty));parent.append(wrap);}

 if(route.page==='collect'){
   const place=location(route.id)||location(co.lastLocation)||data.locations[1];
   const locLabel=el('label','location-select-label','Dein Gebiet'),select=el('select');select.id='collect-location';
   for(const loc of data.locations){const o=el('option','',loc.name);o.value=loc.id;select.append(o);}select.value=place.id;
   select.addEventListener('change',()=>{window.location.hash='collect/'+select.value;});locLabel.append(select);root.append(locLabel);
   const bar=el('div','location-title');bar.append(el('h2','',place.name));const visitedId='visited-'+place.id;bar.append(checkbox(visitedId,'Dieses Gebiet besucht',co.visited.includes(place.id),yes=>save(c=>{c.visited=yes?[...new Set([...c.visited,place.id])]:c.visited.filter(x=>x!==place.id);},visitedId)));root.append(bar);
   root.append(info('„Erstmals wild“ vergleicht mit früher erreichbaren Fangorten der empfohlenen Route. „Gefangen / erhalten“ ist deine eigene Sammlung. Erst freigeschaltete Angel-, Wasser- und Baumfänge werden als erreichbar angezeigt.'));
   let mons=locationPokemon(data,edition,place.id);if(query)mons=mons.filter(p=>matches(name(p.id)+' '+p.entries.map(e=>methodNames[e.method]).join(' '),query));
   const newMons=mons.filter(p=>p.newWild),newSection=section('Hier erstmals wild fangbar',newMons.length+' Arten · Tageszeiten und Fangmethoden beachten.');
   const newGrid=el('div','pokemon-grid');for(const row of newMons)newGrid.append(pokemonCard(row));if(!newMons.length)newGrid.append(info('Keine erstmaligen Wildarten nach dem Reiseplan. Prüfe unten die übrigen Fangmöglichkeiten, Geschenke und Tausche.'));newSection.append(newGrid);root.append(newSection);
   const other=el('details','other-encounters');other.id='collection-all-encounters';other.append(el('summary','','Alle Fangmöglichkeiten, Geschenke & Tausche ('+mons.length+' Arten)'));const allGrid=el('div','pokemon-grid');for(const row of mons)allGrid.append(pokemonCard(row,true));other.append(allGrid);root.append(other);
   const areaItems=data.items.filter(i=>i.edition===edition&&i.location===place.id&&(!query||matches(i.name+' '+i.note+' '+mapName(i.map),query)));
   const fixed=areaItems.filter(i=>i.kind!=='shop'),now=fixed.filter(i=>availability(i,flags,co).available),later=fixed.filter(i=>!availability(i,flags,co).available);
   const loot=section('Items jetzt einplanen',now.length+' Fundorte / Belohnungen passen zu deinem bestätigten Stand. Zusätzliche Bedingungen stehen jeweils dabei.');itemList(loot,now);root.append(loot);
   if(later.length){const future=el('details','future-items');future.id='collection-future-items';future.append(el('summary','','Für später vormerken ('+later.length+' Fundorte / Belohnungen)'));itemList(future,later);root.append(future);}
   const shops=areaItems.filter(i=>i.kind==='shop');if(shops.length){const d=el('details','future-items');d.id='collection-shops';d.append(el('summary','','Läden & wiederholbare Käufe ('+shops.length+')'));itemList(d,shops);root.append(d);}
   const plan=el('details','position-plan');plan.id='collection-position-plan';plan.append(el('summary','','Fundpositionen ansehen (Rasterplan)'));plan.append(info('Norden oben. Die Punkte zeigen die Fund- bzw. Personenpositionen auf dem Gebietsraster. Wege, Wasser und Hindernisse werden nicht abgebildet. X zählt von links, Y von oben; beide beginnen bei 0.'));
   const mapSelect=el('select');mapSelect.setAttribute('aria-label','Teilgebiet für den Fundplan');const mapIds=[...new Set(fixed.filter(i=>i.x!==undefined).map(i=>i.map))];
   for(const id of mapIds){const o=el('option','',mapName(id));o.value=id;mapSelect.append(o);}const drawing=el('div','position-drawing');plan.append(mapSelect,drawing);
   function draw(){drawing.replaceChildren();const id=mapSelect.value;if(!id){drawing.append(info('Keine Koordinaten für dieses Gebiet erfasst.'));return;}const meta=data.maps[id],records=fixed.filter(i=>i.map===id&&i.x!==undefined),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-3 -3 '+(meta.size[0]+6)+' '+(meta.size[1]+6));svg.setAttribute('role','img');svg.setAttribute('aria-label','Fundpositionen in '+mapName(id));const rect=document.createElementNS(ns,'rect');for(const [k,v]of Object.entries({x:0,y:0,width:meta.size[0],height:meta.size[1],fill:'#edf0e4',stroke:'#becbb4','stroke-width':.25}))rect.setAttribute(k,v);svg.append(rect);
     for(let x=0;x<meta.size[0];x+=5){const line=document.createElementNS(ns,'path');line.setAttribute('d','M'+x+' 0 V'+meta.size[1]);line.setAttribute('stroke','#d6dfca');line.setAttribute('stroke-width','.15');svg.append(line);}for(let y=0;y<meta.size[1];y+=5){const line=document.createElementNS(ns,'path');line.setAttribute('d','M0 '+y+' H'+meta.size[0]);line.setAttribute('stroke','#d6dfca');line.setAttribute('stroke-width','.15');svg.append(line);}
     const legend=el('ol','position-legend');records.forEach((item,index)=>{const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',item.x);circle.setAttribute('cy',item.y);circle.setAttribute('r',Math.max(.7,Math.min(...meta.size)/35));circle.setAttribute('fill',item.kind==='hidden'?'#ba9140':'#315b45');const title=document.createElementNS(ns,'title');title.textContent=(index+1)+'. '+item.name+' – X '+item.x+', Y '+item.y;circle.append(title);const text=document.createElementNS(ns,'text');text.setAttribute('x',item.x);text.setAttribute('y',item.y+.5);text.setAttribute('font-size',Math.max(1,Math.min(...meta.size)/25));text.setAttribute('text-anchor','middle');text.setAttribute('fill','white');text.textContent=index+1;svg.append(circle,text);legend.append(el('li','',item.name+' · X '+item.x+', Y '+item.y+(item.kind==='hidden'?' · versteckt':'')));});drawing.append(svg,legend);}
   mapSelect.addEventListener('change',draw);draw();root.append(plan);
   const index=data.locations.indexOf(place),nav=el('nav','chapter-bottom');nav.append(anchor(locationLink(data.locations[Math.max(0,index-1)].id),'← Vorheriges Gebiet'));if(data.locations[index+1])nav.append(anchor(locationLink(data.locations[index+1].id),data.locations[index+1].name+' →','next-link'));root.append(nav);
 }else if(route.page==='dex'){
   root.append(info('Alle 251 Arten zum Abhaken. Entwicklungen, Zucht und Tausch gehören zur Vervollständigung dazu; ein einzelner Spielstand allein liefert nicht jede Art.'));
   const list=el('div','dex-list');
   for(const sp of Object.values(data.species).filter(s=>!query||matches(s.name+' '+s.symbol+' '+s.id,query))){
     const card=el('article','dex-card'+(co.caught.includes(sp.id)?' collected':'')),title=el('div','collect-card-title');title.append(el('span','dex-number','#'+String(sp.id).padStart(3,'0')),el('h2','',sp.name));card.append(title,caughtRow(sp.id));
     const own=data.encounters.filter(e=>e.edition===edition&&e.species===sp.id).sort((a,b)=>a.stage-b.stage),otherEdition=data.encounters.some(e=>e.edition!==edition&&e.species===sp.id);
     if(sp.external)card.append(info(sp.external));
     const sources=el('details','encounter-details');sources.id='dex-sources-'+sp.id;sources.append(el('summary','','So bekommst du '+sp.name));
     const unique=new Map();for(const entry of own){const k=entry.location+'|'+entry.method;if(!unique.has(k))unique.set(k,entry);}
     for(const e of unique.values()){const p=el('p','dex-source');p.append(anchor(locationLink(e.location),location(e.location).name),document.createTextNode(' · '+methodNames[e.method]));if(e.note)p.append(el('small','',e.note));sources.append(p);}
     for(const evo of sp.evolutions)sources.append(info(evolutionText(evo,data)));
     if(sp.breedFrom)sources.append(info('Zucht in der Pension mit '+sp.breedFrom.map(name).join(' / ')+' und einem passenden Partner (z. B. Ditto). Ei ausbrüten.'));
     if(!own.length&&otherEdition)sources.append(info('Direkte Fang-/Geschenkquelle in der anderen Edition: per Tausch beschaffen oder über die hier aufgeführte Entwicklung erhalten.'));
     if(!own.length&&!sp.evolutions.length&&!sp.breedFrom&&!sp.external)sources.append(info('Kein direkter Fangort in dieser Edition erfasst. Prüfe Tausch mit der anderen Edition bzw. Rot, Blau oder Gelb.'));
     card.append(sources);list.append(card);
   }root.append(list);
 }else if(route.page==='items'){
   root.append(info('Jeder Fundort bleibt einzeln abhakbar. Läden werden separat aufgeführt; ein Kauf zählt nicht als eingesammelter Bodenfund. Versteckte Funde und Gespräche findest du jeweils im verlinkten Gebiet.'));
   const groups=new Map();for(const item of data.items.filter(i=>i.edition===edition&&(!query||matches(i.name+' '+location(i.location).name+' '+i.note,query)))){if(!groups.has(item.item))groups.set(item.item,[]);groups.get(item.item).push(item);}
   const list=el('div','item-index');for(const entries of [...groups.values()].sort((a,b)=>a[0].name.localeCompare(b[0].name,'de'))){const d=el('details','item-index-entry');d.append(el('summary','',entries[0].name+' · '+entries.filter(e=>co.items.includes(e.id)).length+'/'+entries.length+' Bezugsorte'));const seen=new Set();for(const item of entries.sort((a,b)=>a.stage-b.stage)){const key=item.location+'|'+item.kind;if(seen.has(key))continue;seen.add(key);const p=el('p','');p.append(anchor(locationLink(item.location),location(item.location).name),document.createTextNode(' · '+kindNames[item.kind]+' · '+(requirementText(item)||'ohne zusätzliche VM-Voraussetzung')));d.append(p);}list.append(d);}root.append(list);
   const held=el('details','held-items');held.append(el('summary','','Getragene Items wilder Pokémon ('+data.held.length+' Art-/Item-Kombinationen)'));held.append(info('Diese Items kannst du bei passenden Wildbegegnungen durch Fangen oder Raub erhalten. Sie sind Zufallsfunde, keine einmaligen Bodenfunde.'));
   for(const item of data.held.filter(i=>!query||matches(i.name+' '+name(i.species),query))){const p=el('p','');p.append(document.createTextNode(item.name+' · '+name(item.species)+' · '+item.rarity+' · '),anchor('#dex','Fangorte im Pokédex'));held.append(p);}root.append(held);
 }else if(route.page==='returns'){
   root.append(info('Hier erscheinen noch offene Ziele in von dir als besucht markierten Gebieten, deren Zugang später im Reiseplan freigeschaltet wird. Bestätige oben deine Ausrüstung und wähle bei Bedarf die Spielzeit.'));
   const targets=returnTargets(data,state).filter(t=>!query||matches(t.location.name+' '+t.items.map(i=>i.name).join(' ')+' '+t.pokemon.map(p=>name(p.id)).join(' '),query));
   if(!targets.length)root.append(el('p','no-results','Momentan keine passenden Rückkehrziele. Markiere besuchte Gebiete und bestätige neue VMs, Angeln oder Story-Fortschritte.'));
   for(const t of targets){const card=el('article','return-card');card.append(anchor(locationLink(t.location.id),t.location.name+' →','return-title'));if(t.pokemon.length)card.append(info('Noch fehlend: '+t.pokemon.map(p=>name(p.id)).join(', ')));if(t.items.length)card.append(info('Offene Funde: '+[...new Set(t.items.map(i=>i.name))].join(', ')));root.append(card);}
 }
 root.append(sourceDetails());
}
