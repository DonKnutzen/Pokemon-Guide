"""Curated FRLG special sources and dynamic item rewards, pinned factual provenance."""
import json,re,pathlib
R=pathlib.Path(__import__('sys').argv[1]);S=R/'pokefirered';D=json.loads((R/'frlg-extracted.json').read_text())
M=D['maps'];sym={v['symbol']:int(k) for k,v in D['species'].items()}
O={'source':D['source'],'pokemon':[],'items':[],'removeItemIds':[],'rewardNotes':{},'notes':[]}
def mapid(name):
 return next(k for k,v in M.items() if v['name']==name)
def src(path,needle):
 p=path if path.startswith('src/') or path.startswith('data/') else 'data/maps/'+path+'/scripts.inc'
 lines=(S/p).read_text().splitlines();line=next((i+1 for i,s in enumerate(lines) if needle in s),None)
 return {'path':p,'line':line}
def mon(symbol,mapname,method,level,detail,editions=('firered','leafgreen'),requires=(),**more):
 for ed in editions:O['pokemon'].append({'id':f'{ed}-{mapname.lower()}-{symbol.lower()}-{method}','edition':ed,'species':sym[symbol],'map':mapid(mapname),'method':method,'minLevel':level,'maxLevel':level,'detail':detail,'requires':list(requires),**more})
def item(item,mapname,detail,*,kind='person',requires=(),repeatable=False,source=None,xy=None,editions=('firered','leafgreen')):
 events=json.loads((S/'data/maps'/mapname/'map.json').read_text()).get('object_events',[])
 if xy is None:
  candidates=[e for e in events if e.get('script','0x0')!='0x0' and e.get('graphics_id')!='OBJ_EVENT_GFX_ITEM_BALL']
  if len(candidates)==1:xy=(candidates[0]['x'],candidates[0]['y'])
 for ed in editions:O['items'].append({'id':mapname.lower()+'-supplement-'+item.lower(),'edition':ed,'map':mapid(mapname),'item':item,'kind':kind,'quantity':1,'x':xy[0] if xy else None,'y':xy[1] if xy else None,'detail':detail,'requires':list(requires),'repeatable':repeatable,'source':source or src(mapname,item)})
# Starter and other gifts: single reward choices are explicit, never claimed as three free Pokémon.
for symbol in ['BULBASAUR','CHARMANDER','SQUIRTLE']:
 mon(symbol,'PalletTown_ProfessorOaksLab','gift',5,'Eines von drei Starter-Pokémon bei Professor Eich wählen. Die beiden anderen Starter zunächst nur durch Tausch; Zucht ist später mit einem vorhandenen Elternteil möglich.',source=src('PalletTown_ProfessorOaksLab','givemon PLAYER_STARTER_SPECIES'),choice='starter',choiceValue=sym[symbol])
mon('MAGIKARP','Route4_PokemonCenter_1F','gift',5,'Vom Verkäufer im Pokémon-Center für 500 ₽ kaufen.',source=src('Route4_PokemonCenter_1F','givemon SPECIES_MAGIKARP'))
mon('EEVEE','CeladonCity_Condominiums_RoofRoom','gift',25,'Durch den Hintereingang der Prismania-Villa bis ins Dachzimmer gehen und den Pokéball nehmen. Einmaliges Geschenk.',source=src('CeladonCity_Condominiums_RoofRoom','givemon SPECIES_EEVEE'))
mon('LAPRAS','SilphCo_7F','gift',25,'Nach dem Rivalenkampf mit dem Mitarbeiter im 7. Stock sprechen. Einmaliges Geschenk.',source=src('SilphCo_7F','givemon SPECIES_LAPRAS'))
for symbol in ['HITMONLEE','HITMONCHAN']:
 mon(symbol,'SaffronCity_Dojo','gift',25,'Nach dem Sieg über den Karate-Meister einen der beiden Pokébälle wählen. Nur Kicklee ODER Nockchan pro Spielstand; später kann Rabauz durch Zucht die andere Entwicklung ermöglichen.',source=src('SaffronCity_Dojo','setvar VAR_TEMP_1, SPECIES_'+symbol),choice='dojo',choiceValue=sym[symbol])
