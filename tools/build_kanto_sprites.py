"""Build a lossless FR/LG atlas for both Kanto collections, including National Dex."""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
import urllib.request
from PIL import Image
COMMIT='97a7832d307311c0e1c6ea9035308bf80cc94f81'
ROOT=f'https://raw.githubusercontent.com/PokeAPI/sprites/{COMMIT}/sprites/pokemon/versions/generation-iii/firered-leafgreen'
def fetch(n):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(f'{ROOT}/{n}.png',timeout=30) as r: image=Image.open(BytesIO(r.read())).convert('RGBA')
   image.load()
   assert image.size==(64,64),(n,image.size)
   return n,image
  except Exception:
   if attempt==2:raise
def main():
 atlas=Image.new('RGBA',(16*64,25*64))
 with ThreadPoolExecutor(max_workers=8) as pool:
  for n,image in pool.map(fetch,range(1,387)):
   index=n-1;atlas.alpha_composite(image,((index%16)*64,(index//16)*64))
 output=Path('docs/assets/pokemon-sprites-frlg.webp')
 atlas.save(output,lossless=True,quality=100,method=6,exact=True)
 assert Image.open(output).convert('RGBA').tobytes()==atlas.tobytes()
 print(f'386 original FR/LG sprites: {output.stat().st_size} bytes; exact pixels verified')
if __name__=='__main__':main()
