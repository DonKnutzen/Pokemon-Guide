"""Build FR/LG facts and original terrain atlases from the pinned source extraction.
Usage: python tools/build-frlg.py /absolute/research
Research extraction: extract_frlg.py and tools/render_frlg_maps.py (see sources).
No guide text or page scans are embedded.
"""
from pathlib import Path
import json,sys,re,shutil
from PIL import Image
r=Path(sys.argv[1]);root=Path(__file__).resolve().parents[1];out=root/'docs/data';assets=root/'docs/assets/frlg-maps';assets.mkdir(exist_ok=True)
d=json.loads((r/'frlg-extracted.json').read_text());manifest=json.loads((r/'frlg-map-assets/manifest.json').read_text())
# Chronology follows the Nintendo Power walkthrough; revisits remain one area.
rows=[
('PALLET_TOWN','Alabastia',0,'Wähle deinen Starter bei Professor Eich. Hole Eichs Paket in Vertania City ab und bringe es zurück. Danach erhältst du den Pokédex und Pokébälle. Hole die Karte von der Schwester deines Rivalen.'),
('ROUTE_1','Route 1',0,'Sprich den Angestellten des Pokémon-Markts auf den Trank an. Beim ersten Hinweg fehlen noch Pokébälle; fange auf dem Rückweg nach Erhalt des Pokédex.'),
('VIRIDIAN_CITY','Vertania City',0,'Hole Eichs Paket im Markt. Nach der Rückgabe zeigt dir der alte Mann das Fangen. Die Arena öffnet erst nach sieben Orden. Kehre später für Surfer-Funde und die Machoschiene zurück.'),
('ROUTE_22','Route 22',0,'Der frühe Abstecher bietet zusätzliche Arten und einen optionalen Rivalenkampf. Der Zugang zur Liga bleibt bis zu den benötigten Orden gesperrt.'),
('ROUTE_2','Route 2',0,'Reise durch den Vertania-Wald nach Marmoria. Die östliche Hälfte erreichst du später durch Digdas Höhle oder mit Zerschneider. Eichs Gehilfe gibt VM05 bei zehn gefangenen Arten.'),
('VIRIDIAN_FOREST','Vertania-Wald',0,'Suche Grasflächen und die Seitenwege nach Funden ab. Auch unsichtbare Items sind auf der Fundkarte markiert. Pikachu ist selten; plane etwas Suchzeit ein.'),
('PEWTER_CITY','Marmoria City',1,'Besiege Rocko für den Felsorden und TM39. Die Laufschuhe erhältst du am Ausgang Richtung Route 3. Mit Zerschneider kommst du später zum Altbernstein im Museum.'),
('ROUTE_3','Route 3',1,'Besiege die Trainer und suche die Grasflächen vor dem Mondberg ab. Im Pokémon-Center am Eingang kannst du Karpador kaufen; es ist später auch mit der Angel erhältlich.'),
('MT_MOON','Mondberg',1,'Erkunde die Leitern und Nebenräume vor dem Ausgang. Wähle nach dem Rocket-Kampf ein Fossil: Helix oder Dom. Das andere Fossil ist in diesem Spielstand regulär nicht erhältlich.'),
('ROUTE_4','Route 4',1,'Sammle die Funde vor dem Sprung nach Azuria. Die Absätze führen vorerst nur in eine Richtung. Angelfänge und Surfer-Funde kommen später hinzu.'),
('CERULEAN_CITY','Azuria City',2,'Besiege Misty für den Quellorden. Hilf Bill auf Route 25 für das Bootsticket. Nach der Rückkehr kannst du durch das ausgeraubte Haus nach Süden. Tausche den Rad-Coupon später gegen das Fahrrad.'),
('ROUTE_24','Route 24',2,'Besiege den Rivalen und die Trainer der Nugget-Brücke. Nimm das Nugget entgegen und suche die westliche Grasfläche ab.'),
('ROUTE_25','Route 25',2,'Hilf Bill in seinem Küstenhaus; du erhältst das Bootsticket. Erkunde die Sackgassen zwischen den Trainern. Einige Funde brauchen später Zerschneider oder Surfer.'),
('ROUTE_5','Route 5',2,'Nutze die Pension für ein einzelnes Pokémon. Hier werden keine Eier gezüchtet. Solange die Wachen Saffronia sperren, nimm den Tunnelpfad nach Route 6.'),
('UNDERGROUND_PATH','Tunnelpfad Nord–Süd',2,'Der Tunnel verbindet Route 5 und 6. Auf dem Boden liegen versteckte Funde; nutze die nummerierten Fundpunkte.'),
('ROUTE_6','Route 6',2,'Fange neue Arten auf dem Weg nach Orania. Wasser- und Angelfänge sind unten als spätere Möglichkeiten aufgeführt.'),
('VERMILION_CITY','Orania City',3,'Hole die Angel beim Angler, den Kampffahnder im Pokémon-Center und den Rad-Coupon im Fanclub. Erkunde die M.S. Anne vor dem Ablegen. Nach Zerschneider erreichst du Major Bobs Arena.'),
('S_S_ANNE','M.S. Anne',3,'Durchsuche alle Kabinen und den Küchenbereich, bevor du das Schiff verlässt. Nach dem Rivalenkampf gibt der Kapitän VM01 Zerschneider. Sobald du danach von Bord gehst, legt das Schiff endgültig ab: offene Funde sind dann verpasst.'),
('ROUTE_11','Route 11',3,'Suche das Gras und das Wachhaus ab. Eichs Gehilfe gibt den Detektor bei 30 gefangenen Arten. Relaxo am östlichen Ausgang braucht später die Pokéflöte.'),
('DIGLETTS_CAVE','Digdas Höhle',3,'Der Tunnel führt zur Ostseite von Route 2. Dort warten VM05, ein Tausch und Funde hinter Zerschneider-Bäumen.'),
('ROUTE_9','Route 9',4,'Nutze Zerschneider östlich von Azuria und folge den Absätzen Richtung Felstunnel. Prüfe die Abzweige vor jedem Sprung.'),
('ROUTE_10','Route 10',4,'Heile vor dem Felstunnel. Später führt Surfer am Fluss zum Kraftwerk. Beide Tunnel-Ausgänge gehören zu dieser Route.'),
('ROCK_TUNNEL','Felstunnel',4,'Blitz erleichtert die Orientierung, ist aber nicht zwingend. Prüfe beide Etagen und die Abzweige; danach erreichst du Lavandia.'),
('LAVENDER_TOWN','Lavandia',4,'Im Pokémon-Turm kannst du zunächst noch nicht alle Geister identifizieren. Reise über Route 8 und den Tunnel nach Prismania, um das Silph Scope zu holen.'),
('ROUTE_8','Route 8',4,'Gehe nach Westen. Solange Saffronia gesperrt ist, führt der Tunnelpfad nach Route 7.'),
('UNDERGROUND_PATH_2','Tunnelpfad Ost–West',4,'Dieser Tunnel verbindet Route 8 und 7. Suche auch die versteckten Bodenfunde auf der Karte.'),
('ROUTE_7','Route 7',4,'Nimm die Grasfläche mit und gehe nach Prismania. Mit dem Tee kannst du später die Wache nach Saffronia passieren.'),
('CELADON_CITY','Prismania City',5,'Hole den Tee im Wohnhaus, Evoli über den Hintereingang und den Münzkorb im Restaurant. Das Kaufhaus verkauft Entwicklungssteine. Besiege Erika; untersuche dann das Poster im Rocket-Spielkasino.'),
('ROCKET_HIDEOUT','Rocket-Versteck',5,'Löse die Pfeilboden-Passagen auf jeder Ebene. Besorge den Liftschlüssel, besiege Giovanni und nimm das Silph Scope mit.'),
('POKEMON_TOWER','Pokémon-Turm',6,'Mit dem Silph Scope kannst du Geister fangen. Das Knogga-Gespenst ist nicht fangbar. Befreie Mr. Fuji für die Pokéflöte. Nutze den Detektor später genau auf seinem ehemaligen Standfeld für die Sanftglocke.'),
('SAFFRON_CITY','Saffronia City',6,'Gib einer Stadtwache den Tee. Im Kampf-Dojo kannst du zwischen Kicklee und Nockchan wählen. Befreie die Silph Co., bevor du Sabrina herausforderst.'),
('SILPH_CO','Silph Co.',6,'Hole die Schlüsselkarte auf Ebene 5 und erkunde die verschlossenen Räume. Nach dem Rivalenkampf erhältst du Lapras auf Ebene 7. Besiege Giovanni und sprich den Präsidenten für den Meisterball an.'),
('ROUTE_16','Route 16',6,'Wecke Relaxo mit der Pokéflöte und fange es vor dem Besiegen. Hinter dem Zerschneider-Baum erhältst du VM02 Fliegen. Für den Radweg brauchst du das Fahrrad. Überreste liegen auf Relaxos ehemaligem Feld.'),
('ROUTE_17','Route 17',6,'Fahre den Radweg hinunter und erkunde die seitlichen Streifen. Mehrere versteckte Funde liegen entlang des Wegs.'),
('ROUTE_18','Route 18',6,'Suche das Gras am Ende des Radwegs und das Wachhaus ab. Der örtliche Tausch unterscheidet sich nach Edition.'),
('ROUTE_12','Route 12',6,'Hole die Superangel im Anglerhaus. Wecke Relaxo mit der Pokéflöte; auf seinem ehemaligen Feld gibt der Detektor Überreste. Angeln und Surfer erschließen weitere Fänge und Funde.'),
('ROUTE_13','Route 13',6,'Suche die Grasfläche hinter Zerschneider und die verschlungenen Wege ab. Die Route führt nach Süden Richtung Fuchsania.'),
('ROUTE_14','Route 14',6,'Prüfe Gras und Zaunwege. Neue Arten hängen von deiner Edition ab; bereits erfasste Pokémon verschwinden aus den offenen Routenfängen.'),
('ROUTE_15','Route 15',6,'Erkunde auch den oberen Weg hinter Zerschneider. Eichs Gehilfe im Wachhaus gibt den EP-Teiler bei 50 gefangenen Arten.'),
('FUCHSIA_CITY','Fuchsania City',7,'Hole die Profiangel im Anglerhaus. Besiege Koga, damit du Surfer einsetzen kannst. Bring dem Wärter das Goldene Gebiss aus der Safari-Zone für VM04 Stärke; verschiebe seinen Felsen für ein weiteres Item.'),
('KANTO_SAFARI_ZONE','Safari-Zone',7,'Plane den Weg zum geheimen Haus für VM03 Surfer und nimm kurz davor das Goldene Gebiss mit. Erkunde alle vier Bereiche in mehreren Besuchen. Seltene Safari-Pokémon können fliehen.'),
('POWER_PLANT','Kraftwerk',7,'Surfe auf Route 10 zum Eingang. Erkunde alle Gänge: Einige Itembälle sind Voltobal oder Lektrobal. Sichere den Spielstand vor Zapdos.'),
('ROUTE_19','Route 19',7,'Surfe von Fuchsania nach Süden und halte nach neuen Wasser- und Angelfängen Ausschau.'),
('ROUTE_20','Route 20',7,'Erkunde beide Seiten der Seeschauminseln. Die Strömung im Höhlensystem muss mit Stärkefelsen umgeleitet werden.'),
('SEAFOAM_ISLANDS','Seeschauminseln',7,'Schiebe die passenden Felsen durch die Löcher bis in die unteren Ebenen. Stoppe die Strömungen, bevor du Arktos und den westlichen Ausgang erreichst.'),
('ROUTE_21','Route 21',7,'Die Verbindung von Alabastia zur Zinnoberinsel bietet Gras auf einer Insel sowie Wasser- und Angelfänge.'),
('CINNABAR_ISLAND','Zinnoberinsel',8,'Lass Fossilien im Labor wiederbeleben. Hole den Geheimschlüssel aus dem Pokémon-Haus und besiege Pyro. Danach bietet Bill die Reise zu Eiland Eins an.'),
('POKEMON_MANSION','Pokémon-Haus',8,'Nutze die Schalter an den Statuen und den richtigen Sprung von Ebene 3. Hole im Keller den Geheimschlüssel für Pyros Arena und suche alle Räume nach Items ab.'),
('ONE_ISLAND','Eiland Eins',9,'Sprich mit Celio im Pokémon-Center. Erfülle Bills Auftrag auf Eiland Zwei und Drei. Nach Liga und Nationaldex kehrst du für die Rubin-Suche und den Bunt-Pass zurück.'),
('TREASURE_BEACH','Schatzgestade',9,'Surfe südlich von Eiland Eins zum Strand. Die versteckten Strandfunde können nach Schritten wieder erscheinen; die App merkt den ersten Fund.'),
('KINDLE_ROAD','Glühweg',9,'Erkunde den Weg zum Glutberg. Zertrümmerbare Felsen bergen zusätzliche Begegnungen; du erhältst Zertrümmerer in der Gluttherme.'),
('EMBER_SPA','Gluttherme',9,'Sprich den alten Mann im Inneren für VM06 Zertrümmerer an. Die Quelle heilt dein Team.'),
('MT_EMBER','Glutberg',9,'Mit Stärke erreichst du den Gipfel und Lavados. Der nordöstliche Seitenweg mit dem Rubin öffnet erst nach Nationaldex und Celios Auftrag.'),
('TWO_ISLAND','Eiland Zwei',9,'Sprich mit dem Vater in der Spielhalle. Suche auf Eiland Drei nach seiner Tochter; bringe sie zurück, bevor du Bills Auftrag abschließt.'),
('CAPE_BRINK','Kap Kante',9,'Erkunde den Pfad und das Wasser. Die Attacken-Lehrerin bietet dem voll entwickelten Kanto-Starter bei genügend Freundschaft seine besondere Attacke an.'),
('THREE_ISLAND','Eiland Drei',9,'Besiege die Biker vor der Stadt. Reise über die Brücke zum Beerenforst und rette das vermisste Mädchen.'),
('THREE_ISLE_PORT','Hafen von Eiland Drei',9,'Der Hafen verbindet die Stadt mit dem Tri-Pass-Schiff. Nach dem Nationaldex lohnt sich die Rückkehr zum erweiterten Eiland Drei-Pfad.'),
('BOND_BRIDGE','Beerenbrücke',9,'Folge der Brücke zum Beerenforst. Erkunde die Wasserflächen und den südlichen Sandbereich mit Surfer.'),
('BERRY_FOREST','Beerenforst',9,'Rette das Mädchen vor Hypno. Suche die Wege nach versteckten Beeren ab; diese Funde können nachwachsen.'),
('KANTO_VICTORY_ROAD','Siegesstraße',11,'Besiege Giovanni in Vertania für den achten Orden. Passiere die Ordenskontrollen auf Route 23. Löse in der Siegesstraße die Stärke-Schalter und suche alle drei Ebenen ab.'),
('ROUTE_23','Route 23',11,'Die Wachen kontrollieren deine acht Orden. Surfer und Stärke gehören zur Reise zur Liga. Prüfe die Wasserflächen und versteckten Funde entlang des Pfads.'),
('INDIGO_PLATEAU','Indigo-Plateau',12,'Bereite Heilitems und ein vielseitiges Team vor. Besiege die Top Vier und den Champ. Mit mindestens 60 gefangenen Kanto-Arten und abgeschlossenem Eiland-Auftrag kannst du bei Eich den Nationaldex erhalten.'),
('FOUR_ISLAND','Eiland Vier',14,'Mit dem Bunt-Pass erreichst du Eiland Vier. Hier kann die Pension mit zwei Eltern Eier erzeugen. Suche Lorelei in der Eiskaskadenhöhle auf.'),
('ICEFALL_CAVE','Eiskaskadenhöhle',14,'Hole VM07 Kaskade und setze sie am Wasserfall ein. Hilf Lorelei gegen Team Rocket; danach ist der Weg zum Saphir frei.'),
('FIVE_ISLAND','Eiland Fünf',14,'Erkunde die Insel und ihre Seitengebiete. Das Rocket-Lager braucht zwei Passwörter: eines vom Glutberg, eines vom Saphir-Diebstahl.'),
('FIVE_ISLE_MEADOW','Eiland Fünf-Weide',14,'Prüfe die Grasflächen und Funde um das Rocket-Lager. Die Tür öffnet mit beiden Passwörtern.'),
('WATER_LABYRINTH','Wasserirrgarten',14,'Surfe zum älteren Mann. Bei hoher Freundschaft des ersten Team-Pokémon und einem freien Teamplatz schenkt er dir das Togepi-Ei.'),
('RESORT_GORGEOUS','Ferienparadies',14,'Erkunde die kleinen Inseln mit Surfer. Nach Selinas Rettung in der Verlorenen Höhle gibt sie wiederholbare Suchaufträge.'),
('LOST_CAVE','Verlorene Höhle',14,'Die Steinzahlen zeigen Uhrzeitrichtungen: 3 rechts, 6 unten, 9 links, 12 oben. Zu Selina: rechts, oben, unten, unten, rechts, links, unten, rechts, oben. Seitenwege führen zu den Itemräumen.'),
('MEMORIAL_PILLAR','Gedenksäule',14,'Surfe südlich der Weide zur Gedenksäule. Lege am Grab Limonade ab und sprich anschließend den Trainer für TM42 an.'),
('SIX_ISLAND','Eiland Sechs',14,'Von hier erreichst du nördlich die Wassergebiete und südlich das Ruinental mit dem Punktloch.'),
('WATER_PATH','Wasserweg',14,'Suche Land- und Wasserwege ab. Im Haus kannst du mit einer bestimmten großen Pokémon-Art einen Rekord vergleichen; die geforderte Art unterscheidet sich nach Edition.'),
('GREEN_PATH','Grüner Pfad',14,'Folge den Wasserwegen zum Musterbuschwald und Richtung Fern-Eiland. Erkunde auch die kleinen Strandflächen.'),
('PATTERN_BUSH','Musterbuschwald',14,'Suche die Grasflächen nach den hier vorkommenden Käfer-Pokémon ab. Der auffällige Boden verändert die Fangtabelle nicht.'),
('OUTCAST_ISLAND','Fern-Eiland',14,'Surfe in den Norden zu Fern-Eiland und der Wandelhöhle. Suche die kleinen Landflächen und Wasserstellen ab.'),
('ALTERING_CAVE','Wandelhöhle',14,'Im unveränderten Spiel erscheint hier nur Zubat. Die vorgesehenen Austausch-Begegnungen wurden nicht regulär verteilt und zählen hier nicht als normale Fangorte.'),
('RUIN_VALLEY','Ruinental',15,'Hilf zuerst Lorelei in der Eiskaskadenhöhle. Öffne den Eingang zum Punktloch mit Zerschneider.'),
('DOTTED_HOLE','Punktloch',15,'Nach dem ersten Loch lautet die Reihenfolge oben, links, rechts, unten. Beim Saphir erscheint ein Forscher und stiehlt ihn; merke dir das zweite Passwort für das Rocket-Lager.'),
('ROCKET_WAREHOUSE','Rocket-Lager',16,'Öffne die Tür mit beiden Passwörtern. Löse die Pfeilfelder, besiege die Rockets und hole den Saphir vom Forscher. Bring ihn Celio auf Eiland Eins.'),
('SEVEN_ISLAND','Eiland Sieben',14,'Im Norden wartet der Trainerturm, im Süden der Weg zu den Tanoby-Ruinen. Prüfe auch die Häuser und die Stadtfunde.'),
('TRAINER_TOWER','Trainerturm',14,'Wähle einen der vier Kampfmodi. Für die jeweilige Bestzeit gibt es eine andere Belohnung. Die Preise gehören zu eigenen Modi und sind keine normalen Bodenfunde.'),
('CANYON_ENTRANCE','Canyon-Eingang',14,'Reise nach Süden zum Sevault-Canyon. Nutze die Grasflächen für neue Arten.'),
('SEVAULT_CANYON','Sevault-Canyon',14,'Erkunde die Seitenwege und die Tanoby-Schlüsselkammer. Das Stärke-Rätsel aktiviert die Icognito-Begegnungen in den Ruinen.'),
('TANOBY_KEY','Tanoby-Schlüssel',14,'Schiebe alle sieben Felsen auf die Vertiefungen. Erst danach erscheinen Icognito in den Tanoby-Kammern.'),
('TANOBY_RUINS','Tanoby-Ruinen',14,'Surfe zwischen den sieben Kammern. Die verschiedenen Icognito-Formen zählen für den Pokédex als eine Art; aktiviere vorher den Tanoby-Schlüssel.'),
('CERULEAN_CAVE','Azuria-Höhle',17,'Die Höhle öffnet erst nach Liga, Nationaldex und reparierter Netzwerkmaschine bei Celio. Durchsuche alle Ebenen mit Surfer und Stärke. Mewtu wartet im Keller.'),
('NAVEL_ROCK','Nabelfels · Event',99,'Historisches Event: Für Ho-Oh und Lugia war ein Geheimticket nötig. Ohne legitim vorhandenes Ticket ist dieses Gebiet im normalen Spiel nicht erreichbar.'),
('BIRTH_ISLAND','Entstehungsinsel · Event',99,'Historisches Event: Deoxys braucht das Auroraticket. Das Dreieck-Rätsel führt zum Kampf. Ohne vorhandenes Event-Ticket ist die Insel regulär nicht erreichbar.')]
areas=[dict(id=k.lower().replace('kanto_',''),section='MAPSEC_'+k,name=n,stage=s,steps=t) for k,n,s,t in rows]
areas.insert(next(i for i,a in enumerate(areas) if a['id']=='victory_road'),dict(id='viridian_gym',section='MAPSEC_VIRIDIAN_GYM',name='Vertania · letzte Arena',stage=10,steps='Kehre mit sieben Orden nach Vertania City zurück. Besiege Giovanni für den Erdorden und TM26. Benutze danach den Detektor genau auf Giovannis ehemaligem Standfeld für die Machoschiene. Anschließend geht es über Route 22 und die Ordenskontrollen auf Route 23 zur Liga.'))
a23=next(a for a in areas if a['id']=='route_23');areas.remove(a23);areas.insert(next(i for i,a in enumerate(areas) if a['id']=='victory_road'),a23)
lookup={a['section']:a for a in areas}
# Group all Tanoby chambers and minor shared-section maps under the parent area.
aliases={**{f'MAPSEC_{x}_CHAMBER':'MAPSEC_TANOBY_RUINS' for x in ['MONEAN','LIPTOO','WEEPTH','DILFORD','SCUFIB','RIXY','VIAPOIS']},'MAPSEC_POKEMON_LEAGUE':'MAPSEC_INDIGO_PLATEAU','MAPSEC_TRAINER_TOWER_2':'MAPSEC_TRAINER_TOWER','MAPSEC_THREE_ISLE_PATH':'MAPSEC_THREE_ISLE_PORT'}
pages=json.loads((r/'frlg-guide-notes.json').read_text())['route_page_index']
for a in areas:
 candidates=[x[-1] for x in pages if a['id'] in x[:-1] or a['id']=='s_s_anne' and 'ss_anne'in x[:-1] or a['id']=='kanto_safari_zone' and 'safari_zone'in x[:-1]]
 a['page']=candidates[0] if candidates else None
