import {pendingRows,mergeRecords,acknowledge} from './platform-model.js?v=9';

// Snapshot writes are acknowledged by stamp, so a catch made during a request
// remains pending. Remote rows merge per field, including undo tombstones.
export async function syncLibrary(library,transport,{isCurrent=()=>true,checkpoint=()=>{}}={}){
 const rows=pendingRows(library);
 for(let i=0;i<rows.length;i+=400){
  if(!isCurrent())return false;
  const batch=rows.slice(i,i+400);await transport.push(batch);
  if(!isCurrent())return false;
  acknowledge(library,batch);checkpoint();
 }
 let offset=0;
 while(isCurrent()){
  const incoming=await transport.pull(offset,800);
  if(!isCurrent())return false;
  mergeRecords(library,incoming);checkpoint();
  if(incoming.length<800)break;offset+=800;
  if(offset>30000)throw Error('Zu viele Fortschrittseinträge.');
 }
 return isCurrent();
}
