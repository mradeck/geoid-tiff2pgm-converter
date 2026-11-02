# Geoid-TIFF 2 PGM Converter — Hinweise für Claude

Next.js mit statischem Export nach `out/`, Netlify (Git-verknüpft, `main`). Version zentral in `app/lib/version.ts` und `package.json`. Kontaktformular über Netlify Forms (`geoid-tiff2pgm-contact`); das versteckte Registrierungsformular in `app/page.tsx` muss alle gesendeten Felder führen. Prüfen: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Gemeinsame Regeln der Vermessertools

Für diese App gelten die gemeinsamen Regeln aller öffentlichen Vermessertools von Michael Radeck (Version `Jahr.Push.Iteration`, Look wie Geodata Inspector & Cleaner, Kopf- und Fußleisten, Sprache/Interface, Schrift Inter, Favicon, Prüfung). Sie stehen an einer Stelle: `CLAUDE-APPS.md` im privaten Repo [mradeck/vermessertools-notizen](https://github.com/mradeck/vermessertools-notizen/blob/main/CLAUDE-APPS.md). Bei Arbeit an dieser App das Repo in die Sitzung holen und die Datei lesen. Diese CLAUDE.md enthält nur app-eigene Regeln.

**Notizen nachziehen:** Nach jedem Push dieser App auf `main` in derselben Sitzung im Repo `mradeck/vermessertools-notizen` die Projektseite der App und die Zeile in `Übersicht Vermessertools Code Entwicklung.md` (samt Änderungsprotokoll) aktualisieren.