for symbol,fossil in [('OMANYTE','Helixfossil'),('KABUTO','Domfossil'),('AERODACTYL','Altbernstein')]:
 mon(symbol,'CinnabarIsland_PokemonLab_ExperimentRoom','fossil',5,f'{fossil} im Fossilienlabor abgeben, Raum verlassen und zurückkehren. Helix- und Domfossil sind die einmalige Auswahl im Mondberg; Altbernstein im Museum von Marmoria City mit Zerschneider holen.',requires=['surf'],source=src('CinnabarIsland_PokemonLab_ExperimentRoom','givemon SPECIES_'+symbol),choice='fossil' if symbol!='AERODACTYL' else None,choiceValue=sym[symbol])
mon('TOGEPI','FiveIsland_WaterLabyrinth','egg',5,'Mit einem Pokémon mit maximaler Freundschaft an erster Stelle den Gentleman im Wasserirrgarten ansprechen. Ein freier Platz im Team ist nötig. Das erhaltene Ei ausbrüten.',requires=['rainbow','surf'],source=src('FiveIsland_WaterLabyrinth','giveegg SPECIES_TOGEPI'))
# Fixed battles. The ghost Marowak in Pokémon Tower is intentionally absent: it cannot be caught.
for symbol,name,level,detail,req in [
 ('SNORLAX','Route12',30,'Mit der Pokéflöte wecken. Einmalige Begegnung; zweites Relaxo auf Route 16.',['flute']),
 ('SNORLAX','Route16',30,'Mit der Pokéflöte wecken. Einmalige Begegnung; zweites Relaxo auf Route 12.',['flute']),
 ('ELECTRODE','PowerPlant',34,'Zwei vermeintliche Itembälle sind feste Lektrobal-Begegnungen auf Level 34.',['surf']),
 ('ZAPDOS','PowerPlant',50,'Am Ende des Kraftwerks. Vor dem Ansprechen speichern; einmaliger legendärer Fang.',['surf']),
 ('ARTICUNO','SeafoamIslands_B4F',50,'Stärkesteine in die Strömungslöcher schieben, dann zum unteren Becken surfen.',['surf','strength']),
 ('MOLTRES','MtEmber_Summit',50,'Am Gipfel des Glutbergs. Stärkesteine verschieben; vor dem Ansprechen speichern.',['tri','surf','strength']),
 ('MEWTWO','CeruleanCave_B1F',70,'Ganz unten in der Azuria-Höhle. Eintritt erst nach Liga, Nationaldex und vollständiger Reparatur von Celios Netzwerkmaschine mit Rubin UND Saphir.',['network','surf']),
 ('HYPNO','ThreeIsland_BerryForest',30,'Während der Rettung von Irrma im Beerenforst. Einmalige Begegnung.',['tri'])]:
 mon(symbol,name,'static',level,detail,requires=req,source=src(name,'setwildbattle SPECIES_'+symbol))
for symbol,name,ticket,level in [('LUGIA','NavelRock_Base','Geheimticket',70),('HO_OH','NavelRock_Summit','Geheimticket',70),('DEOXYS','BirthIsland_Exterior','Auroraticket',30)]:
 mon(symbol,name,'event',level,f'Historisches Verteilungs-Event: {ticket} erforderlich. Ohne damals erhaltenes Ticket auf regulärem Weg nicht erreichbar. Vor dem Kampf speichern.',requires=['event'],historicalEvent=True,source=src(name,'seteventmon SPECIES_'+symbol))
