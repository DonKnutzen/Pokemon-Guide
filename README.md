# PokéGuide · Gold & Silber

Deutscher Story-Guide für die originalen Game-Boy-Color-Spiele Pokémon Gold und Silber. Die erste Fassung begleitet den Spielverlauf von Neuborkia über Johto und die Pokémon-Liga bis Kanto und zum Silberberg.

## Funktionen

- 34 Abschnitte mit abhakbaren Schritten und freiwilligen Abstechern.
- Suche über deutsche und englische Namen sowie Aufgaben und Tipps.
- Getrennter Fortschritt für Gold und Silber, lokal im jeweiligen Browser gespeichert.
- Ordensammlung, Fortsetzen-Einstieg und direkte Links zu jedem Abschnitt.
- JSON-Sicherung für den manuellen Wechsel auf ein anderes Gerät; beim Laden werden erledigte Schritte ergänzt.
- Responsive Oberfläche ohne externe Schriftarten, kostenpflichtige APIs oder Laufzeit-Abhängigkeiten.

## GitHub Pages aktivieren

1. Im Repository **Settings → Pages** öffnen.
2. Unter **Build and deployment → Source** die Option **Deploy from a branch** wählen.
3. Branch **main** und Ordner **/docs** auswählen.
4. **Save** anklicken. Nach der Veröffentlichung zeigt GitHub hier den Website-Link an.

Alle Website-Dateien liegen in `docs/`. Ein Build-Schritt ist nicht nötig. Änderungen auf `main` werden nach aktivierter Pages-Konfiguration automatisch übernommen.

## Lokal ansehen und prüfen

Mit einem beliebigen statischen HTTP-Server den Ordner `docs/` bereitstellen, beispielsweise:

```sh
python3 -m http.server 8080 --directory docs
```

Danach `http://localhost:8080/` öffnen. Die HTML-Datei nutzt JavaScript-Module und sollte über HTTP statt direkt per `file://` geöffnet werden.

Für die Logik- und Inhaltsstrukturtests wird Node.js ab Version 20 benötigt. Es müssen keine Pakete installiert werden:

```sh
npm test
```

## Projektaufbau

- `docs/index.html`: Einstieg und Navigation.
- `docs/assets/style.css`: responsive Gestaltung.
- `docs/assets/app.js`: Oberfläche, Navigation, Suche sowie Speichern und Sichern.
- `docs/assets/model.js`: Fortschrittslogik und Prüfung importierter Sicherungen.
- `docs/data/gold-silver.js`: getrennte Inhalte, Editionsregeln und Quellenangaben.
- `test/guide.test.js`: Tests für Editionswechsel, Fortschritt, Suche, Sicherungen und Inhaltsschema.

Kapitel- und Aufgaben-IDs bleiben bei redaktionellen Änderungen stabil, damit gespeicherter Fortschritt erhalten bleibt. Weitere Spiele sollen eigene Datensätze und eigene Speicherschlüssel bekommen.

## Inhalt und Vorlage

Grundlage ist die vom Projektinhaber bereitgestellte Nintendo-Power-Komplettlösung **Pokémon Gold & Silver (2000)**. Die Schrittfolgen wurden eigenständig auf Deutsch formuliert. Jedes Kapitel nennt die betreffenden PDF-Seiten, gezählt ab der ersten Seite der Datei. Das Original-PDF und die Buchscans sind nicht Bestandteil des Repositorys.

Der aktuelle Umfang ist ein **Story-Guide**, keine vollständige Übertragung aller Buchtabellen. Fundortlisten aller Pokémon, vollständige Item- und Attackentabellen und detaillierte Raumpläne sind noch nicht enthalten. Die Inhalte gelten für Gold und Silber; Unterschiede zu Kristall oder HeartGold/SoulSilver dürfen nicht ungeprüft übernommen werden.

Fortschritt im Guide verändert keine Spielstände. Ohne manuelle Sicherung wird er nicht zwischen Geräten synchronisiert. Das Löschen der Browserdaten kann lokalen Fortschritt entfernen.

Inoffizielles Fanprojekt. Pokémon und zugehörige Namen gehören den jeweiligen Rechteinhabern. Die Landschaftsgrafik und das Projekt-Icon wurden für diese Oberfläche erstellt.
