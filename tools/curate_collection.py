"""Apply route order, access rules and German presentation to extracted facts."""
import json
import gzip
import base64
import re
import sys
from pathlib import Path
from collections import defaultdict

BASE=Path(sys.argv[1])
raw=json.loads((BASE/'collection-raw.json').read_text())
source=json.loads((BASE/'pret-source.json').read_text())['files']
stats=json.loads((BASE/'base-stats.json').read_text())

order='NEW_BARK_TOWN ROUTE_29 ROUTE_46 CHERRYGROVE_CITY ROUTE_30 ROUTE_31 DARK_CAVE VIOLET_CITY SPROUT_TOWER RUINS_OF_ALPH ROUTE_32 UNION_CAVE ROUTE_33 AZALEA_TOWN SLOWPOKE_WELL ILEX_FOREST ROUTE_34 GOLDENROD_CITY RADIO_TOWER ROUTE_35 NATIONAL_PARK ROUTE_36 ROUTE_37 ECRUTEAK_CITY BURNED_TOWER TIN_TOWER ROUTE_38 ROUTE_39 OLIVINE_CITY LIGHTHOUSE ROUTE_40 ROUTE_41 CIANWOOD_CITY ROUTE_42 MT_MORTAR MAHOGANY_TOWN ROUTE_43 LAKE_OF_RAGE WHIRL_ISLANDS ROUTE_44 ICE_PATH BLACKTHORN_CITY DRAGONS_DEN ROUTE_45 ROUTE_27 TOHJO_FALLS ROUTE_26 VICTORY_ROAD ROUTE_23 INDIGO_PLATEAU FAST_SHIP VERMILION_CITY ROUTE_6 SAFFRON_CITY ROUTE_8 LAVENDER_TOWN LAV_RADIO_TOWER ROCK_TUNNEL ROUTE_10 POWER_PLANT ROUTE_9 CERULEAN_CITY ROUTE_24 ROUTE_25 ROUTE_5 ROUTE_7 CELADON_CITY ROUTE_16 ROUTE_17 ROUTE_18 FUCHSIA_CITY ROUTE_15 ROUTE_14 ROUTE_13 ROUTE_12 ROUTE_11 DIGLETTS_CAVE ROUTE_2 PEWTER_CITY ROUTE_3 MT_MOON ROUTE_4 VIRIDIAN_CITY ROUTE_1 PALLET_TOWN ROUTE_21 CINNABAR_ISLAND ROUTE_20 SEAFOAM_ISLANDS ROUTE_19 ROUTE_22 ROUTE_28 SILVER_CAVE UNDERGROUND_PATH'.split()
labels=dict(zip('NEW_BARK_TOWN CHERRYGROVE_CITY DARK_CAVE VIOLET_CITY SPROUT_TOWER RUINS_OF_ALPH UNION_CAVE AZALEA_TOWN SLOWPOKE_WELL ILEX_FOREST GOLDENROD_CITY RADIO_TOWER NATIONAL_PARK ECRUTEAK_CITY BURNED_TOWER TIN_TOWER OLIVINE_CITY LIGHTHOUSE CIANWOOD_CITY MT_MORTAR MAHOGANY_TOWN LAKE_OF_RAGE WHIRL_ISLANDS ICE_PATH BLACKTHORN_CITY DRAGONS_DEN TOHJO_FALLS VICTORY_ROAD INDIGO_PLATEAU FAST_SHIP VERMILION_CITY SAFFRON_CITY LAVENDER_TOWN LAV_RADIO_TOWER ROCK_TUNNEL POWER_PLANT CERULEAN_CITY CELADON_CITY FUCHSIA_CITY DIGLETTS_CAVE PEWTER_CITY MT_MOON VIRIDIAN_CITY PALLET_TOWN CINNABAR_ISLAND SEAFOAM_ISLANDS SILVER_CAVE UNDERGROUND_PATH'.split(),
 ['Neuborkia','Rosalia City','Dunkelhöhle','Viola City','Knofensa-Turm','Alph-Ruinen','Einheitstunnel','Azalea City','Flegmon-Brunnen','Steineichenwald','Dukatia City','Radioturm Dukatia','Nationalpark','Teak City','Turmruine','Zinnturm','Oliviana City','Leuchtturm','Anemonia City','Kesselberg','Mahagonia City','See des Zorns','Strudelinseln','Eispfad','Ebenholz City','Drachenhöhle','Tohjo-Fälle','Siegesstraße','Indigo-Plateau','M.S. Aqua','Orania City','Saffronia City','Lavandia','Radioturm Lavandia','Felstunnel','Kraftwerk','Azuria City','Prismania City','Fuchsania City','Digda-Höhle','Marmoria City','Mondberg','Vertania City','Alabastia','Zinnoberinsel','Seeschauminseln','Silberberg','Kanto-Unterführung']))
