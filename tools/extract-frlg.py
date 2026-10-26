"""Extract factual FR/LG facts from a pinned pret source tree; no ROM required.
No inferred story gates are asserted. Script guards are preserved as evidence for curation.
"""
import json,re,pathlib,collections,csv,io,urllib.request,concurrent.futures
ROOT=pathlib.Path(__import__('sys').argv[1])
SRC=ROOT/'pokefirered'
PIN=json.loads((ROOT/'frlg-source-pin.json').read_text())
OUT={'source':PIN,'maps':{},'encounters':[],'items':[],'species':{},'unresolved':[]}
# National Pokédex constants are independent of Gen III's internal species order.
s=(SRC/'include/constants/pokedex.h').read_text(); section=s.split('// National Pokedex order',1)[1].split('NATIONAL_DEX_COUNT',1)[0]
symbols=re.findall(r'^\s*NATIONAL_DEX_(\w+)\s*[,=]',section,re.M)
by_symbol={symbol:i for i,symbol in enumerate(symbols) if i<=386}
assert by_symbol['BULBASAUR']==1 and by_symbol['DEOXYS']==386,by_symbol.get('DEOXYS')
layouts={x['id']:x for x in json.loads((SRC/'data/layouts/layouts.json').read_text())['layouts'] if 'id' in x}
map_files={}
for f in sorted((SRC/'data/maps').glob('*/map.json')):
 m=json.loads(f.read_text());l=layouts.get(m['layout'],{});key=m['id'];map_files[key]=(f,m)
 OUT['maps'][key]={'id':key,'name':m['name'],'section':m['region_map_section'],'layout':m['layout'],'width':l.get('width'),'height':l.get('height'),'tilesets':[l.get('primary_tileset'),l.get('secondary_tileset')],'connections':m.get('connections',[]),'warps':m.get('warp_events',[]),'source':str(f.relative_to(SRC))}
# Wild slots include edition in base_label; fishing probabilities are conditional on rod.
wild=json.loads((SRC/'src/data/wild_encounters.json').read_text())
for group in wild['wild_encounter_groups']:
 fields={f['type']:f for f in group['fields']}
 for encounter in group['encounters']:
  edition='firered' if '_FireRed' in encounter['base_label'] else 'leafgreen' if '_LeafGreen' in encounter['base_label'] else None
  if not edition:OUT['unresolved'].append({'kind':'wildEdition','entry':encounter['base_label']});continue
  for field,method in [('land_mons','grass'),('water_mons','surf'),('rock_smash_mons','smash'),('fishing_mons','fishing')]:
   if field not in encounter:continue
   info=fields[field]; groups=info.get('groups',{method:list(range(len(info['encounter_rates'])))})
   for method_key,slots in groups.items():
    method_name={'old_rod':'oldrod','good_rod':'goodrod','super_rod':'superrod'}.get(method_key,method_key)
    rows={}
    for i in slots:
     mon=encounter[field]['mons'][i];symbol=mon['species'].replace('SPECIES_','');n=by_symbol.get(symbol)
     if n is None:OUT['unresolved'].append({'kind':'wildSpecies','symbol':symbol});continue
     r=rows.setdefault(n,{'edition':edition,'map':encounter['map'],'species':n,'symbol':symbol,'method':method_name,'chance':0,'minLevel':mon['min_level'],'maxLevel':mon['max_level'],'slots':[],'source':{'path':'src/data/wild_encounters.json','label':encounter['base_label']}})
     r['chance']+=info['encounter_rates'][i];r['minLevel']=min(r['minLevel'],mon['min_level']);r['maxLevel']=max(r['maxLevel'],mon['max_level']);r['slots'].append(i)
    OUT['encounters']+=list(rows.values())
# Species metadata needed for correct breeding, evolution, held-item farming.
infos=(SRC/'src/data/pokemon/species_info.h').read_text()
for m in re.finditer(r'^\s*\[SPECIES_(\w+)\]\s*=\s*\{\s*\n(.*?)^\s*\},',infos,re.M|re.S):
 symbol,body=m.groups();n=by_symbol.get(symbol)
 if not n:continue
 def field(name):
  r=re.search(r'\.'+name+r'\s*=\s*([^,\n]+)',body);return r[1].strip() if r else None
 eggs=re.search(r'\.eggGroups\s*=\s*\{([^}]+)',body)
 OUT['species'][n]={'id':n,'symbol':symbol,'eggGroups':[x.strip().replace('EGG_GROUP_','') for x in eggs[1].split(',')] if eggs else [],'genderRatio':field('genderRatio'),'heldItems':{'common':field('itemCommon'),'rare':field('itemRare')},'evolutions':[]}
