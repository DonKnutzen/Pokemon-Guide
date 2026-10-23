# PokéGuide · Dein Fangbegleiter

Ein mobiler Begleiter für die originalen Game-Boy-Color-Spiele Pokémon Gold und Silber.

**Website:** https://donknutzen.github.io/Pokemon-Guide/

## So benutzt du ihn

1. **Edition wählen.** Gold und Silber haben getrennte Sammlungen und Fangorte.
2. **Aktuelles Gebiet wählen.** Die Reiseroute führt durch 94 Orte. Mit dem Pfeil geht es zum nächsten Gebiet; die Gebietsauswahl springt direkt zu einem Ort.
3. **Fehlende Arten ansehen.** Kleine Original-Pixelbilder, Fangmethoden, Tageszeiten und Level stehen direkt auf der Karte. Antippen öffnet alle Details.
4. **„Gefangen“ antippen.** Die Art wandert in deinen Pokédex und verschwindet aus den offenen Fanglisten sämtlicher weiterer Gebiete. Entwicklungen bleiben eigenständig offen. „Rückgängig“ korrigiert einen versehentlichen Fang.
5. **Ausrüstung aktualisieren.** Noch nicht nutzbare Angel-, VM- und Sonderfänge bleiben unter „Für später merken“ sichtbar. Besuche und Ausrüstung sind unabhängig; der Wechsel eines Gebiets schaltet keine VM frei.

Items stehen im zweiten Tab jedes Gebiets: sichtbare und versteckte Funde, Gesprächsbelohnungen und Baumfunde. Ein Tippen zeigt Voraussetzungen und Fundposition. Läden und bereits erledigte Funde sind eingeklappt. Unter **Rückwege** erscheinen durch neue Ausrüstung erreichbare offene Ziele in besuchten Gebieten.

Der Pokédex zeigt alle 251 Arten mit editionsabhängigen Fangquellen, Entwicklungen, Zucht und nötigem externen Tausch. Eine Entwicklung wird nicht automatisch als erhalten gewertet, wenn du ihre Vorentwicklung fängst. Pokémon anderer Editionen werden nicht als lokale Wildfänge angeboten.

## Speicherung und vorhandener Fortschritt

Fortschritt bleibt lokal im Browser. Unter **Rucksack** lassen sich JSON-Sicherungen herunterladen und wieder ergänzend laden. Ohne Sicherung gibt es keine geräteübergreifende Synchronisation. Das Löschen der Browserdaten kann den Fortschritt entfernen.

Vorhandene Story- und Sammelsicherungen bleiben kompatibel. Frühere Story-Häkchen werden für passende Freischaltungen weiter berücksichtigt. Neu erfasste Fänge merken sich zusätzlich das Gebiet. Die Oberfläche startet direkt beim zuletzt gewählten Gebiet; der frühere lange Story- und Aufgabenaufbau ist durch die Fangreise ersetzt.

## Umfang und Quellen

„Neu hier“ bedeutet erstmals wild fangbar in der empfohlenen Gebietsfolge, unabhängig von deinem eigenen Fangstatus. Andere Abstecher können bei anderer Wegwahl früher möglich sein. Der Guide verändert und liest keinen Spielstand.

Pro Edition sind 136 sichtbare Bodenfunde, 87 versteckte Fundstellen, 107 Gesprächs-/Belohnungseinträge und 30 Baumfunde erfasst, dazu Ladenangebote. Zufalls- und Sonderbedingungen stehen in den Details. Die Fundposition ist ein Rasterpunkt mit Norden oben, keine begehbare Spielkarte. Die Daten gelten für Gold und Silber, nicht für Pokémon GO, Kristall oder die Remakes.

- Fang- und Funddaten sowie Entwicklungsregeln: [pret/pokegold](https://github.com/pret/pokegold/tree/fc702b6d922aecce274782d68bba8639936a1182).
- Deutsche Namen: [PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), ergänzt um historische Itemnamen.
- **Alle 251 Bilder werden lokal mitgeliefert:** originale Gold-Pixelbilder aus [PokeAPI/sprites](https://github.com/PokeAPI/sprites/tree/97a7832d307311c0e1c6ea9035308bf80cc94f81/sprites/pokemon/versions/generation-ii/gold/transparent), in zwei kompakten Bilddateien. Die Gold-Darstellungen werden für beide Editionen verwendet. Zur Laufzeit gibt es keine fremden Bildabrufe.
- Die früheren Story-Daten basieren auf der vom Projektinhaber bereitgestellten Nintendo-Power-Komplettlösung **Pokémon Gold & Silver (2000)**. PDF und Scans sind nicht im Repository enthalten.

Zugangsvoraussetzungen wurden für die empfohlene Reise kuratiert; Sonderfälle können zusätzliche Prüfung benötigen. Historische Verteilungen über externe Geräte und vollständige Attackentabellen sind nicht enthalten.

## Hosting und Entwicklung

GitHub Pages verwendet **main → /docs**. Änderungen auf `main` werden automatisch veröffentlicht; es gibt keinen Build-Schritt und keine Laufzeit-Paketabhängigkeiten.

```sh
python3 -m http.server 8080 --directory docs
```

Dann `http://localhost:8080/` öffnen. Benötigt wird ein aktueller Browser mit JavaScript-Modulen und `DecompressionStream`; die komprimierten Fangdaten werden lokal entpackt.

```sh
npm test
```

Tests benötigen Node.js ab Version 20, ohne Paketinstallation.

- `docs/assets/app.js`, `journey.css`: mobile Oberfläche, Gebietsauswahl, Detailfenster und Sicherungen.
- `docs/assets/journey-model.js`: offene und spätere Fänge, editionsabhängige Bezugsarten, Fundgruppen und Fangstatus.
- `docs/assets/collection-model.js`, `model.js`: Freischaltungen und kompatibles Speichermodell.
- `docs/data/collection-data.js`: komprimierter lokaler Fang-/Funddatensatz.
- `docs/data/gold-silver.js`: ältere Story-Daten zur Fortschrittskompatibilität.
- `docs/assets/pokemon-sprites-{1,2}.png`: zwei verlustfreie Bildatlanten mit je 16 × 8 Feldern à 56 × 56 Pixel; Arten 1–128 und 129–251.
- `tools/`: Datenpflege und Bildatlas-Erzeugung, siehe [tools/README.md](tools/README.md).
- `test/`: Prüfungen für Zugang, Editionen, globale Fangfilter, Entwicklungen und Sicherungen.

Aufgaben-, Gebiets- und Fund-IDs bleiben stabil. Inoffizielles Fanprojekt. Pokémon, Namen und Originalgrafiken gehören den jeweiligen Rechteinhabern.
