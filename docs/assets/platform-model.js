import {series,gameById,seriesById} from '../data/catalog.js?v=9';
import {blankProgress,restoreProgress} from './model.js?v=3';

export const LIBRARY_VERSION=2;
export const GUEST_KEY='pokeguide:library:v2:guest';
export const accountKey=id=>'pokeguide:library:v2:user:'+id;
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'&&x.length<=180&&!/[\u0000-\u001f]/u.test(x);
const token=x=>typeof x==='string'&&/^[a-zA-Z0-9_.-]{1,180}$/.test(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const stampPattern=/^\d{13}-\d{6}-[a-zA-Z0-9-]{8,64}$/;
export function emptyLibrary(device='local-device'){
 return {app:'pokeguide',version:LIBRARY_VERSION,device,clock:0,sequence:0,selectedEdition:'gold',records:{},pending:{},migrations:[]};
}
// Independent fields make concurrent catches/items merge without replacing an entire save.
// False values are retained as tombstones: undo also survives offline synchronization.
export function validRecord(key,record){
 if(!token(key)||!plain(record)||!stampPattern.test(record.stamp)||!Object.hasOwn(record,'value'))return false;
 const parts=key.split('.'),[type,scope,id]=parts,v=record.value;
 if(type==='caught'&&parts.length===3){
  const group=seriesById(scope),n=Number(id);
  return !!group&&String(n)===id&&Number.isInteger(n)&&n>=1&&n<=group.max&&plain(v)&&typeof v.caught==='boolean'&&(!v.edition||gameById(v.edition)?.series===scope)&&(!v.location||token(v.location));
 }
 const game=gameById(scope);if(!game)return false;
 if(['item','visited','unlock','task'].includes(type)&&parts.length===3)return token(id)&&typeof v==='boolean';
 if(type==='setting'&&parts.length===3){
  if(id==='lastLocation'||id==='lastChapter')return token(v);
  if(id==='starter')return v===0||seriesById(game.series).starters.includes(v);
  if(id==='frlgStage')return ['firered','leafgreen'].includes(scope)&&Number.isInteger(v)&&v>=0&&v<=17;
  if(id==='dojo')return [0,106,107].includes(v);
  if(id==='fossil')return [0,138,140].includes(v);
  if(id==='time')return ['all','morn','day','nite'].includes(v);
  if(id==='weekday')return v==='all'||Number.isInteger(v)&&v>=0&&v<=6;
 }
 return false;
}
export function restoreLibrary(value,device){
 const clean=emptyLibrary(device);
 if(!plain(value)||value.app!=='pokeguide'||value.version!==LIBRARY_VERSION)return clean;
 if(gameById(value.selectedEdition))clean.selectedEdition=value.selectedEdition;
 clean.clock=Number.isSafeInteger(value.clock)&&value.clock>=0&&value.clock<=9999999999999?value.clock:0;
 clean.sequence=Number.isSafeInteger(value.sequence)&&value.sequence>=0&&value.sequence<1000000?value.sequence:0;
 if(plain(value.records))for(const [key,r] of Object.entries(value.records).slice(0,30000))if(validRecord(key,r)){
  clean.records[key]=structuredClone(r);
  if(value.pending?.[key]===r.stamp)clean.pending[key]=r.stamp;
  const ms=Number(r.stamp.slice(0,13)),sequence=Number(r.stamp.slice(14,20));
  if(ms>clean.clock){clean.clock=ms;clean.sequence=sequence;}else if(ms===clean.clock)clean.sequence=Math.max(clean.sequence,sequence);
 }
 clean.migrations=Array.isArray(value.migrations)?value.migrations.filter(str).slice(0,50):[];
 return clean;
}
export function writeRecord(lib,key,value,now=Date.now()){
 if(same(lib.records[key]?.value,value))return false;
 const ms=Math.max(now,lib.clock),sequence=ms===lib.clock?lib.sequence+1:0;
 lib.clock=sequence>=1000000?ms+1:ms;lib.sequence=sequence>=1000000?0:sequence;
 const record={value:structuredClone(value),stamp:String(lib.clock).padStart(13,'0')+'-'+String(lib.sequence).padStart(6,'0')+'-'+lib.device};
 if(!validRecord(key,record))throw Error('Ungültiger Fortschrittseintrag: '+key);
 lib.records[key]=record;lib.pending[key]=record.stamp;return true;
}
export function mergeRecords(lib,rows){
 let changed=false;
 for(const row of rows){const key=row.key,r={value:row.value,stamp:row.stamp};if(!validRecord(key,r))continue;
  const existing=lib.records[key];if(!existing||r.stamp>existing.stamp){lib.records[key]=structuredClone(r);delete lib.pending[key];changed=true;}
  else if(r.stamp===existing.stamp)delete lib.pending[key];
  const ms=Number(r.stamp.slice(0,13));if(ms>lib.clock){lib.clock=ms;lib.sequence=Number(r.stamp.slice(14,20));}else if(ms===lib.clock)lib.sequence=Math.max(lib.sequence,Number(r.stamp.slice(14,20)));
 }
 return changed;
}
export function pendingRows(lib){return Object.keys(lib.pending).filter(key=>lib.pending[key]===lib.records[key]?.stamp).map(key=>({key,...lib.records[key]}));}
export function acknowledge(lib,rows){for(const row of rows)if(lib.pending[row.key]===row.stamp)delete lib.pending[row.key];}
export function caughtIn(lib,group){return Object.entries(lib.records).filter(([key,r])=>key.startsWith('caught.'+group+'.')&&r.value.caught).map(([key])=>Number(key.split('.')[2])).sort((a,b)=>a-b);}
export function allCaught(lib){return [...new Set(series.flatMap(s=>caughtIn(lib,s.id)))].sort((a,b)=>a-b);}
export function catchRecord(lib,group,id){return lib.records['caught.'+group+'.'+id]?.value;}
export function markCaught(lib,edition,id,caught,location){
 const group=gameById(edition)?.series;if(!group)return false;
 return writeRecord(lib,'caught.'+group+'.'+id,{caught,...(caught?{edition,...(location?{location}:{})}:{})});
}
const keysFor=(lib,type,edition)=>Object.entries(lib.records).filter(([key,r])=>key.startsWith(type+'.'+edition+'.')&&r.value===true).map(([key])=>key.split('.')[2]);
const setting=(lib,edition,key,fallback)=>lib.records['setting.'+edition+'.'+key]?.value??fallback;
export function guideView(lib,guide){
 const state=blankProgress(guide);state.edition=['gold','silver'].includes(lib.selectedEdition)?lib.selectedEdition:'gold';
 for(const ed of ['gold','silver']){
  const c=state.collection[ed];c.caught=caughtIn(lib,'gsc');
  for(const id of c.caught){const r=catchRecord(lib,'gsc',id);if(r?.location)c.catchLocations[id]=r.location;}
  for(const [key,type] of [['items','item'],['visited','visited'],['unlocks','unlock']])c[key]=keysFor(lib,type,ed);
  for(const key of ['lastLocation','starter','time','weekday'])c[key]=setting(lib,ed,key,c[key]);
  state.completed[ed]=keysFor(lib,'task',ed);state.lastChapter[ed]=setting(lib,ed,'lastChapter',state.lastChapter[ed]);
 }
 return restoreProgress(state,guide);
}
function syncSet(lib,type,edition,before,after){
 const a=new Set(before),b=new Set(after);for(const id of new Set([...a,...b]))if(a.has(id)!==b.has(id))writeRecord(lib,type+'.'+edition+'.'+id,b.has(id));
}
export function applyGuideView(lib,view,guide){
 const before=guideView(lib,guide),ed=view.edition;
 const previous=new Set(before.collection[ed].caught),next=new Set(view.collection[ed].caught);
 for(const id of new Set([...previous,...next]))if(previous.has(id)!==next.has(id))markCaught(lib,ed,id,next.has(id),view.collection[ed].catchLocations?.[id]);
 for(const game of ['gold','silver']){
  const a=before.collection[game],b=view.collection[game];
  for(const [key,type] of [['items','item'],['visited','visited'],['unlocks','unlock']])syncSet(lib,type,game,a[key],b[key]);
  syncSet(lib,'task',game,before.completed[game],view.completed[game]);
  for(const key of ['lastLocation','starter','time','weekday'])if(!same(a[key],b[key]))writeRecord(lib,'setting.'+game+'.'+key,b[key]);
  if(before.lastChapter[game]!==view.lastChapter[game])writeRecord(lib,'setting.'+game+'.lastChapter',view.lastChapter[game]);
 }
 if(['gold','silver'].includes(lib.selectedEdition))lib.selectedEdition=ed;
 return lib;
}
export function migrateLegacy(lib,value,guide){
 if(lib.migrations.includes('gold-silver-v1'))return lib;
 if(value?.guideId!==guide.id||value?.version!==1)return lib;
 const old=restoreProgress(value,guide);
 // Gold/Silver catches become one union. Items, story, location and gear stay separate.
 for(const ed of ['gold','silver']){
  const before=guideView(lib,guide),incoming=old.collection[ed];before.edition=ed;
  before.collection[ed]={...incoming,caught:[...new Set([...before.collection[ed].caught,...incoming.caught])],items:[...new Set([...before.collection[ed].items,...incoming.items])],unlocks:[...new Set([...before.collection[ed].unlocks,...incoming.unlocks])],visited:[...new Set([...before.collection[ed].visited,...incoming.visited])]};
  before.completed[ed]=[...new Set([...before.completed[ed],...old.completed[ed]])];before.lastChapter[ed]=old.lastChapter[ed];applyGuideView(lib,before,guide);
 }
 lib.selectedEdition=old.edition;lib.migrations.push('gold-silver-v1');return lib;
}
// Explicit backup/guest imports add positive progress at the user’s request.
// Ordinary device sync uses mergeRecords instead and retains undo tombstones.
export function importLibrary(lib,incoming){
 const backup=restoreLibrary(incoming,lib.device);
 for(const [key,r] of Object.entries(backup.records)){
  const current=lib.records[key];
  if(key.startsWith('caught.')){if(r.value.caught&&!current?.value.caught)writeRecord(lib,key,r.value);}
  else if(['item','visited','unlock','task'].includes(key.split('.')[0])){if(r.value===true&&current?.value!==true)writeRecord(lib,key,true);}
  else if(!current)writeRecord(lib,key,r.value);
 }
 return lib;
}
export function hasProgress(lib){return Object.entries(lib.records).some(([key,r])=>key.startsWith('caught.')?r.value.caught:['item','task','unlock','visited'].includes(key.split('.')[0])&&r.value===true);}

// A storage event comes from another local tab, not an acknowledged cloud write.
// Preserve its pending flags until the server confirms the exact stamps.
export function mergeDeviceLibrary(lib,incoming){
 const pending={...lib.pending,...incoming.pending};
 const changed=mergeRecords(lib,Object.entries(incoming.records).map(([key,r])=>({key,...r})));
 for(const [key,stamp]of Object.entries(pending))if(lib.records[key]?.stamp===stamp)lib.pending[key]=stamp;
 return changed;
}