def stage(place):return order.index(place)*10
def flag(id,label,place,steps=None):return dict(id=id,label=label,stage=stage(place),steps=steps or [])
flags=[
 flag('balls','Pokébälle erhalten','ROUTE_29',['errand-balls']),flag('falk','Flügelorden erhalten','VIOLET_CITY',['viola-gym']),
 flag('oldrod','Angel erhalten','ROUTE_32',['union-rod']),flag('well','Flegmon-Brunnen befreit','AZALEA_TOWN',['azalea-rockets']),
 flag('cut','Zerschneider + Insektorden','ILEX_FOREST',['ilex-cut']),flag('headbutt','Kopfnuss erhalten','ILEX_FOREST',['ilex-headbutt']),
 flag('plain','Basisorden erhalten','GOLDENROD_CITY',['golden-gym']),flag('bike','Fahrrad erhalten','GOLDENROD_CITY',['golden-bike']),flag('bottle','Schiggykanne erhalten','GOLDENROD_CITY',['golden-bottle']),
 flag('smash','Zertrümmerer erhalten','ROUTE_36',['sudo-smash']),flag('sudo','Mogelbaum-Begegnung abgeschlossen','ROUTE_36',['sudo-water']),
 flag('surf','Surfer + Phantomorden','ECRUTEAK_CITY',['teak-surf','teak-gym']),flag('bill','Bill im Pokémon-Center getroffen','ECRUTEAK_CITY',['teak-bill']),flag('roam','Legendäre aus der Turmruine freigelassen','BURNED_TOWER',['teak-tower']),
 flag('strength','Stärke + Basisorden','OLIVINE_CITY',['olive-strength','golden-gym']),flag('goodrod','Profiangel erhalten','OLIVINE_CITY',['olive-goodrod']),
 flag('lighthouse','Jasmin im Leuchtturm getroffen','LIGHTHOUSE',['olive-light']),flag('chuck','Faustorden erhalten','CIANWOOD_CITY',['cian-gym']),flag('medicine','Geheimtrank abgeholt','CIANWOOD_CITY',['cian-potion']),
 flag('lake','Rotes Garados besiegt/gefangen und Siegfried zugesagt','LAKE_OF_RAGE',['rage-gyarados','rage-lance']),flag('rocket','Rocket-Versteck abgeschaltet','LAKE_OF_RAGE',['hideout-power']),
 flag('whirl','Whirlpool + Eisorden','WHIRL_ISLANDS',['hideout-whirl','hideout-gym']),flag('radio','Radioturm von Team Rocket befreit','WHIRL_ISLANDS',['radio-finish']),
 flag('rising','Drachenorden erhalten','DRAGONS_DEN',['blackthorn-fang']),flag('waterfall','Kaskade + Drachenorden','DRAGONS_DEN',['ice-waterfall','blackthorn-fang']),
 flag('league','Pokémon-Liga bestanden','INDIGO_PLATEAU',['elite-hall']),flag('kanto','In Kanto angekommen','VERMILION_CITY',['aqua-arrive']),
 flag('power','Spule zum Kraftwerk zurückgebracht','ROUTE_25',['power-return']),flag('radioKanto','Zusatzmodul aus Lavandia erhalten','ROUTE_25',['lavender-card']),
 flag('superrod','Superangel erhalten','ROUTE_12',['fuchsia-superrod']),flag('allbadges','Alle 16 Orden + Freigabe durch Professor Eich','ROUTE_28',['silver-oak']),
 flag('mail','Brief-Porenta-Auftrag: Habitak mit Brief erhalten','ROUTE_35'),flag('maildone','Brief auf Route 31 abgegeben','ROUTE_35'),flag('moo','Krankes Miltank mit Beeren geheilt','ROUTE_39'),
 flag('togepi','Togepi geschlüpft und Professor Lind gezeigt','VIOLET_CITY'),flag('part','Spule in Azuria aufgesammelt','ROUTE_24'),flag('copycat','Nachahmerin nach der Poképuppe gefragt','ROUTE_25'),flag('doll','Poképuppe aus dem Fanclub erhalten','ROUTE_25')
]
# One combined flag confirms equipment and its field-use badge. Manual flags coexist
# with story checklists; they are never inferred merely from visiting a location.
flags += [flag('errand','Rätsel-Ei bei Professor Lind abgegeben','NEW_BARK_TOWN',['errand-deliver']),flag('alph','Erstes Alph-Bildrätsel gelöst','RUINS_OF_ALPH',['alph-puzzle']),flag('clair','Sandra in der Arena besiegt','BLACKTHORN_CITY',['blackthorn-gym']),flag('radioOccupied','7 Johto-Orden: Radioturm besetzt','WHIRL_ISLANDS',['viola-gym','azalea-gym','golden-gym','teak-gym','cian-gym','jasmine-gym','hideout-gym']),flag('partLead','Rocket auf Route 24 besiegt und Versteck erfahren','ROUTE_24',['power-bridge'])]
for area,species_label in [('ROUTE_35','Yanma'),('ROUTE_38','Snubbull'),('DARK_CAVE','Dummisel'),('MT_MORTAR','Marill'),('ROUTE_32','Baldorfish'),('ROUTE_44','Remoraid')]: flags.append(flag('swarm_'+area.lower(),'Aktive Schwarmmeldung: '+species_label,area))
flags += [flag('goldWing','Buntschwinge erhalten','WHIRL_ISLANDS'),flag('silverWing','Silberflügel erhalten','WHIRL_ISLANDS')]
flags_by={x['id']:x for x in flags}
flags_by['goldWing']['stepsByEdition']={'gold':['radio-goldwing'],'silver':['pewter-silverwing']}
flags_by['silverWing']['stepsByEdition']={'gold':['pewter-goldwing'],'silver':['radio-silverwing']}
flags_by['goldWing']['editionStages']={'gold':stage('WHIRL_ISLANDS'),'silver':stage('PEWTER_CITY')}
flags_by['silverWing']['editionStages']={'gold':stage('PEWTER_CITY'),'silver':stage('WHIRL_ISLANDS')}
flags_by['mail']['label']='Brief-Auftrag: Habitak mit Brief erhalten'
for id,label,place,task in [('hive','Insektorden erhalten','AZALEA_TOWN','azalea-gym'),('fog','Phantomorden erhalten','ECRUTEAK_CITY','teak-gym'),('mineral','Stahlorden erhalten','OLIVINE_CITY','jasmine-gym'),('glacier','Eisorden erhalten','MAHOGANY_TOWN','hideout-gym'),('rainbow','Farborden erhalten','CELADON_CITY','celadon-gym'),('soul','Seelenorden erhalten','FUCHSIA_CITY','fuchsia-gym')]:
    f=flag(id,label,place,[task]);flags.append(f);flags_by[id]=f

