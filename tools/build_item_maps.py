"""Render exact terrain grids for item markers, using pinned pokegold map data.

Inputs: --source snapshot JSON and --data JSON exported from collectionData.
Original pixels only; no generated or approximate terrain. Moving objects are omitted.
"""
import argparse, json, re, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

SHA='fc702b6d922aecce274782d68bba8639936a1182'
ROOT='https://raw.githubusercontent.com/pret/pokegold/'+SHA+'/'

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--data',required=True);p.add_argument('--cache',required=True);p.add_argument('--output',default='docs/assets/maps');p.add_argument('--manifest',default='docs/data/item-maps.js');a=p.parse_args()
 src=json.loads(Path(a.source).read_text())['files'];data=json.loads(Path(a.data).read_text());cache=Path(a.cache);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
 tilesets={name:tile.lower() for name,tile in re.findall(r'^\s*map (\w+), TILESET_(\w+),',src['data/maps/maps.asm'],re.M)}
 used=sorted({i['map'] for i in data['items']});paths={'gfx/tilesets/bg_tiles.pal'}
 for id in used:
  m=data['maps'][id];t=tilesets[m['name']];meta='cave' if t=='dark_cave' else t
  paths.update([f'maps/{m["name"]}.blk',f'gfx/tilesets/{t}.png',f'gfx/tilesets/{meta}_palette_map.asm',f'data/tilesets/{meta}_metatiles.bin'])
 def fetch(path):
  target=cache/path
  if not target.exists():
   target.parent.mkdir(parents=True,exist_ok=True)
   with urllib.request.urlopen(ROOT+path,timeout=30) as r:target.write_bytes(r.read())
  return path
 with ThreadPoolExecutor(max_workers=8) as pool:
  for index,_ in enumerate(pool.map(fetch,sorted(paths)),1):
   if index%40==0:print(f'{index}/{len(paths)} source files ready',flush=True)
 rows=[list(map(int,re.findall(r'\d+',line.split(';')[0]))) for line in (cache/'gfx/tilesets/bg_tiles.pal').read_text().splitlines() if 'RGB' in line]
 palettes=[[tuple(round(v*255/31) for v in row[c:c+3]) for c in range(0,12,3)] for row in rows]
 names=['GRAY','RED','GREEN','WATER','YELLOW','BROWN','ROOF','TEXT'];built={};tile_cache={}
 for id in used:
  m=data['maps'][id];t=tilesets[m['name']];meta='cave' if t=='dark_cave' else t;indoor=m['environment'] not in ['TOWN','ROUTE'];key=(t,indoor)
  if key not in tile_cache:
   gfx=Image.open(cache/f'gfx/tilesets/{t}.png').convert('L');pal=[]
   for line in (cache/f'gfx/tilesets/{meta}_palette_map.asm').read_text().splitlines():
    if 'tilepal' in line:pal.extend([v.strip() for v in line.split(';')[0].split(',')[1:]])
   tiles=[]
   for n in range(gfx.width//8*gfx.height//8):
    tile=gfx.crop(((n%(gfx.width//8))*8,(n//(gfx.width//8))*8,(n%(gfx.width//8)+1)*8,(n//(gfx.width//8)+1)*8));pn=names.index(pal[n]);colors=palettes[(32 if indoor else 8)+pn];colored=Image.new('RGB',(8,8));colored.putdata([colors[(255-pixel)//85] for pixel in tile.getdata()]);tiles.append(colored)
   tile_cache[key]=tiles
  tiles=tile_cache[key];blocks=(cache/f'maps/{m["name"]}.blk').read_bytes();metatiles=(cache/f'data/tilesets/{meta}_metatiles.bin').read_bytes();w,h=m['size'];assert len(blocks)==w*h//4,(id,len(blocks),w,h)
  image=Image.new('RGB',(w*16,h*16))
  for n,block in enumerate(blocks):
   for k,tile in enumerate(metatiles[block*16:block*16+16]):
    if tile>=len(tiles):raise ValueError((id,'missing tile',tile,len(tiles)))
    image.paste(tiles[tile],((n%(w//2))*32+(k%4)*8,(n//(w//2))*32+(k//4)*8))
  # Day/indoor tile palettes have <=32 exact colors: compact lossless PNG.
  colors=[color for _,color in image.getcolors(1000000)];lookup={c:i for i,c in enumerate(colors)};indexed=Image.new('P',image.size);indexed.putdata([lookup[c] for c in image.getdata()]);indexed.putpalette([v for c in colors for v in c]);file=id.lower()+'.png';indexed.save(out/file,optimize=True)
  built[id]={'image':'./assets/maps/'+file,'width':w,'height':h,'pixelWidth':w*16,'pixelHeight':h*16}
 payload={'sourceCommit':SHA,'maps':built,'positions':{'celadon_cafe-manual-leftovers':{'x':7,'y':1}}}
 Path(a.manifest).write_text('// Generated from pinned original map grids. See tools/build_item_maps.py.\nexport const itemMaps='+json.dumps(payload,separators=(',',':'))+';\n')
 print(json.dumps({'maps':len(built),'bytes':sum(p.stat().st_size for p in out.glob('*.png'))}),flush=True)

if __name__=='__main__':main()
