# Fang- und Funddaten neu erzeugen

Die fertige Website braucht nur `docs/data/collection-data.js`. Die Python-Skripte dienen der redaktionellen Datenpflege; große Quell-Snapshots werden nicht mitgeliefert.

Verwendeter Quellstand: `pret/pokegold@fc702b6d922aecce274782d68bba8639936a1182`.

In einem Arbeitsordner folgende JSON-Eingaben vorbereiten:

- `pret-source.json`: `{"sha":"<commit>","files":{"<Repository-Pfad>":"<Dateiinhalt>"}}`. Enthält alle `maps/*.asm`, die Karten-, Pokémon- und Itemkonstanten, `data/maps/{attributes,maps}.asm`, `data/pokemon/evos_attacks.asm`, `data/items/{fruit_trees,marts}.asm` und die Wildtabellen unter `data/wild/` (Gras, Wasser, Angeln, Schwärme, Kopfnuss und Käferturnier).
- `species-de.json`: Objekt von Pokédexnummern als Zeichenfolge zu deutschen Namen, z. B. `{"1":"Bisasam"}`, für alle 251 Arten.
- `item-names-de.json`: Objekt von PokéAPI-Item-Slugs zu deutschen Namen. Historische Beeren-, TM-/VM- und Schlüsselitemnamen ergänzt `curate_collection.py`.
- `base-stats.json`: Objekt von Quellpfaden zu Dateiinhalten aller 251 Dateien unter `data/pokemon/base_stats/`, für getragene Items.

Aus dem Repository-Verzeichnis ausführen (Arbeitsordner hier `/tmp/guide-data`):

```sh
python3 tools/build_collection.py \
  --source /tmp/guide-data/pret-source.json \
  --species-names /tmp/guide-data/species-de.json \
  --item-names /tmp/guide-data/item-names-de.json \
  --output /tmp/guide-data/collection-raw.json
python3 tools/curate_collection.py /tmp/guide-data docs/data/collection-data.js
npm test
```

`build_collection.py` extrahiert Tatsachen aus den Assemblertabellen und Kartenereignissen. `curate_collection.py` ergänzt die empfohlene Gebietsreihenfolge, Zugangsregeln, deutsche Bezeichnungen, Geschenke, Tausche und Sonderfälle. Skriptbedingungen müssen weiterhin redaktionell geprüft werden: Die Extraktion ist kein vollständiger Spiel-Interpreter. Bei geändertem Quellstand sind besonders alternative Zugänge, Gesprächsbedingungen und stabile Fundort-IDs zu kontrollieren.

Der generierte Datensatz wird deterministisch mit gzip komprimiert und beim Modulimport mit der nativen Browser-API entpackt. Es wird keine ROM-Datei verarbeitet.

## Lokale Pokémon-Bilder

`build_sprite_atlas.py` lädt die 251 transparenten Gold-Sprites vom festgelegten Commit `PokeAPI/sprites@97a7832d307311c0e1c6ea9035308bf80cc94f81` und ordnet sie nach Pokédexnummer in zwei verlustfreien PNG-Bildatlanten an. Dafür werden bei der Entwicklung Python und Pillow benötigt:

```sh
python3 tools/build_sprite_atlas.py
```

Die fertige Website lädt nur `docs/assets/pokemon-sprites-1.png` und `pokemon-sprites-2.png` vom eigenen Host. Jeder Atlas hat 16 × 8 Zellen mit je 56 × 56 Pixeln. Der erste enthält Arten 1–128, der zweite 129–251; die letzten fünf Zellen bleiben frei. Die indizierten Paletten erhalten sämtliche Originalpixel. Es werden keine Spielerbilder oder ROMs verarbeitet. Beide Editionen verwenden die Gold-Darstellungen.


## Fundkarten und PDF-Referenzen

`build_item_maps.py` rekonstruiert 95 Karten aus den originalen `.blk`-Kartengrids, Metatiles, Pixelgrafiken und Tages-/Innenraum-Paletten des festgelegten pokegold-Quellstands. Ein Kartenfeld entspricht 16 × 16 Pixeln. Die Fundmarker werden zur Laufzeit aus den ursprünglichen Objekt-/Versteck-Koordinaten gesetzt; es gibt keine geschätzte Positionierung. Der Café-Mülleimer wird explizit aus `CeladonCafe.asm` bei X 7/Y 1 ergänzt. Personen, bewegliche Objekte und dynamische Veränderungen werden nicht gerendert.

Die Eingabe für `--data` ist JSON `{maps, locations, items}` aus `collectionData`, mit den Gold-Einträgen für `ground` und `hidden`. Beide Editionen verwenden dieselben geprüften Kartengrids. Der Quell-Cache wird nur lokal benötigt:

```sh
python3 tools/build_item_maps.py --source /tmp/guide-data/pret-source.json --data /tmp/guide-data/map-render-input.json --cache /tmp/guide-map-source
```

`extract_guide_maps.py` liest das vom Projektinhaber bereitgestellte PDF und erzeugt die in `guide_map_crops.json` definierten Referenzausschnitte. Die Rechteckkoordinaten sind relativ zur PDF-Seite. Es wird keine vollständige Buchseite als Website-Asset übernommen. Benötigt werden PyMuPDF und Pillow:

```sh
python3 tools/extract_guide_maps.py /pfad/zum/bereitgestellten-guide.pdf
```

Die ausgeschnittenen PDF-Übersichten sind Referenzen. Marker erscheinen auf den exakten Original-Kartengrids, damit sie auch bei versteckten, im Buch nicht eingezeichneten Fundstellen richtig sitzen.

## Gemeinsame Sammlung und Konten

`build_platform_species.py` ergänzt den Namensindex bis #386 und die originalen Smaragd-Sprites für #252–386. Beide Quellen sind im Skript mit Commit-SHAs fixiert; der neue PNG-Atlas enthält die 64×64-Originalbilder ohne Skalierung. Die alten Gold-Atlanten bleiben erhalten.

`verify_cloud_schema.mjs` prüft die Supabase-Migration in einer isolierten PostgreSQL-Instanz. Aufruf und Aktivierung des Backends stehen in [supabase/README.md](../supabase/README.md).