manual_names={'BERRY':'Beere','GOLD_BERRY':'Goldbeere','PSNCUREBERRY':'Gegengiftbeere','PRZCUREBERRY':'Antiparbeere','MYSTERYBERRY':'Geheimbeere','ICE_BERRY':'Eisbeere','MINT_BERRY':'Minzbeere','BURNT_BERRY':'Brandbeere','BITTER_BERRY':'Bitterbeere','MIRACLE_SEED':'Wundersaat','PINK_BOW':'Rosa Band','POLKADOT_BOW':'Punkt-Band','BLACKBELT_I':'Schwarzgurt','BLACKGLASSES':'Schattenglas','NEVERMELTICE':'Ewiges Eis','SECRETPOTION':'Geheimtrank','SQUIRTBOTTLE':'Schiggykanne','RED_SCALE':'Rote Haut','S_S_TICKET':'Bootsticket','MACHINE_PART':'Spule','LOST_ITEM':'Fundsache (Poképuppe)','PASS':'Fahrschein','CARD_KEY':'Schlüsselkarte','BASEMENT_KEY':'Kelleröffner','ITEMFINDER':'Detektor','OLD_ROD':'Angel','GOOD_ROD':'Profiangel','SUPER_ROD':'Superangel','BICYCLE':'Fahrrad','COIN_CASE':'Münzkorb','MYSTERY_EGG':'Rätsel-Ei','SILVER_WING':'Silberflügel','RAINBOW_WING':'Buntschwinge','EXP_SHARE':'EP-Teiler','PARLYZ_HEAL':'Para-Heiler','ELIXER':'Elixier','MAX_ELIXER':'Top-Elixier','GUARD_SPEC':'Megablock','UP_GRADE':'Up-Grade','THUNDERSTONE':'Donnerstein','WHT_APRICORN':'Aprikoko Weiß','RED_APRICORN':'Aprikoko Rot','BLU_APRICORN':'Aprikoko Blau','BLK_APRICORN':'Aprikoko Schwarz','PNK_APRICORN':'Aprikoko Pink','GRN_APRICORN':'Aprikoko Grün','YLW_APRICORN':'Aprikoko Gelb','RAGECANDYBAR':'Wutkeks','FLOWER_MAIL':'Blumenbrief','SURF_MAIL':'Surferbrief','LITEBLUEMAIL':'Cyanbrief','PORTRAITMAIL':'Portraitbrief','LOVELY_MAIL':'Herzbrief','EON_MAIL':'Evolibrief','MORPH_MAIL':'Morphbrief','MUSIC_MAIL':'Musikbrief','MIRAGE_MAIL':'Trugbrief','BLUESKY_MAIL':'Luftbrief'}
tm_names=['Dynamikwucht','Kopfnuss','Fluch','Walzer','Brüller','Toxin','Blitzkanone','Zertrümmerer','Psycho-Plus','Kraftreserve','Sonnentag','Lockduft','Schnarcher','Blizzard','Hyperstrahl','Eissturm','Schutzschild','Regentanz','Gigasauger','Ausdauer','Frustration','Solarstrahl','Eisenschweif','Drachenodem','Donner','Erdbeben','Rückkehr','Schaufler','Psychokinese','Spukball','Lehmschelle','Doppelteam','Eishieb','Angeberei','Schlafrede','Matschbombe','Sandsturm','Feuersturm','Sternschauer','Einigler','Donnerschlag','Traumfresser','Scanner','Erholung','Anziehung','Raub','Stahlflügel','Feuerschlag','Zornklinge','Nachtmahr']
tms=re.findall(r'^\s*add_tm\s+(\w+)',source['constants/item_constants.asm'],re.M)
for i,m in enumerate(tms):manual_names['TM_'+m]=f'TM{i+1:02d} {tm_names[i]}'
for i,(m,n) in enumerate(zip(['CUT','FLY','SURF','STRENGTH','FLASH','WHIRLPOOL','WATERFALL'],['Zerschneider','Fliegen','Surfer','Stärke','Blitz','Whirlpool','Kaskade']),1):manual_names['HM_'+m]=f'VM{i:02d} {n}'
def item_name(symbol):
    if symbol in manual_names:return manual_names[symbol]
    slug=symbol.lower().replace('_','-')
    alias={'soft-sand':'soft-sand','kings-rock':'kings-rock','blackbelt-i':'black-belt','thick-club':'thick-club','sacred-ash':'sacred-ash','silverpowder':'silver-powder','twistedspoon':'twisted-spoon','metalpowder':'metal-powder','brightpowder':'bright-powder','dragon-fang':'dragon-fang','dragon-scale':'dragon-scale','spell-tag':'spell-tag','poison-barb':'poison-barb','up-grade':'upgrade','moomoo-milk':'moomoo-milk'}
    return raw['itemNames'].get(alias.get(slug,slug),symbol.replace('_',' ').title())

