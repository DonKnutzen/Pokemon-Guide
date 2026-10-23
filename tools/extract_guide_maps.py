"""Extract only map reference crops from the owner's supplied guide PDF."""
import argparse,json
from pathlib import Path
import fitz
from PIL import Image

p=argparse.ArgumentParser();p.add_argument('pdf');p.add_argument('--config',default='tools/guide_map_crops.json');p.add_argument('--output',default='docs/assets/guide-maps');p.add_argument('--manifest',default='docs/data/guide-maps.js');a=p.parse_args()
doc=fitz.open(a.pdf);out=Path(a.output);out.mkdir(parents=True,exist_ok=True);references={}
for n,(page,box,locations) in enumerate(json.loads(Path(a.config).read_text()),1):
 rect=doc[page-1].rect;clip=fitz.Rect(box[0]*rect.width,box[1]*rect.height,box[2]*rect.width,box[3]*rect.height);pix=doc[page-1].get_pixmap(matrix=fitz.Matrix(1.3,1.3),clip=clip);im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);im.thumbnail((1100,1500));filename=f'guide-{page:03d}-{n:02d}.webp';temporary=out/(filename+'.tmp');im.save(temporary,'WEBP',quality=78,method=6)
 Image.open(temporary).load();temporary.replace(out/filename)
 for location in locations:references.setdefault(location,[]).append({'page':page,'image':'./assets/guide-maps/'+filename})
Path(a.manifest).write_text('// Map references cropped from the owner-supplied Nintendo Power guide.\nexport const guideMaps='+json.dumps(references,separators=(',',':'))+';\n')
print(json.dumps({'crops':n,'locations':len(references),'bytes':sum(p.stat().st_size for p in out.glob('*.webp'))}))
