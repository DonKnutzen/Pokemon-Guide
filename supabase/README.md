# Trainerkonten mit Nutzername und PIN

Die Website liegt weiter unter https://donknutzen.github.io/Pokemon-Guide/. Supabase übernimmt Anmeldung, Sitzungen und die private Fortschrittsdatenbank. Die veröffentlichte App ist mit dem Projekt `wrmlkpuhyqxkehbvzoxx` verbunden.

## Nutzung

Auf der Kontoseite „Neues Trainerkonto erstellen“ wählen. Benötigt werden ein Nutzername mit 3–24 Zeichen (ASCII-Buchstaben, Zahlen, `_`, `-`) und genau vier Buchstaben oder Zahlen als PIN. Namen sind unabhängig von Groß-/Kleinschreibung eindeutig, PINs unterscheiden sie. Die Registrierung meldet direkt an; es wird keine E-Mail versendet.

Die lokale Gastsammlung wird nur durch „Lokale Sammlung übernehmen“ zum Konto hinzugefügt. Abmelden öffnet wieder die Gastsammlung. Fänge sind pro Reihe gemeinsam, Items und Reisen pro Edition getrennt. Eine vergessene PIN lässt sich ohne unabhängigen Identitätsnachweis nicht selbst zurücksetzen.

## Eigenes Projekt einrichten

1. Alle SQL-Dateien aus `migrations/` in Dateireihenfolge einmal anwenden. Bereits angewendete Migrationen nicht wiederholen. `pgcrypto` muss unter `extensions` verfügbar sein (im verbundenen Projekt bereits installiert).
2. `functions/trainer-auth/` als Edge Function `trainer-auth` deployen. Die Konfiguration `verify_jwt = false` ist beabsichtigt: Der öffentliche Login-Endpunkt authentifiziert selbst anhand von Nutzername und PIN. Auth-JWTs gibt es erst danach. Beispielsweise mit `supabase functions deploy trainer-auth --project-ref <ref>`; die Konfiguration steht in `config.toml`.
3. Die Standard-Umgebungsvariablen `SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` stehen dem gehosteten Edge-Runtime zur Verfügung. Der Service-Schlüssel darf ausschließlich dort verwendet werden, niemals im Browser oder im Repository.
4. Projekt-URL und **publishable key** in `docs/data/cloud-config.js` hinterlegen. Diese Konfiguration ist öffentlich; `service_role`- oder Secret-Schlüssel gehören dort niemals hinein.
5. Bei einer anderen Website-Adresse die erlaubten CORS-Ursprünge in `functions/trainer-auth/index.ts` anpassen und erneut deployen. Die Standardadresse sowie lokale Vorschauen sind hinterlegt. E-Mail-Redirects sind für diesen Login nicht nötig.

## Authentifizierung und Datenzugriff

`pokeguide_private.trainers` enthält normalisierten Nutzernamen, Anzeigenamen, Nutzer-ID, internen zufälligen Auth-Alias und gesalzenen bcrypt-Hash (Kostenfaktor 12). Das Schema ist nicht in der Data API exponiert; `anon` und `authenticated` haben weder Schema- noch Tabellenzugriff. RLS ist auch für die privaten Tabellen aktiviert. PINs werden nicht geloggt, in Metadaten gespeichert oder an den Browser zurückgegeben.

Die zwei `SECURITY DEFINER`-Funktionen für die PIN-Prüfung und Registrierung haben einen leeren `search_path` und sind ausschließlich für `service_role` ausführbar. Ein atomarer Zähler begrenzt auf fünf Versuche pro Nutzername und 90 pro IP in 15 Minuten; ein erfolgreicher Login setzt nur den Namenszähler zurück. Unbekannte Namen durchlaufen ebenfalls bcrypt. Die Limit-Einträge werden beim nächsten Versuch nach Ablauf des Zeitfensters wiederverwendet.

Nach erfolgreicher PIN-Prüfung erzeugt die Edge Function serverseitig einen einmaligen Supabase-Loginbeweis und löst ihn sofort ein. Es wird keine E-Mail versendet. Der Browser erhält nur eine normale Auth-Sitzung und verwendet das lokal mitgelieferte offizielle SDK zur Sitzungserneuerung. Die internen Auth-Konten verwenden zufällige Alias-Adressen und zufällige lange Passwörter; die vierstellige PIN wird nicht als Supabase-Passwort eingesetzt.

`public.pokeguide_records` ist durch RLS auf `auth.uid() = user_id` begrenzt. Die Fortschritts-RPC `apply_pokeguide_records` läuft als `SECURITY INVOKER`; sie kann keine Berechtigungen erweitern. Anonyme Besucher haben keinen Fortschrittszugriff. Konten verwenden getrennte Browser-Caches und Synchronisationsvorgänge bleiben an die ursprüngliche Sitzung gebunden.

## Prüfung

`npm test` prüft unter anderem getrennte Konten-/Reihenmodelle, Offline-Zusammenführung und an die ursprüngliche Sitzung gebundene Requests mit dem echten Supabase-SDK. Die Anmeldung wird zusätzlich gegen das gehostete Backend geprüft: Registrierung, PIN-Format, falsche PIN, Namensnormalisierung, Versuchslimits, erneute Anmeldung, Sitzungserneuerung sowie gegenseitiger Zugriffsschutz zweier Konten.

Der optionale Live-Test `node tools/verify_trainer_auth.mjs` erstellt zwei neue Testkonten. Mit `QA_RECEIPT=/tmp/pokeguide-qa.json` werden deren IDs für eine gezielte anschließende Bereinigung durch den Projektadministrator festgehalten. Zugangsdaten und Sitzungstokens werden nicht ausgegeben. Der Live-Test gehört nicht zum normalen `npm test`.