for symbol,starter in [('ENTEI','BULBASAUR'),('SUICUNE','CHARMANDER'),('RAIKOU','SQUIRTLE')]:
 mon(symbol,'Route1','roamer',50,'Nach vollständiger Reparatur von Celios Netzwerkmaschine zieht genau eines der drei Raubkatzen-Pokémon durch die Kanto-Routen. Es hängt vom gewählten Starter ab. Nach der ersten Sichtung im Pokédex verfolgen. In FRLG können Raikou/Entei durch Brüller dauerhaft verschwinden; vorher sichern und Flucht zuverlässig verhindern.',requires=['network'],choice='starter',choiceValue=sym[starter],source=src('src/roamer.c','case SPECIES_'+starter if starter!='SQUIRTLE' else 'a = SPECIES_RAIKOU'))
# Game Corner prizes, source-preprocessed facts.
prizes={'firered':[('ABRA',180,9),('CLEFAIRY',500,8),('DRATINI',2800,18),('SCYTHER',5500,25),('PORYGON',9999,26)],'leafgreen':[('ABRA',120,7),('CLEFAIRY',750,12),('PINSIR',2500,18),('DRATINI',4600,24),('PORYGON',6500,18)]}
for ed,rows in prizes.items():
 for symbol,cost,level in rows:mon(symbol,'CeladonCity_GameCorner_PrizeRoom','prize',level,f'In der Spielhalle für {cost:,} Münzen eintauschen. Münzkorb aus dem Restaurant in Prismania City holen.'.replace(',','.'),editions=[ed],coins=cost,repeatable=True,source=src('CeladonCity_GameCorner_PrizeRoom','setvar VAR_TEMP_1, SPECIES_'+symbol))
# In-game trades, including edition-dependent demands/results and carried items.
trades=[
 ('MR_MIME','ABRA','Route2_House',None),('JYNX','POLIWHIRL','CeruleanCity_House3','ITEM_FAB_MAIL'),('FARFETCHD','SPEAROW','VermilionCity_House2','ITEM_STICK'),
 ('ELECTRODE','RAICHU','CinnabarIsland_PokemonLab_Lounge',None),('TANGELA','VENONAT','CinnabarIsland_PokemonLab_Lounge','ITEM_STARDUST'),('SEEL','PONYTA','CinnabarIsland_PokemonLab_ExperimentRoom',None)]
for ed in ['firered','leafgreen']:
 rows=trades+[(('NIDORAN_F' if ed=='firered' else 'NIDORAN_M'),('NIDORAN_M' if ed=='firered' else 'NIDORAN_F'),'UndergroundPath_NorthEntrance','ITEM_TINY_MUSHROOM'),(('NIDORINA' if ed=='firered' else 'NIDORINO'),('NIDORINO' if ed=='firered' else 'NIDORINA'),'Route11_EastEntrance_2F',None),('LICKITUNG',('GOLDUCK' if ed=='firered' else 'SLOWBRO'),'Route18_EastEntrance_2F',None)]
 for symbol,want,name,held in rows:
  mon(symbol,name,'trade',None,'NPC-Tausch: das angegebene Tausch-Pokémon abgeben. Das erhaltene Pokémon hat dasselbe Level wie das abgegebene.',editions=[ed],tradeFor=sym[want],heldItem=held,source=src('src/data/ingame_trades.h','.species = SPECIES_'+symbol))
  if held:item(held,name,'Getragenes Item des vom NPC eingetauschten Pokémon. Nach dem Tausch im Team abnehmen.',editions=[ed],source=src('src/data/ingame_trades.h','.heldItem = '+held),requires=['npc-trade'])
# Dynamic NPC reward branches: do not flatten branch conditions into unrelated item grants.
for tm,drink in [('TM16','Tafelwasser'),('TM20','Sprudel'),('TM33','Limonade')]:
 item('ITEM_'+tm,'CeladonCity_DepartmentStore_Roof',f'Dem Mädchen auf dem Dach einmal {drink} schenken. Jede der drei Getränkesorten gibt eine andere TM.',source=src('CeladonCity_DepartmentStore_Roof','setvar VAR_0x8009, ITEM_'+tm),xy=(10,4))
