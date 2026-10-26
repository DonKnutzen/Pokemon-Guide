#!/usr/bin/env python3
"""Render terrain grids from a pinned pret/pokefirered source checkout, without a ROM.

python render_frlg_maps.py --source research/pokefirered --output research/frlg-map-assets
Images omit people, item-ball objects, sprites and changes caused by game scripts.
A marker for map event (x,y) belongs at pixel (16*x+8,16*y+8).
"""
import argparse
import hashlib
import json
import re
import struct
from functools import lru_cache
from pathlib import Path
from PIL import Image

PIN='ce6406d8c2eaf46d543c8a2606de0c3cb1951982'

def parse_assets(root):
    headers=(root/'src/data/tilesets/headers.h').read_text()
    specs={symbol:{key:value.strip() for key,value in re.findall(r'\.(\w+)\s*=\s*([^,]+)',body)} for symbol,body in re.findall(r'const struct Tileset (\w+)\s*=\s*\{(.*?)\};',headers,re.S)}
    graphics=(root/'src/data/tilesets/graphics.h').read_text()+'\n'+(root/'src/graphics.c').read_text()
    gfx=dict(re.findall(r'const u32 (gTilesetTiles_\w+)\[\]\s*=\s*INCBIN_U32\("([^"]+)"\)',graphics))
    pals={symbol:re.findall(r'INCBIN_U16\("([^"]+)"\)',body) for symbol,body in re.findall(r'const u16 (gTilesetPalettes_\w+)\[\]\[16\]\s*=\s*\{(.*?)\};',graphics,re.S)}
    metatiles=(root/'src/data/tilesets/metatiles.h').read_text()
    meta=dict(re.findall(r'const u16 (gMetatiles_\w+)\[\]\s*=\s*INCBIN_U16\("([^"]+)"\)',metatiles))
    attrs=dict(re.findall(r'const u32 (gMetatileAttributes_\w+)\[\]\s*=\s*INCBIN_U32\("([^"]+)"\)',metatiles))
    return specs,gfx,pals,meta,attrs

