# PokéGuide · Gold & Silber

Deutscher Story- und Sammelbegleiter für die originalen Game-Boy-Color-Spiele Pokémon Gold und Silber.

**Website:** https://donknutzen.github.io/Pokemon-Guide/

## Funktionen

- **Durchspielen:** 34 Story-Abschnitte von Neuborkia über die Liga und Kanto bis zum Silberberg, mit Aufgaben und allen 16 Orden.
- **Sammelreise:** 94 Gebiete in einer empfohlenen Reihenfolge. „Erstmals wild“ zeigt Arten, die an früheren Orten dieser Route noch nicht wild fangbar waren. Tageszeiten, Edition, Fangmethode und spätere Zugangsvoraussetzungen bleiben sichtbar.
- **Items:** einzeln abhakbare sichtbare und versteckte Funde, Gesprächsbelohnungen und Baumfunde. Ladenangebote und zufällige getragene Items stehen zusätzlich bereit.
- **Rückkehrziele:** noch offene Fänge und Funde in besuchten Gebieten, die durch neue Ausrüstung oder Story-Fortschritt erreichbar werden.
- **Pokédex:** 251 Arten mit Fang-, Geschenk-, Tausch-, Entwicklungs- und Zuchthinweisen. Externe Tausch-/Eventquellen sind gekennzeichnet.
- Getrennte Gold-/Silber-Sammlungen, lokale Speicherung und JSON-Sicherungen. Bisherige Story-Sicherungen bleiben kompatibel.
- Responsive Oberfläche ohne externe Schriftarten, kostenpflichtige APIs oder JavaScript-Paketabhängigkeiten.

In der Sammelreise zuerst Edition, Starter und tatsächlichen Spielstand bestätigen. Passende Story-Häkchen und eingesammelte Ausrüstung ergänzen Freischaltungen automatisch. „Gebiet besucht“ schaltet keine VM frei. Spielzeit und Wochentag beziehen sich auf die Uhr des Spiels.

## Umfang und Vergleichsregel

Der Reiseplan verwendet eine feste empfohlene Reihenfolge. Manche Abstecher sind bei anderer Wegwahl früher möglich; „Erstmals wild“ ist kein global optimierter Geschwindigkeitsrekord. Eine bereits geschenkte Art kann später trotzdem erstmals *wild* fangbar sein. Der eigene Fangstatus wird separat gespeichert.

Pro Edition sind 136 sichtbare Bodenfunde, 87 versteckte Fundstellen, 107 Gesprächs-/Belohnungseinträge und 30 Baumfunde erfasst. Dazu kommen Ladenangebote und 83 Art-/Item-Kombinationen für getragene Items. Turnier-, Lotterie-, Freundschafts- und Auftragsbedingungen stehen beim Eintrag; ein erreichbarer Ort garantiert einen solchen Erfolg nicht. Wiederholbare Quellen zählen als Bezugsort, nicht als begrenzter Gesamtvorrat.

Der Rasterplan zeigt Fund- und Personenpositionen mit Norden oben. Er bildet keine Wege, Wasserflächen oder Hindernisse ab. Die Inhalte gelten für Gold und Silber, nicht für Kristall oder HeartGold/SoulSilver. Attackentabellen und Spezialverteilungen über historische externe Geräte sind nicht Bestandteil dieses Guides. Die Zugangsvoraussetzungen wurden für den empfohlenen Spielverlauf kuratiert; Sonderfälle können weitere redaktionelle Prüfung benötigen.

## Hosting und lokale Prüfung

GitHub Pages verwendet **main → /docs**. Änderungen auf `main` werden automatisch veröffentlicht. Ein Build-Schritt ist nicht nötig.

Mit einem statischen HTTP-Server den Ordner `docs/` bereitstellen:

```sh
python3 -m http.server 8080 --directory docs
```

Danach `http://localhost:8080/` öffnen. Es wird ein aktueller Browser mit JavaScript-Modulen und `DecompressionStream` benötigt. Die komprimierten Fang-/Funddaten werden lokal im Browser entpackt; zur Laufzeit wird kein Datendienst abgefragt.

Die Tests benötigen Node.js ab Version 20, ohne Paketinstallation:

```sh
npm test
```

## Projektaufbau und Datenpflege

- `docs/assets/app.js`, `model.js`: Story-Oberfläche, Navigation, Speichern und Sichern.
- `docs/assets/collection-model.js`, `collection-view.js`: Zugangsregeln und Sammelbereiche.
- `docs/assets/style.css`, `collection.css`: responsive Gestaltung.
- `docs/data/gold-silver.js`: Story-Inhalte, Editionsregeln und PDF-Seitenbezüge.
- `docs/data/collection-data.js`: komprimierter lokaler Fang-/Funddatensatz.
- `tools/build_collection.py`, `curate_collection.py`: Extraktion und deutsche redaktionelle Regeln; Eingaben siehe [tools/README.md](tools/README.md).
- `test/`: Prüfungen für Editionen, Neu-Vergleich, Zugangsvoraussetzungen, Rückkehrziele und Sicherungen.

Aufgaben- und Fundort-IDs bleiben bei redaktionellen Änderungen stabil, damit gespeicherter Fortschritt erhalten bleibt. Weitere Spiele benötigen eigene Datensätze und Speicherschlüssel.

## Quellen

Die Story basiert auf der vom Projektinhaber bereitgestellten Nintendo-Power-Komplettlösung **Pokémon Gold & Silver (2000)**, eigenständig auf Deutsch formuliert. Die Kapitel nennen PDF-Seiten ab der ersten Dateiseite. PDF und Scans sind nicht im Repository enthalten.

Fangtabellen, Item-Ereignisse, Positionen, Entwicklungsregeln und getragene Items stammen aus dem [pret/pokegold-Quellsnapshot](https://github.com/pret/pokegold/tree/fc702b6d922aecce274782d68bba8639936a1182). Deutsche Namen wurden mit [PokéAPI-Daten](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) abgeglichen und für Generation II ergänzt. Es wird kein ROM benötigt oder verteilt.

Fortschritt im Guide verändert keinen Spielstand. Ohne manuelle Sicherung gibt es keine geräteübergreifende Synchronisation. Das Löschen der Browserdaten kann lokalen Fortschritt entfernen.

Inoffizielles Fanprojekt. Pokémon und zugehörige Namen gehören den jeweiligen Rechteinhabern. Landschaftsgrafik und Projekt-Icon wurden für diese Oberfläche erstellt.