# Coordinates from actual object records, not guessed. Fix above against matching script.
roof=json.loads((S/'data/maps/CeladonCity_DepartmentStore_Roof/map.json').read_text())
for e in roof['object_events']:
 if 'Thirsty' in e.get('script','') or 'LittleGirl' in e.get('script',''):
  for r in O['items']:
   if r['map']==mapid('CeladonCity_DepartmentStore_Roof') and r['kind']=='person':r['x']=e['x'];r['y']=e['y']
for it,cost in [('TM13',4000),('TM23',3500),('TM24',4000),('TM30',4500),('TM35',4000),('SMOKE_BALL',800),('MIRACLE_SEED',1000),('CHARCOAL',1000),('MYSTIC_WATER',1000),('YELLOW_FLUTE',1600)]:
 item('ITEM_'+it,'CeladonCity_GameCorner_PrizeRoom',f'Als Preis für {cost} Münzen eintauschen. Münzkorb benötigt.',kind='exchange',repeatable=True,source=src('CeladonCity_GameCorner_PrizeRoom','setvar VAR_TEMP_1, ITEM_'+it))
for it in ['ENERGY_POWDER','ENERGY_ROOT','HEAL_POWDER','REVIVAL_HERB','PROTEIN','IRON','CARBOS','CALCIUM','ZINC','HP_UP','PP_UP']:
 text=(S/'data/maps/CeruleanCity_House5/scripts.inc').read_text();m=re.search(r'setvar VAR_0x8008, ITEM_'+it+r'\n\s*setvar VAR_0x8009, (\d+)',text);cost=int(m[1]) if m else None
 item('ITEM_'+it,'CeruleanCity_House5','Beim Beerenpulver-Mann gegen '+(str(cost)+' Einheiten ' if cost else '')+'Beerenpulver tauschen. Pulver im drahtlosen Beerensammler mit Mitspielern erzeugen.',kind='exchange',repeatable=True,requires=['wireless'],source=src('CeruleanCity_House5','setvar VAR_0x8008, ITEM_'+it),xy=(7,4))
for it in ['LUXURY_BALL','BIG_PEARL','PEARL','STARDUST','STAR_PIECE','NUGGET','RARE_CANDY']:
 item('ITEM_'+it,'FiveIsland_ResortGorgeous_House','Selphy zunächst aus der Verlorenen Höhle retten. Danach das gewünschte Pokémon innerhalb von 250 Schritten vorzeigen. Wiederholbare Zufallsbelohnung: Luxusball 70 %, jeder der sechs anderen Preise 5 %.',repeatable=True,requires=['rainbow','surf'],source=src('src/field_specials.c','sResortGorgeousDeluxeRewards'),xy=None)
# Wonder News berries are historical distribution rewards, kept separate from ordinary collectibles.
berries=['CHERI','CHESTO','PECHA','RAWST','ASPEAR','LEPPA','ORAN','PERSIM','LUM','SITRUS','FIGY','WIKI','MAGO','AGUAV','IAPAPA','RAZZ','BLUK','NANAB','WEPEAR','PINAP','POMEG','KELPSY','QUALOT','HONDEW','GREPA','TAMATO','CORNN','MAGOST','RABUTA','NOMEL']
for it in berries:
 item('ITEM_'+it+'_BERRY','CeruleanCity_House4','Historische Wundernews-/Geheimgeschehen-Belohnung. Empfangene oder weitergegebene Wundernews nötig; je nach Nachricht zufällige Beere, 1 oder 4 Stück. Kein normaler Fund im Durchspielen.',repeatable=True,requires=['event'],source=src('src/wonder_news.c','data->berry ='),xy=None)