locations=[dict(id=k.lower(),key=k,name=labels.get(k,k.replace('ROUTE_','Route ').replace('_',' ').title()),order=i*10,region='johto' if i<order.index('FAST_SHIP') else 'kanto') for i,k in enumerate(order)]
loc_by={l['key']:l for l in locations}
maps=raw['maps']
room_names={'ELMS_LAB':'Professor Linds Labor','MR_POKEMONS_HOUSE':'Haus von Mr. Pokémon','KURTS_HOUSE':'Kurts Haus','CHARCOAL_KILN':'Köhlerhaus','BILLS_FAMILYS_HOUSE':'Bills Elternhaus','BILLS_HOUSE':'Haus von Bills Großvater','MANIAS_HOUSE':'Pottrott-Haus','VIOLET_KYLES_HOUSE':'Tauschhaus: Onix','OLIVINE_TIMS_HOUSE':'Tauschhaus: Voltobal','BLACKTHORN_EMYS_HOUSE':'Tauschhaus: Rizeros','CHERRYGROVE_EVOLUTION_SPEECH_HOUSE':'Haus mit Erklärung zu Entwicklungen','CHERRYGROVE_GYM_SPEECH_HOUSE':'Haus mit Erklärung zu Arenen','CELADON_CAFE':'Restaurant','MOUNT_MORTAR_1F_OUTSIDE':'Eingangsebene / Verbindungsgänge','MOUNT_MORTAR_1F_INSIDE':'Innenbereich der Eingangsebene','MOUNT_MORTAR_2F_INSIDE':'Obergeschoss innen','WHIRL_ISLAND_LUGIA_CHAMBER':'Lugias Kammer','DARK_CAVE_VIOLET_ENTRANCE':'Eingang von Viola / Route 31','DARK_CAVE_BLACKTHORN_ENTRANCE':'Eingang von Ebenholz / Route 45','RUINS_OF_ALPH_OUTSIDE':'Außenbereich','RUINS_OF_ALPH_INNER_CHAMBER':'Icognito-Kammer','ROUTE_28_STEEL_WING_HOUSE':'Haus mit TM Stahlflügel','ROUTE_27_SANDSTORM_HOUSE':'Haus mit TM Sandsturm'}
for m in maps.values():
    place=m['landmark']; m['location']=place.lower()
    original=re.sub(r'([a-z])([A-Z])',r'\1 \2',m['name'])
    room=room_names.get(m['id'],original)
    floor=re.search(r'_(B?)(\d+)F(?:_|$)',m['id'])
    floor_text=(' · '+(floor[2]+'. UG' if floor[1] else 'EG' if floor[2]=='1' else str(int(floor[2])-1)+'. OG')) if floor else ''
    if floor and m['landmark'] in ['SPROUT_TOWER','BURNED_TOWER','TIN_TOWER','LIGHTHOUSE','RADIO_TOWER','LAV_RADIO_TOWER','UNION_CAVE','SLOWPOKE_WELL','ICE_PATH']:room=floor_text.removeprefix(' · ')
    if 'POKECENTER' in m['id']:room='Pokémon-Center'+floor_text
    elif 'DEPT_STORE' in m['id']:room='Kaufhaus'+(' · Keller' if '_B1F' in m['id'] else floor_text)
    elif m['id'].endswith('_GYM'):room='Pokémon-Arena'
    elif m['id'].endswith('_MART'):room='Pokémon-Supermarkt'
    m['label']=loc_by.get(place,{'name':original})['name']+' · '+room if m['environment'] not in ['TOWN','ROUTE'] else loc_by.get(place,{'name':original})['name']

def map_requirements(m):
    name=m['id']; place=m['landmark'];req=[]
    if place in order and order.index(place)>=order.index('ROUTE_34') and place not in ['DARK_CAVE']:req+=['cut']
    if place in ['ROUTE_40','ROUTE_41','CIANWOOD_CITY','WHIRL_ISLANDS','ROUTE_42','MT_MORTAR','MAHOGANY_TOWN','ROUTE_43','LAKE_OF_RAGE','ROUTE_44','ICE_PATH','BLACKTHORN_CITY','DRAGONS_DEN','ROUTE_45']:req+=['surf']
    if place=='WHIRL_ISLANDS':req+=['whirl']
    if place in ['ROUTE_44','ICE_PATH','BLACKTHORN_CITY','DRAGONS_DEN','ROUTE_45']:req+=['radio']
    if place in ['ROUTE_27','TOHJO_FALLS','ROUTE_26','VICTORY_ROAD','ROUTE_23','INDIGO_PLATEAU']:req+=['surf','rising']
    if place in ['TOHJO_FALLS','ROUTE_26','VICTORY_ROAD','ROUTE_23','INDIGO_PLATEAU']:req+=['waterfall']
    if place in order and order.index(place)>=order.index('FAST_SHIP'):req+=['league']
    if place in ['DIGLETTS_CAVE','ROUTE_2','PEWTER_CITY','ROUTE_3','MT_MOON','ROUTE_4','VIRIDIAN_CITY','ROUTE_1','PALLET_TOWN','ROUTE_21','CINNABAR_ISLAND','ROUTE_20','SEAFOAM_ISLANDS','ROUTE_19','ROUTE_22']:req+=['radioKanto']
    if place in ['SILVER_CAVE','ROUTE_28']:req+=['allbadges']
    if name.startswith('TEAM_ROCKET_BASE'):req+=['lake']
    if name in ['UNION_CAVE_B2F','SLOWPOKE_WELL_B2F']:req+=['surf']
    if name=='SLOWPOKE_WELL_B2F':req+=['strength']
    if name=='DARK_CAVE_BLACKTHORN_ENTRANCE':req+=['surf','smash']
    if name.startswith('DRAGONS_DEN'):req+=['whirl','clair']
    if name.startswith('GOLDENROD_UNDERGROUND_'):req+=['radioOccupied']
    if name=='MOUNT_MORTAR_2F_INSIDE':req+=['surf','waterfall']
    if name.startswith('ICE_PATH_B'):req+=['strength']
    if name in ['SILVER_CAVE_ITEM_ROOMS','SILVER_CAVE_ROOM_2']:req+=['surf','waterfall']
    return sorted(set(req))

