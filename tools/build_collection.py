"""Extract factual collection data from a pinned pret/pokegold source snapshot.

Input: JSON {sha, files: {repository_path: source_text}}. No ROM is used.
Run with --source, --species-names, --item-names and --output.
"""
import argparse
import collections
import json
import re
from pathlib import Path


def edition_source(text, edition):
    active = [True]
    taken = []
    out = []
    for line in text.splitlines():
        match = re.match(r'\s*(IF|ELIF) DEF\(_(GOLD|SILVER)\)', line)
        if match:
            selected = match[2].lower() == edition
            if match[1] == 'IF':
                active.append(active[-1] and selected)
                taken.append(selected)
            else:
                active[-1] = active[-2] and selected and not taken[-1]
                taken[-1] |= selected
        elif re.match(r'\s*ELSE\b', line):
            active[-1] = active[-2] and not taken[-1]
            taken[-1] = True
        elif re.match(r'\s*ENDC\b', line) and len(active) > 1:
            active.pop()
            taken.pop()
        elif active[-1]:
            out.append(line)
    return '\n'.join(out)


def parse_maps(files):
    dimensions = {name: [int(w)*2, int(h)*2] for name,w,h in re.findall(r'^\s*map_const\s+(\w+),\s*(\d+),\s*(\d+)', files['constants/map_constants.asm'], re.M)}
    ids = dict(re.findall(r'^\s*map_attributes\s+(\w+),\s*(\w+),', files['data/maps/attributes.asm'], re.M))
    maps = {}
    for line in files['data/maps/maps.asm'].splitlines():
        match = re.match(r'\s*map (\w+), (.+)', line)
        if not match:
            continue
        name = match[1]
        args = [x.strip() for x in match[2].split(',')]
        if name not in ids:
            continue
        maps[ids[name]] = dict(id=ids[name], name=name, landmark=args[2].replace('LANDMARK_', ''), environment=args[1], fish=args[-1].replace('FISHGROUP_', ''), size=dimensions.get(ids[name], [20,20]))
    return maps


def parse_species(files, names):
    constants=[]
    for line in files['constants/pokemon_constants.asm'].splitlines():
        match=re.match(r'\s*const (\w+)\s*;',line)
        if match and len(constants)<251:
            constants.append(match[1])
    assert len(constants)==251, len(constants)
    by_symbol={name:i+1 for i,name in enumerate(constants)}
    evos={i:[] for i in range(1,252)}
    current=0
    for line in files['data/pokemon/evos_attacks.asm'].splitlines():
        if re.match(r'^\w+EvosAttacks:',line): current+=1
        match=re.match(r'\s*db (EVOLVE_\w+), (.+)',line)
        if match and 1<=current<=251:
            args=[x.strip() for x in match[2].split(';')[0].split(',')]
            target=by_symbol[args[-1]]
            evos[target].append({'from':current,'method':match[1].replace('EVOLVE_','').lower(),'condition':args[:-1]})
    return by_symbol, {str(i):{'id':i,'name':names[str(i)],'symbol':symbol,'evolutions':evos[i]} for i,symbol in enumerate(constants,1)}


