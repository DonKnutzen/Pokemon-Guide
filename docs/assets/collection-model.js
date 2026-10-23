const methodFlags = {surf:'surf',oldrod:'oldrod',goodrod:'goodrod',superrod:'superrod',headbutt:'headbutt',smash:'smash'};
export const methodNames = {grass:'Gras / Höhle',surf:'Surfer',oldrod:'Angel',goodrod:'Profiangel',superrod:'Superangel',headbutt:'Kopfnuss',smash:'Zertrümmerer',contest:'Käferturnier',swarm:'Schwarm',static:'Feste Begegnung',starter:'Starterwahl',gift:'Geschenk',egg:'Ei ausbrüten',prize:'Spielhallenpreis','npc-trade':'Tausch im Spiel',roaming:'Wanderndes Pokémon'};
export const timeNames = {all:'Jede Tageszeit',morn:'Morgens (04–10 Uhr)',day:'Tagsüber (10–18 Uhr)',nite:'Nachts (18–04 Uhr)',mornday:'Morgens / tagsüber'};
export const kindNames = {ground:'Sichtbarer Fund',hidden:'Versteckt',person:'Gespräch / Belohnung',tree:'Beeren / Aprikokos',shop:'Kauf / Münzpreis'};
export const dayNames = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

export function emptyCollection(){return {caught:[],items:[],visited:[],unlocks:[],lastLocation:'route_29',starter:0,time:'all',weekday:'all'};}
export function restoreCollections(value,data){
  const output={};
  for(const edition of ['gold','silver']){
    const clean=emptyCollection(), input=value?.[edition];
    if(input && typeof input==='object'){
      const itemIds=new Set(data.items.filter(x=>x.edition===edition).map(x=>x.id));
      const locationIds=new Set(data.locations.map(x=>x.id));
      const flagIds=new Set(data.flags.map(x=>x.id));
      clean.caught=[...new Set((Array.isArray(input.caught)?input.caught:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=251))];
      for(const [key,valid] of [['items',itemIds],['visited',locationIds],['unlocks',flagIds]])clean[key]=[...new Set((Array.isArray(input[key])?input[key]:[]).filter(x=>valid.has(x)))];
      if(locationIds.has(input.lastLocation))clean.lastLocation=input.lastLocation;
      if([152,155,158].includes(input.starter))clean.starter=input.starter;
      if(['all','morn','day','nite'].includes(input.time))clean.time=input.time;
      if(input.weekday==='all'||Number.isInteger(input.weekday)&&input.weekday>=0&&input.weekday<=6)clean.weekday=input.weekday;
    }
    output[edition]=clean;
  }
  return output;
}
export function mergeCollections(current,incoming,data){
  const a=restoreCollections(current,data),b=restoreCollections(incoming,data);
  for(const ed of ['gold','silver'])for(const key of ['caught','items','visited','unlocks'])a[ed][key]=[...new Set([...a[ed][key],...b[ed][key]])];
  for(const ed of ['gold','silver'])if(!a[ed].starter)a[ed].starter=b[ed].starter;
  return a;
}
export function unlockedFlags(data,state){
  const co=state.collection[state.edition], done=new Set(state.completed[state.edition]), active=new Set(co.unlocks);
  for(const flag of data.flags){const steps=flag.stepsByEdition?.[state.edition]||flag.steps;if(steps.length && steps.every(id=>done.has(id)))active.add(flag.id);}
  const got=new Set(data.items.filter(x=>x.edition===state.edition&&co.items.includes(x.id)).map(x=>x.item));
  for(const [item,flag] of Object.entries({POKE_BALL:'balls',OLD_ROD:'oldrod',GOOD_ROD:'goodrod',SUPER_ROD:'superrod',TM_HEADBUTT:'headbutt',TM_ROCK_SMASH:'smash',SQUIRTBOTTLE:'bottle',BICYCLE:'bike',SECRETPOTION:'medicine',MACHINE_PART:'part',LOST_ITEM:'doll',RAINBOW_WING:'goldWing',SILVER_WING:'silverWing'}))if(got.has(item))active.add(flag);
  return active;
}
export function availability(entry,flags,co){
  const missing=entry.requirements.filter(flag=>!flags.has(flag));
  const clock=co.time==='all'||!entry.time||entry.time==='all'||entry.time===co.time||entry.time==='mornday'&&['morn','day'].includes(co.time);
  const weekday=co.weekday==='all'||!entry.weekdays||entry.weekdays.includes(co.weekday);
  const special=!!entry.special || entry.method==='roaming';
  const starter=entry.method!=='starter'||entry.species===co.starter;
  return {available:!missing.length&&clock&&weekday&&starter,missing,clock,weekday,special,starter};
}
export function firstWildStages(data,edition){
  const result=new Map();
  for(const e of data.encounters){
    if(e.edition!==edition||['starter','gift','egg','prize','npc-trade','roaming'].includes(e.method))continue;
    result.set(e.species,Math.min(result.get(e.species)??Infinity,e.stage));
  }
  return result;
}
export function locationPokemon(data,edition,locationId){
  const grouped=new Map(),first=firstWildStages(data,edition);
  const visitStage=data.locations.find(l=>l.id===locationId)?.order??0;
  for(const e of data.encounters.filter(e=>e.edition===edition&&e.location===locationId)){
    if(!grouped.has(e.species))grouped.set(e.species,{id:e.species,entries:[],newWild:false});
    const row=grouped.get(e.species);row.entries.push(e);
    if(!['starter','gift','egg','prize','npc-trade','roaming'].includes(e.method)&&e.stage===first.get(e.species)&&e.stage<=visitStage)row.newWild=true;
  }
  return [...grouped.values()].sort((a,b)=>Number(b.newWild)-Number(a.newWild)||a.id-b.id);
}
export function returnTargets(data,state){
  const co=state.collection[state.edition],flags=unlockedFlags(data,state),targets=[];
  for(const location of data.locations.filter(l=>co.visited.includes(l.id))){
    const items=data.items.filter(e=>e.edition===state.edition&&e.location===location.id&&e.kind!=='shop'&&!co.items.includes(e.id)&&e.stage>location.order&&availability(e,flags,co).available);
    const pokemon=locationPokemon(data,state.edition,location.id).filter(p=>!co.caught.includes(p.id)&&p.entries.some(e=>e.stage>location.order&&availability(e,flags,co).available));
    if(items.length||pokemon.length)targets.push({location,items,pokemon});
  }
  return targets;
}
export function evolutionText(e,data){
  const name=data.species[e.from].name,c=e.condition;
  if(e.method==='level')return name+' ab Level '+c[0]+' entwickeln';
  if(e.method==='item')return name+' mit '+(e.itemName||c[0].replaceAll('_',' ').toLowerCase())+' entwickeln';
  if(e.method==='trade')return name+' tauschen'+(c[0]==='-1'?'':' und dabei '+(e.itemName||c[0].replaceAll('_',' ').toLowerCase())+' tragen lassen');
  if(e.method==='happiness')return name+' mit hoher Freundschaft entwickeln'+(c[0]==='TR_NITE'?' (nachts)':c[0]==='TR_MORNDAY'?' (morgens/tagsüber)':'');
  if(e.method==='stat')return name+' ab Level '+c[0]+' entwickeln: '+({ATK_LT_DEF:'Angriff < Verteidigung',ATK_GT_DEF:'Angriff > Verteidigung',ATK_EQ_DEF:'Angriff = Verteidigung'}[c[1]]||c[1]);
  return name+' entwickeln';
}