maps={}
for key,m in d['maps'].items():
 section=aliases.get(m['section'],m['section']);section='MAPSEC_VIRIDIAN_GYM' if key=='MAP_VIRIDIAN_CITY_GYM' else section;a=lookup.get(section)
 if not a:continue
 name=m['name'];suffix=re.sub(r'([a-z])([A-Z])',r'\1 \2',name).replace('_',' · ')
 # Floor and room labels are kept distinct, with a German parent area.
 suffix=re.sub(r'\b(\d+)F\b',lambda z:'EG' if z[1]=='1' else str(int(z[1])-1)+'. OG',suffix)
 suffix=re.sub(r'\bB(\d+)F\b',r'\1. UG',suffix)
 for en,de in [('North','Nord'),('South','Süd'),('East','Ost'),('West','West'),('Entrance','Eingang'),('Room','Raum'),('Basement','Keller')]:suffix=suffix.replace(en,de)
 maps[key]={'id':key,'area':a['id'],'name':suffix,'width':m['width'],'height':m['height']}
extra=json.loads((r/'frlg-supplement.json').read_text()) if (r/'frlg-supplement.json').exists() else {}
# Explicit postgame revisit: the Ruby quest must precede access to Islands 4–7.
ruby=dict(id='celio_ruby',section='MAPSEC_RUBY_QUEST',name='Zurück zu Celio · Rubin',stage=13,page=80,steps='Nach der Liga: Erhalte bei Professor Eich mit mindestens 60 gefangenen Kanto-Arten und abgeschlossenem Eiland-Auftrag den Nationaldex. Sprich Celio auf Eiland Eins an und gehe zum nordöstlichen Eingang am Glutberg. Besiege die Rockets, hole den Rubin aus dem Seitenweg und bringe ihn Celio. Du erhältst den Bunt-Pass für Eiland Vier bis Sieben.')
areas.insert(next(i for i,a in enumerate(areas) if a['id']=='four_island'),ruby)
for key,m in maps.items():
 if 'RUBY_PATH' in key or 'RUBY_CHAMBER' in key:m['area']='celio_ruby';m['stage']=13
