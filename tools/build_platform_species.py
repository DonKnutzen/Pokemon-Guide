"""Add a 386-species name index and exact Gen III sprites for species 252–386."""
import csv,json,urllib.request
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO,StringIO
from pathlib import Path
from PIL import Image
NAMES_COMMIT='ae1a56ce90dec33332d7b36983a636e9e04ac582'
SPRITE_COMMIT='97a7832d307311c0e1c6ea9035308bf80cc94f81'
BASE=f'https://raw.githubusercontent.com/PokeAPI/sprites/{SPRITE_COMMIT}/sprites/pokemon/versions/generation-iii/emerald'
def read(url):
 with urllib.request.urlopen(url,timeout=30) as r:return r.read()
def sprite(n):return n,Image.open(BytesIO(read(f'{BASE}/{n}.png'))).convert('RGBA')
def main():
 url=f'https://raw.githubusercontent.com/PokeAPI/pokeapi/{NAMES_COMMIT}/data/v2/csv/pokemon_species_names.csv'
 rows=[{'id':int(r['pokemon_species_id']),'name':r['name']} for r in csv.DictReader(StringIO(read(url).decode())) if r['local_language_id']=='6' and int(r['pokemon_species_id'])<=386]
 assert len(rows)==386
 Path('docs/data/species-index.js').write_text('// German species names: PokeAPI/pokeapi@'+NAMES_COMMIT+'\nexport const speciesIndex='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n')
 atlas=Image.new('RGBA',(16*64,9*64))
 with ThreadPoolExecutor(max_workers=8) as pool:
  for n,im in pool.map(sprite,range(252,387)):
   assert im.size==(64,64),(n,im.size)
   i=n-252;atlas.alpha_composite(im,((i%16)*64,(i//16)*64))
 atlas.save('docs/assets/pokemon-sprites-hoenn.png',optimize=True)
 print('386 names; 135 Hoenn sprites saved')
if __name__=='__main__':main()