# Standard Trainer Tower challenge rewards (the first floor of each local set chooses the prize).
for it,challenge in [('UP_GRADE','Einzel'),('DRAGON_SCALE','Doppel'),('METAL_COAT','K.O.'),('KINGS_ROCK','Gemischt')]:
 item('ITEM_'+it,'TrainerTower_Roof',f'Nach Abschluss des {challenge}-Modus auf dem Dach beim Besitzer abholen. Reguläre lokale Turm-Herausforderung, keine e-Reader-Karte nötig.',requires=['rainbow','surf'],repeatable=False,source=src('src/trainer_tower_sets.c','.prize = TTPRIZE_'+it))
# Wireless Joyful Game Corner rewards are optional multiplayer, kept out of ordinary ground finds.
for it in ['LEPPA','LUM','SITRUS','FIGY','WIKI','MAGO','AGUAV','IAPAPA']:
 item('ITEM_'+it+'_BERRY','TwoIsland_JoyfulGameCorner','Pokémon-Sprung mit drahtlosen Mitspielern: ab 5.000 Punkten eine zufällige Preisbeere. Mengenstaffel: 5.000→1, 8.000→2, 12.000→3, 16.000→4, 20.000→5 Stück.',requires=['tri','wireless'],repeatable=True,source=src('src/pokemon_jump.c','sPrizeItems[]'))
for it in ['RAZZ','BLUK','NANAB','WEPEAR','PINAP','POMEG','KELPSY','QUALOT','HONDEW','GREPA','TAMATO','CORNN','MAGOST','RABUTA','NOMEL','SPELON','PAMTRE','WATMEL','DURIN','BELUE']:
 item('ITEM_'+it+'_BERRY','TwoIsland_JoyfulGameCorner','Beerenlese mit drahtlosen Mitspielern. Mögliche Preisbeere; die Auswahl hängt von der erreichten Leistung ab. Ein Dodri wird benötigt.',requires=['tri','wireless'],repeatable=True,source=src('src/dodrio_berry_picking.c','sPrizeBerryIds[][10]'))
# Remove duplicate alias/fallback rewards (physical map binding is the authority).
seen=set()
for i in D['items']:
 if i['kind']!='person':continue
 key=(i['edition'],i['map'],i['item'])
 if key in seen:O['removeItemIds'].append({'edition':i['edition'],'id':i['id']})
 seen.add(key)
 if i['map']=='MAP_MT_EMBER_RUBY_PATH_B3F' and i['item']=='ITEM_RUBY':O['removeItemIds'].append({'edition':i['edition'],'id':i['id']})
# Full source-derived shop inventories, price handled by item table if parent chooses to expose.
O['shops']=[]
for f in (S/'data/maps').glob('*/scripts.inc'):
 text=f.read_text();items=re.findall(r'^\s*\.2byte (ITEM_\w+)',text,re.M)
 for it in sorted(set(items)-{'ITEM_NONE'}):
  if f.parent.name in [v['name'] for v in M.values()]:O['shops'].append({'map':mapid(f.parent.name),'item':it,'source':src(f.parent.name,'.2byte '+it)})