def parse_wild(files, maps, symbols):
    result=[]
    def add(map_id,species,edition,method,time,level,chance=None,note=''):
        if species not in symbols or map_id not in maps: return
        entry=dict(map=map_id, species=symbols[species], edition=edition, method=method, time=time, level=int(level), note=note)
        if chance is not None: entry['chance']=chance
        result.append(entry)
    for edition in ['gold','silver']:
        for path in ['data/wild/johto_grass.asm','data/wild/kanto_grass.asm','data/wild/swarm_grass.asm']:
            text=edition_source(files[path],edition)
            for match in re.finditer(r'def_grass_wildmons (\w+)\n(.*?)end_grass_wildmons',text,re.S):
                rows=re.findall(r'^\s*db (\d+), (\w+)',match[2],re.M)
                assert len(rows)==21,(path,match[1],len(rows))
                for i,(level,species) in enumerate(rows):
                    add(match[1],species,edition,'swarm' if 'swarm' in path else 'grass',['morn','day','nite'][i//7],level,[30,30,20,10,5,4,1][i%7], 'Schwarmmeldung per Telefon nötig' if 'swarm' in path else '')
        for path in ['data/wild/johto_water.asm','data/wild/kanto_water.asm','data/wild/swarm_water.asm']:
            text=edition_source(files[path],edition)
            for match in re.finditer(r'def_water_wildmons (\w+)\n(.*?)end_water_wildmons',text,re.S):
                rows=re.findall(r'^\s*db (\d+), (\w+)',match[2],re.M)
                for i,(level,species) in enumerate(rows): add(match[1],species,edition,'surf','all',level,[60,30,10][i], 'Schwarm' if 'swarm' in path else '')
        tree_text=edition_source(files['data/wild/treemons.asm'],edition)
        sets={}
        for match in re.finditer(r'TreeMonSet_(\w+):\n(.*?)(?=TreeMonSet_\w+:|\Z)',tree_text,re.S):
            sets[match[1].upper()]=re.findall(r'^\s*db\s+(\d+),\s*(\w+),\s*(\d+)',match[2],re.M)
        for line in files['data/wild/treemon_maps.asm'].splitlines():
            match=re.search(r'treemon_map (\w+),\s*TREEMON_SET_(\w+)',line)
            # The City set has no usable headbutt trees in the original games.
            if not match or match[2] in ['NONE','UNUSED','CITY']:continue
            method='smash' if match[2]=='ROCK' else 'headbutt'
            for chance,species,level in sets.get(match[2],[]): add(match[1],species,edition,method,'all',level,None, 'Nicht jeder Baum trägt diese Arten; seltene Baumgruppen hängen auch von der Trainer-ID ab.' if method=='headbutt' else '')
        contest=re.findall(r'^\s*db\s+\d+,\s*(\w+),\s*(\d+),\s*(\d+)', files['data/wild/bug_contest_mons.asm'],re.M)
        for species,low,high in contest: add('NATIONAL_PARK',species,edition,'contest','all',low,None,'Dienstag, Donnerstag oder Samstag; Käferturnier, Level '+low+'–'+high)
        fish=files['data/wild/fish.asm']
        time_rows=re.findall(r'^\s*db (\w+),\s*(\d+),\s*(\w+),\s*(\d+)\s*;',fish.split('TimeFishGroups:')[1],re.M)
        fish_sets={}
        labels=[]
        for line in fish.split('TimeFishGroups:')[0].splitlines():
            m=re.match(r'\.(\w+):',line)
            if m: labels.append(m[1]); continue
            m=re.match(r'\s*db\s+[^,]+,\s*(\w+),\s*(\d+)',line)
            tm=re.match(r'\s*db\s+[^,]+,\s*time_group (\d+)',line)
            if m or tm:
                for label in labels: fish_sets.setdefault(label,[])
                value=('timed',int(tm[1])) if tm else (m[1],int(m[2]))
                for label in labels: fish_sets[label].append(value)
            elif line.strip() and not line.lstrip().startswith(';'):
                labels=[]
        # Re-read individual labelled blocks; consecutive aliases share the same data.
        fish_sets={}; aliases=[]; current=None
        for line in fish.split('TimeFishGroups:')[0].splitlines():
            m=re.match(r'\.(\w+):',line)
            if m:
                if current is not None and fish_sets.get(current): aliases=[]
                current=m[1]; aliases.append(current); fish_sets.setdefault(current,[]); continue
            if current is None:continue
            m=re.match(r'\s*db\s+[^,]+,\s*(\w+),\s*(\d+)',line)
            tm=re.match(r'\s*db\s+[^,]+,\s*time_group (\d+)',line)
            if m or tm:
                value=('timed',int(tm[1])) if tm else (m[1],int(m[2]))
                for alias in aliases: fish_sets[alias].append(value)
        group_keys=['SHORE','OCEAN','LAKE','POND','DRATINI','QWILFISH_SWARM','REMORAID_SWARM','GYARADOS','DRATINI_2','WHIRLISLANDS','QWILFISH','REMORAID','QWILFISH_NOSWARM']
        group_rows=re.findall(r'^\s*fishgroup [^,]+,\s*\.(\w+),\s*\.(\w+),\s*\.(\w+)',fish,re.M)
        groups=dict(zip(group_keys,group_rows))
        water_maps=set(re.findall(r'def_water_wildmons (\w+)',files['data/wild/johto_water.asm']+'\n'+files['data/wild/kanto_water.asm']))
        for map_id,meta in maps.items():
            if map_id not in water_maps or meta['fish'] not in groups: continue
            for method,label in zip(['oldrod','goodrod','superrod'],groups[meta['fish']]):
                for species,level in fish_sets[label]:
                    if species=='timed':
                        day,dl,night,nl=time_rows[level]
                        add(map_id,day,edition,method,'mornday',dl)
                        add(map_id,night,edition,method,'nite',nl)
                    else:add(map_id,species,edition,method,'all',level)
        # During the two fishing swarms the game's group selection changes.
        for map_id,key in [('ROUTE_32','QWILFISH_SWARM'),('ROUTE_44','REMORAID_SWARM')]:
            for method,label in zip(['oldrod','goodrod','superrod'],groups[key]):
                for species,level in fish_sets[label]:
                    if species=='timed':species,level,_,_=time_rows[level]
                    add(map_id,species,edition,method,'all',level,None,'Nur während der passenden Schwarmmeldung per Telefon')
    # Collapse repeated slots without losing time/level information.
    groups={}
    for e in result:
        key=(e['map'],e['species'],e['edition'],e['method'],e['time'],e['note'])
        if key not in groups: groups[key]={**e,'levels':[],'chance':0 if 'chance' in e else None}
        entry=groups[key]
        entry['levels'].append(e['level'])
        if e.get('chance') is not None:entry['chance']+=e['chance']
    out=[]
    for e in groups.values():
        e.pop('level',None);e['levels']=sorted(set(e['levels']))
        if e['chance'] is None:e.pop('chance')
        out.append(e)
    return out


def parse_items(files,maps):
    name_to_id={meta['name']:id for id,meta in maps.items()}
    fruits=dict(re.findall(r'db (\w+)\s*; (\w+)',files['data/items/fruit_trees.asm']))
    fruits={label:item for item,label in re.findall(r'db (\w+)\s*; (\w+)',files['data/items/fruit_trees.asm'])}
    all_items=[]; specials=[]
    for edition in ['gold','silver']:
        for path,text in files.items():
            if not path.startswith('maps/'):continue
            map_name=Path(path).stem
            if map_name not in name_to_id or 'Beta' in map_name:continue
            map_id=name_to_id[map_name]
            text=edition_source(text,edition)
            labels={};blocks={};current=None;global_label=None
            line_labels=[]
            for line in text.splitlines():
                code=line.split(';')[0].strip()
                m=re.match(r'([.\w]+):{0,2}$',code)
                # Only accept actual labels, not no-argument script commands.
                is_label=m and (':' in code or code.startswith('.') and len(code.split())==1)
                if is_label:
                    name=m[1]
                    if name.startswith('.'): name=(global_label or '')+name
                    else:global_label=name
                    current=name;blocks[current]=[]
                elif current:blocks[current].append(code)
            positions={}
            for x,y,kind,script in re.findall(r'object_event\s+(\d+),\s*(\d+),\s*(SPRITE_\w+),[^\n]*?,\s*(\w+),\s*(?:EVENT_\w+|-1)\s*$',text,re.M):
                positions.setdefault(script,[]).append((int(x),int(y),kind))
            for x,y,script in re.findall(r'bg_event\s+(\d+),\s*(\d+),\s*BGEVENT_ITEM,\s*(\w+)',text):positions.setdefault(script,[]).append((int(x),int(y),'hidden'))
            flat=[];label_at={};scope=None
            for label,lines in blocks.items():
                label_at[label]=len(flat)
                for code in lines:flat.append((label,code))
            def walk(entry):
                if entry not in label_at:return []
                queue=[(label_at[entry],(),None,0)];visited=set();rewards=[]
                while queue and len(visited)<1600:
                    pc,conditions,last,depth=queue.pop()
                    if pc>=len(flat) or depth>260:continue
                    marker=(pc,conditions,last)
                    if marker in visited:continue
                    visited.add(marker)
                    scope,code=flat[pc]
                    args=code.split(None,1);cmd=args[0] if args else '';rest=args[1] if len(args)>1 else ''
                    def resolve(label):return scope.split('.')[0]+label if label.startswith('.') else label
                    if cmd in ['itemball','hiddenitem','verbosegiveitem','giveitem','fruittree']:
                        item=rest.split(',')[0].strip()
                        if cmd=='fruittree':item=fruits.get(item.replace('FRUITTREE_',''),'UNKNOWN')
                        if item and item not in ['ITEM_FROM_MEM','ITEM_FROM_MEM2','UNKNOWN']:
                            rewards.append((scope,cmd,item,conditions))
                        if cmd in ['itemball','hiddenitem','fruittree']:continue
                        last=None
                    if cmd in ['checkevent','checkflag','checkitem','checkpoke','checktime']:
                        last=cmd+':'+rest.split(',')[0]
                    elif cmd=='readvar' and rest=='VAR_WEEKDAY':last='weekday'
                    elif cmd in ['iftrue','iffalse','ifequal','ifnotequal']:
                        bits=[x.strip() for x in rest.split(',')]
                        target=resolve(bits[-1]); positive=cmd in ['iftrue','ifequal']
                        condition=last
                        if cmd in ['ifequal','ifnotequal']:
                            condition=('weekday:'+bits[0]) if last=='weekday' else None
                        yes=conditions+((('' if positive else '!')+condition,) if condition else ())
                        no=conditions+((('!' if positive else '')+condition,) if condition else ())
                        if target in label_at:queue.append((label_at[target],tuple(sorted(set(yes))),None,depth+1))
                        queue.append((pc+1,tuple(sorted(set(no))),None,depth+1));continue
                    elif cmd in ['sjump','jump','jumptext','jumptextfaceplayer','end','endall','endcallback','return','jumpstd']:
                        if cmd in ['sjump','jump'] and resolve(rest) in label_at:queue.append((label_at[resolve(rest)],conditions,last,depth+1))
                        continue
                    elif cmd=='scall' and resolve(rest) in label_at:
                        queue.append((label_at[resolve(rest)],conditions,last,depth+1))
                    queue.append((pc+1,conditions,last,depth+1))
                return rewards
            seen=set()
            for entry,places in positions.items():
                for label,cmd,item,conditions in walk(entry):
                    key=(entry,label,item)
                    if key in seen:continue
                    seen.add(key)
                    x,y,sprite=places[0]
                    kind='hidden' if sprite=='hidden' or cmd=='hiddenitem' else 'ground' if cmd=='itemball' else 'tree' if cmd=='fruittree' else 'person'
                    all_items.append(dict(id=map_id.lower()+'-'+entry.lower()+'-'+item.lower(),map=map_id,item=item,kind=kind,x=x,y=y,person=entry,conditions=list(conditions),edition=edition,source=path))
            for label,lines in blocks.items():
                for code in lines:
                    m=re.match(r'(givepoke|giveegg|loadwildmon)\s+(\w+),\s*(\w+)',code)
                    if m and m[2] not in ['RATTATA'] and 'Tutorial' not in label:
                        specials.append(dict(map=map_id,method=m[1],symbol=m[2],level=m[3],label=label,edition=edition))
    return all_items,specials


def main():
    p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--species-names',required=True);p.add_argument('--item-names',required=True);p.add_argument('--output',required=True)
    args=p.parse_args();raw=json.loads(Path(args.source).read_text());files=raw['files'];maps=parse_maps(files)
    symbols,species=parse_species(files,json.loads(Path(args.species_names).read_text()))
    wild=parse_wild(files,maps,symbols);items,specials=parse_items(files,maps)
    data=dict(sourceCommit=raw['sha'],maps=maps,species=species,encounters=wild,items=items,specials=specials,itemNames=json.loads(Path(args.item_names).read_text()))
    Path(args.output).write_text(json.dumps(data,ensure_ascii=False,indent=2))
    print(json.dumps({'maps':len(maps),'species':len(species),'encounters':len(wild),'items':len(items),'specials':len(specials)}))


if __name__=='__main__':main()