# Localized room labels retain distinct floor/room identities.
translations={'Professor Oaks Lab':'Professor Eichs Labor','Rivals House':'Haus des Rivalen','Players House':'Dein Haus','Pokemon Center':'Pokémon-Center','Pokemon Fan Club':'Pokémon-Fanclub','Condominiums':'Prismania-Villa','Department Store':'Kaufhaus','Game Corner':'Spielhalle','Prize Room':'Preise','Captains Office':'Kapitänskajüte','Wardens House':'Wärterhaus','Fishing House':'Anglerhaus','Museum':'Museum','Gym':'Arena','House':'Haus','Mart':'Markt','Roof':'Dach','Room':'Raum','Secret House':'Geheimes Haus','East Entrance':'Ostzugang','West Entrance':'Westzugang','North Entrance':'Nordzugang','South Entrance':'Südzugang','Dunsparce Tunnel':'Erweiterter Tunnel','Ruby Path':'Rubin-Pfad','Ruby Chamber':'Rubin-Kammer','Icefall Cave':'Eiskaskadenhöhle','Lost Cave':'Verlorene Höhle','Dotted Hole':'Punktloch','Rocket Warehouse':'Rocket-Lager'}
for key,m in maps.items():
 raw=d['maps'][key]['name'];parts=raw.split('_');tail=' · '.join(parts[1:]);tail=re.sub(r'([a-z])([A-Z])',r'\1 \2',tail)
 for en,de in sorted(translations.items(),key=lambda x:-len(x[0])):tail=tail.replace(en,de)
 tail=re.sub(r'B(\d+)F',r'\1. UG',tail);tail=re.sub(r'\b(\d+)F\b',lambda z:'EG' if z[1]=='1' else str(int(z[1])-1)+'. OG',tail)
 parent=next(a['name'] for a in areas if a['id']==m['area']);m['name']=parent+(' · '+tail if tail else '')