def finish(entry):
    m=maps[entry['map']];entry['location']=m['location'];entry['requirements']=sorted(set(map_requirements(m)+entry.get('requirements',[])))
    entry['stage']=max([loc_by.get(m['landmark'],{'order':9999})['order']]+[flags_by[r].get('editionStages',{}).get(entry['edition'],flags_by[r]['stage']) for r in entry['requirements']])
    return entry

encounters=[]
for e in raw['encounters']:
    if e['method']=='headbutt' and maps[e['map']]['landmark'] in ['NEW_BARK_TOWN','VIOLET_CITY','ECRUTEAK_CITY','MAHOGANY_TOWN','BLACKTHORN_CITY']:continue
    e={**e,'requirements':['balls']}
    if e['method'] in ['surf','oldrod','goodrod','superrod','headbutt','smash']:e['requirements'].append(e['method'])
    if e['map']=='RUINS_OF_ALPH_OUTSIDE':e['requirements']+=['surf']+(['strength'] if e['species']==235 else [])
    if e['method']=='contest':e['weekdays']=[2,4,6]
    if e['map']=='RUINS_OF_ALPH_INNER_CHAMBER':e['requirements'].append('alph')
    if 'Schwarm' in e['note']:
        e['requirements'].append('swarm_'+maps[e['map']]['landmark'].lower());e['special']='Schwarmmeldung des passenden Trainers nötig; Telefonnummer registrieren.'
    if e['map'].startswith('TIN_TOWER_') and e['map']!='TIN_TOWER_1F':e['requirements']+=['goldWing']
    encounters.append(finish(e))

def special(mapid,id,method,requirements=None,note='',editions=('gold','silver'),weekdays=None):
    for ed in editions:
        e=dict(map=mapid,species=id,method=method,time='all',levels=[],note=note,edition=ed,requirements=requirements or [])
        if weekdays:e['weekdays']=weekdays
        encounters.append(finish(e))
for id in [152,155,158]:special('ELMS_LAB',id,'starter',note='Wähle genau einen Starter. Die anderen beiden brauchst du durch Tausch. Nur mit demselben Ausgangs-Starter züchtbar.')
special('VIOLET_POKECENTER_1F',175,'egg',['falk'],'Togepi-Ei vom Assistenten; freien Platz im Team lassen und ausbrüten.')
special('BILLS_FAMILYS_HOUSE',133,'gift',['bill'],'Nach dem Treffen mit Bill in Teak zu seinem Haus in Dukatia zurückkehren.')
special('MANIAS_HOUSE',213,'gift',note='Pottrott wird zur Aufbewahrung überlassen; freien Teamplatz mitbringen.')
special('MOUNT_MORTAR_B1F',236,'gift',['surf','waterfall','strength'],'Karate-Meister besiegen; einen freien Platz für Rabauz im Team lassen.')
special('ROUTE_35_GOLDENROD_GATE',21,'gift',note='Habitak mit Brief für den Mann auf Route 31. Für die Abgabe verschwindet das übergebene Pokémon aus dem Team.')
for id in [63,147]:special('GOLDENROD_GAME_CORNER',id,'prize',note='In der Spielhalle mit Münzen eintauschen; Münzkorb benötigt.')
special('GOLDENROD_GAME_CORNER',23,'prize',note='Spielhallenpreis nur in Gold; Münzkorb und Münzen benötigt.',editions=['gold'])
special('GOLDENROD_GAME_CORNER',27,'prize',note='Spielhallenpreis nur in Silber; Münzkorb und Münzen benötigt.',editions=['silver'])
for id in [122,133,137]:special('CELADON_GAME_CORNER_PRIZE_ROOM',id,'prize',note='Münzpreis in der Spielhalle von Prismania.')
special('UNION_CAVE_B2F',131,'static',['surf'],'Lapras erscheint freitags im untersten Stockwerk.',weekdays=[5])
special('ROUTE_36',185,'static',['bottle'],'Einmalig: vor dem Gießen im Spiel speichern.')
special('LAKE_OF_RAGE',130,'static',['surf'],'Rotes Garados: einmalige Begegnung auf dem See.')
special('VERMILION_CITY',143,'static',['radioKanto'],'Pokéflöten-Sender einschalten und Relaxo ansprechen. Vorher im Spiel speichern.')
special('TIN_TOWER_ROOF',250,'static',['goldWing'], 'Ho-Oh mit Buntschwinge; in Gold Level 40.',editions=['gold'])
special('TIN_TOWER_ROOF',250,'static',['goldWing'], 'Buntschwinge vom alten Mann in Marmoria; Ho-Oh in Silber Level 70.',editions=['silver'])
special('WHIRL_ISLAND_LUGIA_CHAMBER',249,'static',['silverWing'],'Silberflügel aus Marmoria; Lugia in Gold Level 70.',editions=['gold'])
special('WHIRL_ISLAND_LUGIA_CHAMBER',249,'static',['silverWing'],'Silberflügel aus dem Radioturm; Lugia in Silber Level 40.',editions=['silver'])
for id in [243,244,245]:special('BURNED_TOWER_B1F',id,'roaming',['balls','roam'],'Nach der Freilassung NICHT im Turm fangbar: wandert durch Johtos Grasrouten. Pokédex-Ortung nach der ersten Begegnung; flüchtet schnell.')
for e in raw['specials']:
    if e['symbol'] in ['ELECTRODE','VOLTORB','GEODUDE','KOFFING'] and e['method']=='loadwildmon':special(e['map'],next(s['id'] for s in raw['species'].values() if s['symbol']==e['symbol']),'static',['lake'], 'Begegnung im Rocket-Versteck; Speichern vor einmaligen Generator-Kämpfen.',editions=[e['edition']])
