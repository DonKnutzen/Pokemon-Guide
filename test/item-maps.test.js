import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {collectionData as data} from '../docs/data/collection-data.js';
import {itemMaps} from '../docs/data/item-maps.js';
import {guideMaps} from '../docs/data/guide-maps.js';
import {positionFor,mappedItems,itemMarker,focusBox} from '../docs/assets/item-map-model.js';

test('every visible and hidden pickup has an exact field on a rendered original map in both editions',()=>{
 for(const edition of ['gold','silver']){
  const pickups=data.items.filter(i=>i.edition===edition&&['ground','hidden'].includes(i.kind));assert.equal(pickups.length,223);
  for(const item of pickups){const p=positionFor(item),map=itemMaps.maps[item.map],marker=itemMarker(data,edition,item);assert.ok(p,item.id);assert.ok(map,item.map);assert.ok(p.x>=0&&p.x<map.width&&p.y>=0&&p.y<map.height,item.id);assert.ok(marker.number>0);assert.equal(marker.x,(p.x+.5)*16);assert.equal(marker.y,(p.y+.5)*16);}
 }
 assert.equal(Object.keys(itemMaps.maps).length,95);
});
test('rendered map dimensions agree with the game grids and local PNG headers',()=>{
 for(const [id,m]of Object.entries(itemMaps.maps)){assert.deepEqual([m.width,m.height],data.maps[id].size);const png=readFileSync(new URL('../docs/'+m.image.slice(2),import.meta.url));assert.equal(png.readUInt32BE(16),m.width*16);assert.equal(png.readUInt32BE(20),m.height*16);}
});
test('item numbers remain stable after collecting an item and identify distinct fields',()=>{
 const before=mappedItems(data,'gold','NATIONAL_PARK');assert.ok(before.length>1);for(const [index,item]of before.entries())assert.equal(itemMarker(data,'gold',item).number,index+1);
 assert.equal(new Set(before.map(i=>i.id)).size,before.length);
 const potion=data.items.find(i=>i.edition==='gold'&&i.map==='ROUTE_29'&&i.item==='POTION');assert.deepEqual(positionFor(potion),{x:48,y:2});assert.equal(itemMarker(data,'gold',potion).x,776);
});
test('the café trashcan uses its exact source-script position, not an approximate room center',()=>{
 const item=data.items.find(i=>i.edition==='gold'&&i.item==='LEFTOVERS'&&i.map==='CELADON_CAFE');assert.deepEqual(positionFor(item),{x:7,y:1});
});
test('detail crops stay inside their map and contain the selected field at all edges',()=>{
 for(const map of Object.values(itemMaps.maps))for(const p of [{x:0,y:0},{x:map.width-1,y:map.height-1}]){const b=focusBox(map,p);assert.ok(b.x>=0&&b.y>=0);assert.ok(b.x+b.width<=map.pixelWidth&&b.y+b.height<=map.pixelHeight);assert.ok((p.x+.5)*16>=b.x&&(p.x+.5)*16<=b.x+b.width);assert.ok((p.y+.5)*16>=b.y&&(p.y+.5)*16<=b.y+b.height);}
});
test('guide references point to existing, nonempty map crops and valid locations',()=>{
 for(const [location,refs]of Object.entries(guideMaps)){assert.ok(data.locations.some(l=>l.id===location));for(const ref of refs){assert.ok(ref.page>=20&&ref.page<=81);const path=new URL('../docs/'+ref.image.slice(2),import.meta.url);assert.ok(existsSync(path));assert.ok(readFileSync(path).length>100);}}
});