# Only package maps needed for encounters or pickups. Terrain is rendered from source,
# with exact event coordinates, not copied guide-page screenshots.
needed={x['map'] for x in d['items']+d['encounters']+extra.get('items',[])+extra.get('pokemon',[]) if x['map'] in maps}
# Shelf-pack unique rendered layouts into 4096px atlases, one asset per sheet.
positions={};canvases=[];cx=cy=height=0;canvas=Image.new('RGB',(4096,4096));used=False
for name in sorted(set(manifest['maps'][k]['image'] for k in needed if k in manifest['maps'])):
 im=Image.open(r/'frlg-map-assets'/name).convert('RGB');w,h=im.size
 if cx+w>4096:cx=0;cy+=height;height=0
 if cy+h>4096:
  canvases.append(canvas);canvas=Image.new('RGB',(4096,4096));cx=cy=height=0
 positions[name]=(len(canvases),cx,cy,w,h);canvas.paste(im,(cx,cy));cx+=w;height=max(height,h);used=True
if used:canvases.append(canvas)
for i,c in enumerate(canvases):
 path=assets/f'terrain-{i}.webp';c.save(path,'WEBP',lossless=True,method=4)
 assert path.stat().st_size>0,str(path)
 Image.open(path).verify()
for key,m in maps.items():
 source=manifest['maps'].get(key)
 if source and source['image'] in positions:
  i,x,y,w,h=positions[source['image']];m['terrain']=[i,x,y,w,h]