trades=[('GOLDENROD_DEPT_STORE_5F',66,96,'Traumato gegen Machollo.'),('VIOLET_KYLES_HOUSE',95,69,'Knofensa gegen Onix.'),('OLIVINE_TIMS_HOUSE',100,98,'Krabby gegen Voltobal.'),('BLACKTHORN_EMYS_HOUSE',112,148,'Weibliches Dragonir gegen Rizeros.'),('PEWTER_POKECENTER_1F',78,44,'Duflor gegen Gallopa.'),('ROUTE_14',142,113,'Chaneira gegen Aerodactyl.')]
for mapid,id,offer,note in trades:
    if mapid not in maps:raise ValueError(mapid)
    special(mapid,id,'npc-trade',note=note+' Das angebotene Pokémon wird abgegeben.')
    for e in encounters[-2:]:e['offer']=offer

conditions={'ENGINE_RISINGBADGE':'rising','EVENT_BEAT_ELITE_FOUR':'league','EVENT_GOT_HM01_CUT':'cut','EVENT_BEAT_CHUCK':'chuck','EVENT_JASMINE_EXPLAINED_AMPHYS_SICKNESS':'lighthouse','LOST_ITEM':'doll','ENGINE_PLAINBADGE':'plain','EVENT_CLEARED_SLOWPOKE_WELL':'well','EVENT_TOLD_ELM_ABOUT_TOGEPI_OVER_THE_PHONE':'togepi','RED_SCALE':'lake','MACHINE_PART':'part','EVENT_RETURNED_MACHINE_PART':'power','EVENT_CLEARED_RADIO_TOWER':'radio','EVENT_GOT_KENYA':'mail','EVENT_GOT_TOGEPI_EGG_FROM_ELMS_AIDE':'falk','ENGINE_ZEPHYRBADGE':'falk','EVENT_GAVE_KENYA':'maildone','EVENT_FOUGHT_SUDOWOODO':'sudo','EVENT_HEALED_MOOMOO':'moo','EVENT_MET_COPYCAT_FOUND_OUT_ABOUT_LOST_ITEM':'copycat'}
week={'MONDAY':1,'TUESDAY':2,'WEDNESDAY':3,'THURSDAY':4,'FRIDAY':5,'SATURDAY':6,'SUNDAY':0}
items=[];seen=set()
for x in raw['items']:
    x={**x};m=maps[x['map']];req=[];notes=[]
    if x['map']=='PEWTER_CITY' and x['item']!=('SILVER_WING' if x['edition']=='gold' else 'RAINBOW_WING') and x['item'] in ['SILVER_WING','RAINBOW_WING']:continue
    if x['map']=='BLACKTHORN_GYM_1F' and x['item']=='TM_DRAGONBREATH':continue # the actual award is in Dragon's Den
    if x['map']=='NATIONAL_PARK_BUG_CONTEST':continue # same event flags, alternate map
    dedup=(x['edition'],x['map'],x['item'],x['kind'], x['x'] if x['kind'] in ['ground','hidden','tree'] else 0, x['y'] if x['kind'] in ['ground','hidden','tree'] else 0)
    if dedup in seen:continue
    seen.add(dedup)
    for c in x.pop('conditions'):
        if c.startswith('!'):continue
        key=c.split(':')[-1]
        if key in conditions:req.append(conditions[key])
        if c.startswith('weekday:'):x['weekdays']=[week[key]]
        if c=='checktime:NITE':x['time']='nite'
    if x['map']=='CHERRYGROVE_CITY':req+=['surf'];notes+=['Mit Surfer zum Mann auf der westlichen Insel.']
    if x['map']=='ROUTE_29' and x['item']=='PINK_BOW':req+=['falk'];notes+=['Dienstags bei der Wochentags-Schwester; sie erscheint erst nach dem Flügelorden.']
    gym_flags={'VIOLET_GYM':'falk','AZALEA_GYM':'hive','GOLDENROD_GYM':'plain','ECRUTEAK_GYM':'fog','CIANWOOD_GYM':'chuck','OLIVINE_GYM':'mineral','MAHOGANY_GYM':'glacier','CELADON_GYM':'rainbow','FUCHSIA_GYM':'soul'}
    if x['map'] in gym_flags:req+=[gym_flags[x['map']]];notes+=['Nach dem Arenasieg nochmals mit dem Arenaleiter bzw. der Arenaleiterin sprechen.']
    if x['map']=='VIOLET_CITY':
        if x['kind']=='ground':req+=['surf']
        if x['kind']=='tree':req+=['cut']
    if x['map']=='DARK_CAVE_BLACKTHORN_ENTRANCE':req+=['surf']
    if x['map']=='DARK_CAVE_VIOLET_ENTRANCE' and x['item']!='POTION':req+=['smash','surf']
    if x['map']=='BURNED_TOWER_B1F' or x['map']=='BURNED_TOWER_1F' and x['item']=='BURN_HEAL':req+=['smash']
    if x['map'].startswith('TIN_TOWER_'):req+=['goldWing']
    if x['map']=='CERULEAN_CITY':req+=['surf']
    if x['item']=='MACHINE_PART':req+=['partLead'];notes+=['Zuerst im Kraftwerk nach dem Diebstahl fragen, Rocket in Azuria antreffen und auf Route 24 besiegen. Versteckt am kleinen Becken in der Arena.']
    if x['map']=='ROUTE_32' and x['item']=='TM_ROAR':req+=['cut']
    if x['map']=='ROUTE_34' and x['item'] in ['SOFT_SAND','RARE_CANDY']:req+=['surf']
    if x['map']=='ROUTE_35' and x['kind']=='tree':req+=['surf']
    if x['map']=='ROUTE_42' and (x['kind']=='tree' or x['x']>10):req+=['surf']
    if x['map']=='ROUTE_42' and x['kind']=='tree':req+=['cut']
    if x['map']=='ROUTE_44' and x['item']=='MAX_REVIVE':req+=['surf']
    if x['map']=='ROUTE_46' and x['y']<18:req+=['rising'];notes+=['Nordabschnitt: von Ebenholz über Route 45 nach unten; vom südlichen Eingang durch Stufen getrennt.']
    if x['map']=='ROUTE_27' and x['item']=='TM_SOLARBEAM':req+=['whirl']
    if x['map']=='ROUTE_28_STEEL_WING_HOUSE' or x['map']=='ROUTE_28' and x['kind']=='hidden':req+=['cut']
    if x['map']=='VIRIDIAN_CITY':req+=['surf'];notes+=['Mann im südwestlichen Bereich; Zugang mit Surfer oder Zerschneider.']
    if x['map']=='OLIVINE_PORT':req+=['league']
    if x['map']=='MOUNT_MOON_SQUARE':x['weekdays']=[1];x['time']='nite';req+=['smash'];notes+=['Nach dem Piepi-Tanz den zurückgelassenen Felsen zertrümmern, bevor du das Gebiet verlässt.']
    if x['map']=='MOUNT_MORTAR_B1F':req+=['surf']
    if x['map']=='MOUNT_MORTAR_1F_INSIDE':req+=['strength']
    if x['map']=='GOLDENROD_DEPT_STORE_B1F' and x['item']=='AMULET_COIN':req+=['radio'];notes+=['Über den geretteten Intendanten und das Lager zugänglich.']
    if x['item'] in ['PASS','LOST_ITEM']:req+=['power']
    if x['map']=='BILLS_HOUSE':notes+=['Bills Großvater: gewünschtes Pokémon vorzeigen; Belohnungen der Reihe nach. Entwicklungsteine sind hier einmalig.']
    if x['map']=='BILLS_HOUSE':notes.append({'EVERSTONE':'Schlurp vorzeigen.','LEAF_STONE':'Danach Myrapla vorzeigen.','WATER_STONE':'Danach Sterndu vorzeigen.','FIRE_STONE':'Danach in Gold Fukano, in Silber Vulpix vorzeigen.','THUNDERSTONE':'Zuletzt Pichu vorzeigen.'}.get(x['item'],''))
    if x['map']=='RADIO_TOWER_1F':notes+=['ID-Lotterie: abhängig von der Übereinstimmung der Trainer-ID; nicht garantiert bei diesem Besuch.'];x['special']='lottery'
    if x['map']=='ROUTE_36_NATIONAL_PARK_GATE':x['weekdays']=[2,4,6];notes+=['Käferturnier-Preis; Rang entscheidet. Wiederholbar an Turniertagen.'];x['special']='contest-prize'
    if x['map']=='KURTS_HOUSE' and 'APRICORN' in ' '.join(source[x['source']].splitlines()):notes+=['Für hergestellte Bälle passende Aprikoko abgeben und am Folgetag abholen; der erste Köderball ist Kurts Geschenk.']
    if x['kind']=='tree':notes+=['Nachwachsender Baumfund; täglich erneut erhältlich.']
    if x['map']=='ROUTE_31' and x['item']=='TM_NIGHTMARE':req+=['mail'];notes+=['Habitak mit dem richtigen Brief vom Wächter am südlichen Dukatia-Tor zu diesem Mann bringen.']
    x['requirements']=req;x['note']=' '.join(notes);x['name']=item_name(x['item']);items.append(finish(x))