O['notes']=[
 'Original raw encounter method names include grass, surf, oldrod, goodrod, superrod, smash. No day/night encounter schedule in FRLG.',
 'Special Pokémon list excludes uncatchable Pokémon Tower ghost Marowak. Includes eight ordinary fixed battle species and historical event Pokémon separately.',
 'Roamer starts only after Celio network repaired: OneIsland_PokemonCenter_1F/scripts.inc special InitRoamer at line280. Starter Bulbasaur→Entei, Charmander→Suicune, Squirtle→Raikou.',
 'FRLG DOES have HM07 Waterfall (Kaskade): ground pickup MAP_FOUR_ISLAND_ICEFALL_CAVE_1F at (12,16), item_ball_scripts.inc line618. Needed for Lorelei rescue in Icefall Cave rear.',
 'NPC coordinates with x/y null are intentionally unresolved, not fabricated. Person sprites move, so markers indicate their base positions.',
 'Original extraction raw conditions arrays are control-flow evidence including negative checks; they are not conjunctive requirements.',
 'Physical-source Ruby binding MAP_MT_EMBER_RUBY_PATH_B5F is correct; fallback attached same script label to folder B3F incorrectly. Remove fallback.',
 'Joyful Game Corner wireless minigame prize pools and standard Trainer Tower rewards are included. Wild held-item/Pickup farming are mechanics rather than fixed route pickups; not fully enumerated here.'
]
# Flag source-dependent conditions to aid owner curation.
notes={
 'MAP_ROUTE2_EAST_BUILDING':'Eichs Assistent: mindestens 10 verschiedene Pokémon-Arten gefangen. Zerschneider nötig, um regulär die östliche Seite zu erreichen (alternativ über Digdas Höhle).',
 'MAP_ROUTE11_EAST_ENTRANCE_2F':'Eichs Assistent: mindestens 30 verschiedene Pokémon-Arten gefangen.',
 'MAP_ROUTE10_POKEMON_CENTER_1F':'Eichs Assistent: mindestens 20 verschiedene Pokémon-Arten gefangen.',
 'MAP_ROUTE16_NORTH_ENTRANCE_2F':'Eichs Assistent: mindestens 40 verschiedene Pokémon-Arten gefangen.',
 'MAP_ROUTE15_WEST_ENTRANCE_2F':'Eichs Assistent: mindestens 50 verschiedene Pokémon-Arten gefangen.',
 'MAP_PEWTER_CITY_MUSEUM_1F':'Durch den seitlichen Museumseingang mit Zerschneider zum Wissenschaftler gehen.',
 'MAP_FUCHSIA_CITY_WARDENS_HOUSE':'Goldzähne aus der Safari-Zone zum Wärter zurückbringen.',
 'MAP_ROUTE12_FISHING_HOUSE':'Superangel beim ersten Gespräch; ein Karpador vorzeigen ergibt beim ersten Mal einen Netzball, später für einen neuen Größenrekord.',
 'MAP_SIX_ISLAND_WATER_PATH_HOUSE1':'Ein Skaraborn vorzeigen: beim ersten Mal gibt es einen Nestball, später für jeden neuen Größenrekord.',
 'MAP_THREE_ISLAND_DUNSPARCE_TUNNEL':'Nach der Liga in den nun fertig gegrabenen Tunnel zurückkehren und den Goldsucher ansprechen.',
 'MAP_FIVE_ISLAND_MEMORIAL_PILLAR':'Limonade beim Gedenkstein für das verstorbene Onix ablegen; danach TM42 erhalten.',
 'MAP_MT_MOON_B2F':'Einmalige Wahl zwischen Helixfossil und Domfossil; das andere bleibt in diesem Spielstand zurück.',
 'MAP_ROUTE16_HOUSE':'Mit Zerschneider den nördlichen Weg von Route 16 zum Haus erreichen.',
 'MAP_SILPH_CO_11F':'Nach dem Sieg über Giovanni mit dem Präsidenten sprechen.',
 'MAP_SAFARI_ZONE_SECRET_HOUSE':'Innerhalb des Schrittlimits das Geheime Haus in der Safari-Zone erreichen.',
 'MAP_SSANNE_CAPTAINS_OFFICE':'Dem Kapitän nach dem Rivalenkampf helfen. Sobald du das Schiff mit VM01 verlässt, fährt es ab; übrige Schiffsfunde vorher mitnehmen.'
}
O['rewardNotes']=notes
(R/'frlg-supplement.json').write_text(json.dumps(O,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'pokemon':len(O['pokemon']),'items':len(O['items']),'shops':len(O['shops']),'remove':len(O['removeItemIds'])}))