class Renderer:
    def __init__(self,source):
        self.root=source
        self.specs,self.gfx,self.pals,self.meta,self.attrs=parse_assets(source)
        self.warnings=[]

    @lru_cache(None)
    def tileset(self,symbol):
        s=self.specs[symbol]
        png=self.root/self.gfx[s['tiles']].replace('.4bpp.lz','.png')
        image=Image.open(png)
        assert image.mode=='P',(symbol,image.mode)
        tiles=[]
        for y in range(0,image.height,8):
            for x in range(0,image.width,8):tiles.append(image.crop((x,y,x+8,y+8)))
        palettes=[]
        for file in self.pals[s['palettes']]:
            rows=(self.root/file.replace('.gbapal','.pal')).read_text().splitlines()
            assert rows[:2]==['JASC-PAL','0100']
            colors=[tuple(map(int,row.split())) for row in rows[3:19]]
            assert len(colors)==16
            palettes.append(colors)
        raw=(self.root/self.meta[s['metatiles']]).read_bytes()
        metatiles=[row for row in struct.iter_unpack('<8H',raw)]
        attrs=list(struct.unpack('<'+'I'*((self.root/self.attrs[s['metatileAttributes']]).stat().st_size//4),(self.root/self.attrs[s['metatileAttributes']]).read_bytes()))
        return tiles,palettes,metatiles,attrs

    @lru_cache(100000)
    def tile(self,primary,secondary,value):
        a,b=self.tileset(primary),self.tileset(secondary)
        index=value&0x3ff
        tiles=a[0] if index<640 else b[0]
        idx=index if index<640 else index-640
        if idx>=len(tiles):
            # Uninitialized slots are blank VRAM in the unanimated source layout.
            self.warnings.append({'type':'uninitializedTile','tileset':primary if index<640 else secondary,'index':idx})
            return Image.new('RGBA',(8,8))
        src=tiles[idx]
        palette_id=(value>>12)&15
        sets=a if palette_id<7 else b
        if palette_id>=len(sets[1]):
            self.warnings.append({'type':'missingPalette','tileset':primary if palette_id<7 else secondary,'index':palette_id})
            palette_id=0
        palette=sets[1][palette_id]
        out=Image.new('RGBA',(8,8))
        out.putdata([(*palette[index],255 if index else 0) for index in src.getdata()])
        if value&0x400:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if value&0x800:out=out.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        return out

    @lru_cache(30000)
    def block(self,primary,secondary,index):
        source=self.tileset(primary if index<640 else secondary)
        idx=index if index<640 else index-640
        if idx>=len(source[2]):
            self.warnings.append({'type':'missingMetatile','primary':primary,'secondary':secondary,'index':index})
            return Image.new('RGBA',(16,16),(0,0,0,255))
        refs=source[2][idx]
        layer_type=(source[3][idx]>>29)&3
        out=Image.new('RGBA',(16,16),(0,0,0,255))
        if layer_type==0:
            # The real engine puts tile 0x3014 behind NORMAL metatiles.
            base=self.tile(primary,secondary,0x3014)
            for y in (0,8):
                for x in (0,8):out.alpha_composite(base,(x,y))
        for part,value in enumerate(refs):
            out.alpha_composite(self.tile(primary,secondary,value),((part%4%2)*8,((part%4)//2)*8))
        return out

    def layout(self,layout):
        width,height=layout['width'],layout['height']
        values=struct.unpack('<'+'H'*(width*height),(self.root/layout['blockdata_filepath']).read_bytes())
        out=Image.new('RGB',(width*16,height*16))
        for i,value in enumerate(values):out.paste(self.block(layout['primary_tileset'],layout['secondary_tileset'],value&0x3ff).convert('RGB'),((i%width)*16,(i//width)*16))
        return out

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--only',help='Optional comma-separated source map IDs')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    layouts={l['id']:l for l in json.loads((args.source/'data/layouts/layouts.json').read_text())['layouts'] if 'id' in l}
    renderer=Renderer(args.source);wanted=set(args.only.split(',')) if args.only else None
    assets={};rendered={};failures=[]
    for p in sorted((args.source/'data/maps').glob('*/map.json')):
        m=json.loads(p.read_text())
        if wanted is not None and m['id'] not in wanted:continue
        layout=layouts.get(m['layout'])
        if not layout:
            failures.append({'map':m['id'],'reason':'missingLayout','layout':m['layout']});continue
        name=m['id'].removeprefix('MAP_').lower()+'.webp'
        if layout['id'] in rendered:
            name=rendered[layout['id']]
        else:
            try:
                image=renderer.layout(layout);image.save(args.output/name,'WEBP',lossless=True,method=6)
                rendered[layout['id']]=name
            except Exception as e:
                failures.append({'map':m['id'],'reason':str(e)});continue
        assets[m['id']]={'image':name,'widthTiles':layout['width'],'heightTiles':layout['height'],'pixelWidth':layout['width']*16,'pixelHeight':layout['height']*16,'layout':layout['id']}
    unique_warnings={json.dumps(w,sort_keys=True):w for w in renderer.warnings}
    manifest={'source':{'repository':'pret/pokefirered','sha':PIN,'url':'https://github.com/pret/pokefirered/tree/'+PIN},'tileSize':16,'notes':['Terrain without object sprites or script-dependent state changes.','Tile animations use the source base tile sheet.','(x,y) event coordinates are map tiles; marker center=(16*x+8,16*y+8).'], 'maps':assets,'warnings':list(unique_warnings.values()),'failures':failures}
    (args.output/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
    print(json.dumps({'maps':len(assets),'images':len(rendered),'bytes':sum(p.stat().st_size for p in args.output.glob('*.webp')),'warnings':len(unique_warnings),'failures':failures}))
if __name__=='__main__':main()
