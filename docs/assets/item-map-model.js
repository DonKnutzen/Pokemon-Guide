import {itemMaps} from '../data/item-maps.js';
export function positionFor(item){
 const override=itemMaps.positions[item.id];
 const p=override||item;
 return Number.isInteger(p.x)&&Number.isInteger(p.y)?{x:p.x,y:p.y}:null;
}
export function mappedItems(data,edition,mapId){
 return data.items.filter(i=>i.edition===edition&&i.map===mapId&&['ground','hidden'].includes(i.kind)&&positionFor(i))
  .sort((a,b)=>positionFor(a).y-positionFor(b).y||positionFor(a).x-positionFor(b).x||a.id.localeCompare(b.id));
}
export function itemMarker(data,edition,item){
 const map=itemMaps.maps[item.map],p=positionFor(item);if(!map||!p)return null;
 return {number:mappedItems(data,edition,item.map).findIndex(i=>i.id===item.id)+1,x:(p.x+.5)*16,y:(p.y+.5)*16,map};
}
export function focusBox(map,position,columns=16,rows=12){
 const width=Math.min(map.pixelWidth,columns*16),height=Math.min(map.pixelHeight,rows*16);
 return {x:Math.max(0,Math.min(map.pixelWidth-width,(position.x+.5)*16-width/2)),y:Math.max(0,Math.min(map.pixelHeight-height,(position.y+.5)*16-height/2)),width,height};
}