evos=(SRC/'src/data/pokemon/evolution.h').read_text()
for m in re.finditer(r'\[SPECIES_(\w+)\]\s*=\s*\{(.*?)\}\s*,?',evos,re.S):
 source=by_symbol.get(m[1]);body=m[2]
 # Braced alternatives span lines until next species label, handled below instead.
for m in re.finditer(r'\[SPECIES_(\w+)\]\s*=\s*(.*?)(?=\n\s*\[SPECIES_|\n};)',evos,re.S):
 parent=by_symbol.get(m[1]);
 if not parent:continue
 for method,param,target in re.findall(r'\{\s*(EVO_\w+)\s*,\s*([^,]+)\s*,\s*SPECIES_(\w+)\s*\}',m[2]):
  child=by_symbol.get(target)
  if child:OUT['species'][child]['evolutions'].append({'from':parent,'method':method.removeprefix('EVO_').lower(),'param':param.strip()})
# Preprocess only edition switches. Other assembly directives remain evidence.
def preprocessed(text,edition):
 active=[True];branches=[]
 for lineno,line in enumerate(text.splitlines(),1):
  m=re.match(r'\s*\.(ifdef|ifndef) (FIRERED|LEAFGREEN)',line)
  if m:
   want=(m[2]=='FIRERED')==(edition=='firered');want=not want if m[1]=='ifndef' else want
   branches.append(want);active.append(active[-1] and want);continue
  if re.match(r'\s*\.else',line) and branches:active[-1]=active[-2] and not branches[-1];continue
  if re.match(r'\s*\.endif',line) and branches:active.pop();branches.pop();continue
  if active[-1]:yield lineno,line
