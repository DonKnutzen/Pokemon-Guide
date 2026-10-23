# Konten für PokéGuide aktivieren

Die Website bleibt unter https://donknutzen.github.io/Pokemon-Guide/. Supabase stellt Anmeldung und die private Fortschrittsdatenbank bereit. Im Repository sind Oberfläche, Schema und Synchronisierung vorbereitet; ohne Projektkonfiguration ist die Live-Seite lokal nutzbar und zeigt noch keine Registrierungsformulare.

## Einmalige Einrichtung

1. Im eigenen Supabase-Konto ein Projekt im Free-Tarif anlegen. In dieser Änderung wird kein Projekt angelegt und kein kostenpflichtiger Tarif gebucht.
2. Im SQL Editor den Inhalt von [`migrations/001_progress.sql`](migrations/001_progress.sql) einmal ausführen. Bei einem bereits angewendeten Schema die Migration nicht erneut ausführen.
3. Unter Authentication → URL Configuration die **Site URL** auf `https://donknutzen.github.io/Pokemon-Guide/` setzen und diese URL in die zulässigen Redirect URLs aufnehmen. Falls der Anbieter Hash-Rücksprünge separat prüft, außerdem `https://donknutzen.github.io/Pokemon-Guide/#account` zulassen. E-Mail/Passwort aktivieren; E-Mail-Bestätigung eingeschaltet lassen. Die App verlangt für neue Passwörter mindestens 10 Zeichen; dieselbe Mindestlänge im Projekt einstellen.
4. Projekt-URL und **publishable key** aus den Project Settings/API Keys in [`../docs/data/cloud-config.js`](../docs/data/cloud-config.js) eintragen. Alternativ wird ein früherer `anon`-JWT akzeptiert. Diese beiden Werte sind öffentliche Browserkonfiguration. **Keine** Secret-, `service_role`-, Datenbankpasswörter oder persönlichen Zugriffstokens in das Repository schreiben.
5. Auf `main` übernehmen und den erfolgreichen Pages-Deploy abwarten. Die Kontoseite bietet dann Registrierung, Login und Passwort-Zurücksetzen an.
6. Mit einem eigenen Testkonto Registrierung und E-Mail-Bestätigung durchführen. Anschließend auf zwei Geräten anmelden, unterschiedliche Fänge/Items erfassen, „Jetzt synchronisieren“ nutzen und eine Rücknahme prüfen.

Eine vorhandene lokale Sammlung wird nach dem Anmelden als separate Übernahme angeboten. Nach Übernahme bleiben die lokalen Originaldaten erhalten. Bei Abmeldung wechselt die App zur lokalen Gastsammlung, während der Kontostand in einem eigenen Cache und in der Datenbank bleibt.

## Daten und Zugriffsrechte

`pokeguide_records` enthält nur `user_id`, Fortschrittsschlüssel, Wert, logischen Änderungsstempel und Aktualisierungszeit. E-Mail/Passwort werden von Supabase Auth verwaltet. `auth.uid()` bestimmt die Eigentümer-ID; es wird keine vom Browser angegebene Nutzer-ID für Schreibzugriffe verwendet. Row Level Security gilt für Lesen, Anlegen und Aktualisieren. Anonyme Zugriffe auf Tabelle und Schreibfunktion sind gesperrt.

Die Funktion `apply_pokeguide_records` läuft mit `SECURITY INVOKER`, behält die RLS-Prüfung bei und führt neuere Änderungen pro Schlüssel atomar zusammen. Batches sind auf 400 Einträge und 1 MiB begrenzt. Rücknahmen bleiben als Werte erhalten, statt Datensätze zu löschen. API-Anfragen tragen den zum Beginn des Abgleichs festgehaltenen Nutzertoken, sodass ein Kontowechsel laufende Daten nicht in ein anderes Konto verschiebt.

Gastsammlung und Konten haben getrennte lokale Speicher. Ein Kontowechsel bricht die Annahme alter Antworten ab. Ein gescheiterter Schreibvorgang bleibt ausstehend. Eine während eines Schreibvorgangs neu vorgenommene Änderung wird erst nach Bestätigung ihres eigenen Stempels als synchronisiert behandelt.

## Prüfungen

```sh
npm test
```

Die Tests prüfen Migration, Reihenfreigabe, Editionsgrenzen, alte Backups, konkurrierende Änderungen, Rücknahmen, Offline-Zustände, paginierte Synchronisierung und Tokenbindung mit dem tatsächlich mitgelieferten SDK.

Das Schema lässt sich zusätzlich in einer lokalen PostgreSQL-Instanz über PGlite prüfen. Das Hilfsskript greift auf keine echte Supabase-Datenbank zu:

```sh
npm install --prefix /tmp/pokeguide-postgres-qa @electric-sql/pglite --no-save --ignore-scripts --no-package-lock
node tools/verify_cloud_schema.mjs /tmp/pokeguide-postgres-qa/node_modules/@electric-sql/pglite/dist/index.js
```

Es prüft Migration, zwei getrennte Konten, verweigerte fremde Eigentümer-IDs, gesperrte anonyme Zugriffe und das Verwerfen älterer Schreibvorgänge. **Die echte Registrierung, E-Mail-Zustellung und der Abgleich zweier Geräte müssen nach Verbindung des Projekts separat geprüft werden.**

## Primärdokumentation

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys
