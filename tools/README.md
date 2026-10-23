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