scripts={}
for edition in ['firered','leafgreen']:
 labels={};aliases={};files=list((SRC/'data/maps').glob('*/scripts.inc'))+list((SRC/'data/scripts').rglob('*.inc'))
 for f in files:
  label=None;path=str(f.relative_to(SRC));local_alias={}
  for lineno,line in preprocessed(f.read_text(),edition):
   a=re.match(r'\s*\.equ\s+(\w+)\s*,\s*(ITEM_\w+)',line)
   if a:local_alias[a[1]]=a[2]
   m=re.match(r'^(\w+)::?\s*(?:@.*)?$',line)
   if m:label=m[1];labels[label]={'path':path,'line':lineno,'commands':[],'aliases':local_alias};continue
   if label:
    line=line.split('@',1)[0].strip()
    if line and not line.startswith(('.', '#')):labels[label]['commands'].append((lineno,line))
 scripts[edition]=labels
 def reachable(root):
  found={};stack=[root]
  while stack and len(found)<600:
   label=stack.pop()
   if label in found or label not in labels:continue
   block=labels[label];found[label]=block
   for _,cmd in block['commands']:
    if re.match(r'(?:goto|call)(?:_\w+)?\b',cmd):
     target=cmd.split(',')[-1].strip().split()[0]
     if target in labels:stack.append(target)
  return found
 def facts(blocks):
  rewards=[];guards=[]
  for label,block in blocks.items():
   for lineno,cmd in block['commands']:
    if re.match(r'(?:goto_if|call_if|compare|checkflag|checkitem|checkplayergender|checkpartymove|checknationaldex|checkpokemon|checkpokedex|checktrainerflag|countpokemon|checkfatefulencounter|specialvar)\b',cmd) or re.match(r'(?:goto_if|call_if)_',cmd):guards.append(cmd)
    m=re.match(r'(finditem|giveitem_msg|giveitem|additem)\s+(.+)',cmd)
    if not m:continue
    args=[x.strip() for x in m[2].split(',')];item=args[1] if m[1]=='giveitem_msg' and len(args)>1 else args[0];item=block['aliases'].get(item,item)
    qindex=2 if m[1]=='giveitem_msg' else 1;qty=args[qindex] if len(args)>qindex else '1'
    if not item.startswith('ITEM_'):
     OUT['unresolved'].append({'kind':'dynamicItem','edition':edition,'script':label,'expression':item,'path':block['path'],'line':lineno});continue
    rewards.append({'item':item,'quantity':int(qty) if qty.isdigit() else 1,'quantityExpression':qty,'source':{'path':block['path'],'line':lineno,'label':label},'command':m[1]})
  return rewards,sorted(set(guards))
 emitted=set()
 for mapid,(file,m) in map_files.items():
  for index,event in enumerate(m.get('bg_events',[])):
   if event.get('type')!='hidden_item':continue
   OUT['items'].append({'id':m['name'].lower()+'-hidden-'+event['flag'].lower(),'edition':edition,'map':mapid,'item':event['item'],'kind':'hidden','x':event['x'],'y':event['y'],'flag':event['flag'],'quantity':event.get('quantity',1),'underfoot':event.get('underfoot',False),'source':{'path':str(file.relative_to(SRC)),'bgEventIndex':index},'conditions':[],'reviewRequired':False})
  for index,event in enumerate(m.get('object_events',[])):
   root=event.get('script');
   if not root or root=='0x0':continue
   blocks=reachable(root);rewards,guards=facts(blocks)
   for reward in rewards:
    # Only finditem rewards are physical pickup balls. Person rewards retain NPC placement.
    kind='ground' if reward['command']=='finditem' and event.get('graphics_id')=='OBJ_EVENT_GFX_ITEM_BALL' else 'person'
    key=(mapid,reward['item'],reward['source']['label'],kind)
    if key in emitted:continue
    emitted.add(key)
    OUT['items'].append({**reward,'id':m['name'].lower()+'-'+reward['source']['label'].lower()+'-'+reward['item'].lower(),'edition':edition,'map':mapid,'kind':kind,'x':event.get('x'),'y':event.get('y'),'script':root,'flag':event.get('flag'),'npcGraphics':event.get('graphics_id'),'conditions':guards,'reviewRequired':kind=='person'})
 # Remaining literal rewards are scene-triggered/unbound, not fabricated NPC positions.
 for label,block in labels.items():
  if not block['path'].startswith('data/maps/'):continue
  mapname=block['path'].split('/')[2];mapid=next((i for i,m in OUT['maps'].items() if m['name']==mapname),None)
  if not mapid:continue
  rewards,guards=facts({label:block})
  for reward in rewards:
   if reward['command']=='finditem':continue
   key=(mapid,reward['item'],label,'person')
   if key in emitted:continue
   emitted.add(key)
   OUT['items'].append({**reward,'id':mapname.lower()+'-'+label.lower()+'-'+reward['item'].lower(),'edition':edition,'map':mapid,'kind':'person','x':None,'y':None,'script':label,'conditions':guards,'reviewRequired':True,'placement':'scene-or-unresolved-npc'})
# A separate German item dictionary uses PokeAPI identifiers, never internal IDs.
def fetch_csv(name):
 url='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+name+'.csv'
 return list(csv.DictReader(io.StringIO(urllib.request.urlopen(url,timeout=30).read().decode())))
try:
 with concurrent.futures.ThreadPoolExecutor() as pool:catalog,names=pool.map(fetch_csv,['items','item_names'])
 german={r['item_id']:r['name'] for r in names if r['local_language_id']=='6'};ids={r['identifier']:r['id'] for r in catalog}
 aliases={'ss-ticket':'ss-ticket','oaks-parcel':'oaks-parcel'}
 dictionary={}
 for item in set(r['item'] for r in OUT['items']):
  identifier=item.removeprefix('ITEM_').lower().replace('_','-');identifier=aliases.get(identifier,identifier)
  if identifier in ids and ids[identifier] in german:dictionary[item]=german[ids[identifier]]
 OUT['itemNames']=dictionary;OUT['localizationSource']='https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv'
except Exception as exc:OUT['unresolved'].append({'kind':'itemLocalization','error':str(exc)})
# De-duplicate diagnostic entries produced through multiple NPC reachability paths.
OUT['unresolved']=list({json.dumps(x,sort_keys=True):x for x in OUT['unresolved']}.values())
OUT['coverage']={'maps':len(OUT['maps']),'encounters':len(OUT['encounters']),'items':dict(collections.Counter(i['kind'] for i in OUT['items'])),'species':len(OUT['species']),'unresolved':len(OUT['unresolved'])}
(ROOT/'frlg-extracted.json').write_text(json.dumps(OUT,ensure_ascii=False,separators=(',',':')))
print(json.dumps(OUT['coverage']))