# Script rewards delivered by scenes, special commands or vending/prize menus.
manual=[
 ('ELMS_LAB','POTION','Trank vom Labor-Assistenten nach der Starterwahl.',[]),('ELMS_LAB','POKE_BALL','Fünf Pokébälle vom Assistenten nach Abgabe des Rätsel-Eis.',['errand']),
 ('MR_POKEMONS_HOUSE','MYSTERY_EGG','Rätsel-Ei von Mr. Pokémon für Professor Lind.',[]),
 ('RADIO_TOWER_5F','BASEMENT_KEY','Falschen Intendanten besiegen; Kelleröffner für den Untergrund.',['radioOccupied']),
 ('RADIO_TOWER_5F','RAINBOW_WING','Geschenk des echten Intendanten nach der Befreiung.',['radio']),('RADIO_TOWER_5F','SILVER_WING','Geschenk des echten Intendanten nach der Befreiung.',['radio']),
 ('GOLDENROD_DEPT_STORE_5F','TM_RETURN','Sonntags bei hoher Freundschaft des ersten Team-Pokémon; sonst Frustration. An einem Sonntag nur eine der beiden TMs.',[]),
 ('ROUTE_27_SANDSTORM_HOUSE','TM_SANDSTORM','Ein sehr zutrauliches Pokémon an erster Stelle vorzeigen.',[]),
 ('CELADON_CAFE','LEFTOVERS','Restaurant-Mülleimer untersuchen; einmaliger Fund.',[]),
 ('CELADON_GAME_CORNER_PRIZE_ROOM','TM_DOUBLE_TEAM','Münzpreis in der Spielhalle.',[]),('CELADON_GAME_CORNER_PRIZE_ROOM','TM_PSYCHIC_M','Münzpreis in der Spielhalle.',[]),('CELADON_GAME_CORNER_PRIZE_ROOM','TM_HYPER_BEAM','Münzpreis in der Spielhalle.',[])
]
for mapid,item,note,req in manual:
    for edition in ['gold','silver']:
        if mapid=='RADIO_TOWER_5F' and item in ['RAINBOW_WING','SILVER_WING'] and item!=('RAINBOW_WING' if edition=='gold' else 'SILVER_WING'):continue
        x=dict(id=mapid.lower()+'-manual-'+item.lower(),map=mapid,item=item,name=item_name(item),kind='person',note=note,requirements=req,edition=edition,source='maps/'+maps[mapid]['name']+'.asm')
        if item=='TM_RETURN':x['weekdays']=[0]
        if item=='LEFTOVERS':x['kind']='hidden'
        items.append(finish(x))

