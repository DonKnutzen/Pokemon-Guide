import {locationPokemon,availability,unlockedFlags} from './collection-model.js?v=3';

// A caught species disappears everywhere. Its evolutions remain independent.
export function routeCatches(data,state,locationId){
  const co=state.collection[state.edition],flags=unlockedFlags(data,state);
  const result={now:[],later:[],caught:[]};
  for(const row of locationPokemon(data,state.edition,locationId)){
    if(co.caught.includes(row.id)){result.caught.push(row);continue;}
    if(row.entries.every(e=>e.method==='starter'&&e.species!==co.starter))continue;
    const statuses=row.entries.map(e=>({entry:e,...availability(e,flags,co)}))
      .sort((a,b)=>a.missing.length-b.missing.length||a.entry.stage-b.entry.stage);
    const available=statuses.filter(s=>s.available);
    const enriched={...row,statuses,available,best:available[0]?.entry||statuses[0].entry};
    result[available.length?'now':'later'].push(enriched);
  }
  return result;
}

export function setCaught(state,speciesId,caught,locationId){
  if(!Number.isInteger(speciesId)||speciesId<1||speciesId>251)return state;
  const co=state.collection[state.edition];
  co.catchLocations||={};
  co.caught=co.caught.filter(id=>id!==speciesId);
  if(caught){co.caught.push(speciesId);if(locationId)co.catchLocations[speciesId]=locationId;}
  else delete co.catchLocations[speciesId];
  return state;
}

export function acquisition(data,edition,id){
  const own=data.encounters.filter(e=>e.edition===edition&&e.species===id);
  const other=data.encounters.filter(e=>e.edition!==edition&&e.species===id);
  const sp=data.species[id];
  if(own.some(e=>e.method!=='starter'))return {kind:'local',label:'In '+(edition==='gold'?'Gold':'Silber')+' erhältlich',entries:own};
  if(own.some(e=>e.method==='starter'))return {kind:'starter',label:'Starterwahl / Tausch',entries:own};
  if(sp.breedFrom)return {kind:'breed',label:'Durch Zucht',entries:own};
  if(sp.evolutions.length)return {kind:'evolution',label:'Durch Entwicklung',entries:own};
  if(other.length)return {kind:'trade',label:'Tausch aus '+(edition==='gold'?'Silber':'Gold'),entries:own};
  return {kind:'external',label:sp.external?.startsWith('Event')?'Event / Tausch':'Tausch aus Rot, Blau oder Gelb',entries:own};
}

export function routeItemGroups(data,state,locationId){
  const co=state.collection[state.edition],flags=unlockedFlags(data,state);
  const groups={now:[],later:[],done:[],shops:[]};
  for(const item of data.items.filter(i=>i.edition===state.edition&&i.location===locationId)){
    if(item.kind==='shop'){groups.shops.push(item);continue;}
    groups[co.items.includes(item.id)?'done':availability(item,flags,co).available?'now':'later'].push(item);
  }
  return groups;
}