# Stable source-derived item IDs. Branch evidence is private curation input only.
items=[]
remove={(x['edition'],x['id']) for x in extra.get('removeItemIds',[])}
for it in d['items']+extra.get('items',[]):
 if (it['edition'],it['id']) in remove:continue
 if it['map'] not in maps or it['item']=='ITEM_NONE':continue
 items.append({k:it[k] for k in ['id','edition','map','item','kind','x','y','quantity','underfoot','detail','requires','repeatable'] if k in it})
encounters=[{k:x[k] for k in ['edition','map','species','method','chance','minLevel','maxLevel']} for x in d['encounters'] if x['map'] in maps]
# Raw section for gate refinements, without exposing script jargon to the player.
for m in maps.values():
 if 'RUBY' in m['id']:m['stage']=13
 if m['id']=='MAP_THREE_ISLAND_DUNSPARCE_TUNNEL':m['stage']=12
 if m['id']=='MAP_ROUTE2_EAST_BUILDING':m['stage']=3
# Localization from PokeAPI; move labels disambiguate TMs/VMs.
names=d['itemNames'];names.update(json.loads((root/'tools/frlg-item-names.json').read_text()) if (root/'tools/frlg-item-names.json').exists() else {});names.update({'ITEM_STICK':'Lauchstange','ITEM_FAB_MAIL':'Zierbrief','ITEM_LEMONADE':'Limonade','ITEM_FRESH_WATER':'Tafelwasser','ITEM_SODA_POP':'Sprudel','ITEM_DRAGON_FANG':'Drachenzahn','ITEM_UP_GRADE':'Up-Grade','ITEM_BRIGHT_POWDER':'Blendpuder','ITEM_WHITE_HERB':'Schlohkraut','ITEM_CHOICE_BAND':'Wahlband','ITEM_MENTAL_HERB':'Mentalkraut','ITEM_FOCUS_BAND':'Fokusband','ITEM_SCOPE_LENS':'Scope-Linse','ITEM_LUXURY_BALL':'Luxusball','ITEM_REPEAT_BALL':'Wiederball','ITEM_TIMER_BALL':'Timerball','ITEM_ENIGMA_BERRY':'Enigmabeere'});names.update({'ITEM_HM01':'VM01 · Zerschneider','ITEM_HM02':'VM02 · Fliegen','ITEM_HM03':'VM03 · Surfer','ITEM_HM04':'VM04 · Stärke','ITEM_HM05':'VM05 · Blitz','ITEM_HM06':'VM06 · Zertrümmerer','ITEM_HM07':'VM07 · Kaskade'})
result={'source':d['source'],'guide':{'title':'Nintendo Power · Official Nintendo Player’s Guide (2004)','url':'https://archive.org/details/pokemon_frlg_nintendo_power_guide'},'areas':areas,'maps':maps,'encounters':encounters,'items':items,'itemNames':names,'species':d['species'],'specials':extra.get('pokemon',[]),'shops':extra.get('shops',[]),'rewardNotes':extra.get('rewardNotes',{})}

(out/'frlg-data.js').write_text('// Source facts and original route summaries. Rebuild with tools/build-frlg.py.\nexport const frlgData='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
used_atlases=set(range(len(canvases)))
for f in assets.glob('terrain-*.webp'):
 if int(f.stem.split('-')[-1]) not in used_atlases:f.unlink()
print(json.dumps({'areas':len(areas),'maps':len(maps),'items':len(items),'encounters':len(encounters),'atlases':len(canvases)}))