# Shop stock is useful for obtaining item TYPES, but purchasing repeatable stock
# is not counted as a unique map pickup. Vending menus are added separately.
marts={}
current=None
for line in source['data/items/marts.asm'].splitlines():
    m=re.match(r'(\w+):',line)
    if m:current=m[1];marts[current]=[]
    m=re.match(r'\s*db (\w+)',line)
    if m and current and not m[1].isdigit():marts[current].append(m[1])
for mapid,m in maps.items():
    text=source.get('maps/'+m['name']+'.asm','')
    for mart in re.findall(r'pokemart\s+\w+,\s*(\w+)',text):
        for item in next((stock for key,stock in marts.items() if re.sub(r'[^A-Z0-9]', '', key.upper()) == re.sub(r'[^A-Z0-9]', '', mart.upper())), []):
            if item.startswith('ITEM_'):continue
            for edition in ['gold','silver']:
                items.append(finish(dict(id=mapid.lower()+'-shop-'+item.lower(),map=mapid,item=item,name=item_name(item),kind='shop',note='Im Laden kaufen; wiederholbar. Sortiment kann vom Spielfortschritt abhängen.',requirements=[],edition=edition,source='data/items/marts.asm')))
for mapid in ['GOLDENROD_DEPT_STORE_6F','CELADON_DEPT_STORE_6F']:
    for item in ['FRESH_WATER','SODA_POP','LEMONADE']:
        for ed in ['gold','silver']:items.append(finish(dict(id=mapid.lower()+'-vending-'+item.lower(),map=mapid,item=item,name=item_name(item),kind='shop',note='Am Getränkeautomaten kaufen; wiederholbar.',requirements=[],edition=ed,source='maps/'+maps[mapid]['name']+'.asm')))

symbols={x['symbol']:x['id'] for x in raw['species'].values()}
held=[]
for path,text in stats.items():
    symbol=re.search(r'^\s*db (\w+)\s*;',text)[1]
    match=re.search(r'\s*db (\w+), (\w+) ; items',text)
    if not match:continue
    for slot,item in enumerate(match.groups()):
        if item=='NO_ITEM':continue
        held.append(dict(species=symbols[symbol],item=item,name=item_name(item),rarity='häufigerer Slot' if slot==0 else 'seltener Slot'))

for child,parents in {172:[25,26],173:[35,36],174:[39,40],236:[106,107,237],238:[124],239:[125],240:[126]}.items():raw['species'][str(child)]['breedFrom']=parents
for s in raw['species'].values():
    for evo in s['evolutions']:
        if evo['method'] in ['item','trade'] and evo['condition'][0]!='-1':evo['itemName']=item_name(evo['condition'][0])
    if s['id'] in [151,251]:s['external']='Event-/Tausch-Pokémon; im normalen Gold-/Silber-Spielverlauf nicht fangbar.'
    elif s['id'] in list(range(1,10))+list(range(138,142))+[144,145,146,150]:s['external']='Aus Rot, Blau oder Gelb bzw. von einem anderen Spiel tauschen; nicht als regulärer Gold-/Silber-Wildfang erhältlich.'

unique={}
for x in items:unique[(x['id'],x['edition'])]=x
items=list(unique.values())
valid_locations={l['id'] for l in locations}
encounters=[e for e in encounters if e['location'] in valid_locations]
items=[e for e in items if e['location'] in valid_locations]
payload=dict(version=1,sourceCommit=raw['sourceCommit'],sourceUrl='https://github.com/pret/pokegold/tree/'+raw['sourceCommit'],species=raw['species'],locations=locations,maps=maps,encounters=encounters,items=items,held=held,flags=flags,
 notes=['Neu bedeutet: erstmals wild fangbar nach der empfohlenen Reiseroute, nicht nur noch nicht gefangen. Tageszeiten und Sonderbedingungen stehen am Fangort.','Einzelne Routen sind früher als in der Story-Reihenfolge erreichbar. Der Reiseplan ist eine feste, nachvollziehbare Vergleichsreihenfolge.','Der Positionsplan zeigt Fundpositionen auf dem Raster des jeweiligen Gebiets (Norden oben), keine begehbare Spielkarte.','Normale Bodenfunde, versteckte Funde, Personen, Baumfunde und Ladenangebote werden getrennt gezählt.','Einzelne Personen verlangen zusätzlich den im Eintrag genannten Kampf, Auftrag, Freundschaftswert oder Turnier-/Lotterieerfolg.'])
out=Path(sys.argv[2])
packed=base64.b64encode(gzip.compress(json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode(),mtime=0)).decode()
out.write_text('// Generated factual data. Rebuild with tools/build_collection.py and tools/curate_collection.py.\n// Source snapshot: '+raw['sourceCommit']+'\nconst bytes=Uint8Array.from(atob('+json.dumps(packed)+'),c=>c.charCodeAt(0));\nexport const collectionData=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text());\n')
print(json.dumps({'locations':len(locations),'encounters':len(encounters),'itemsPerGold':sum(i['edition']=='gold' for i in items),'heldItems':len(held),'bytes':out.stat().st_size}))
