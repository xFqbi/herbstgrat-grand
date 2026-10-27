# Prüfung V9

Stand: 27. Oktober 2026. Ausgeführt im lokalen Chromium-Browser der Codex-App unter Windows. Mobile Prüfungen verwenden Bildschirmgrößen, keine physischen iOS-/Android-Geräte.

## Automatische Prüfungen

`npm test` führt drei Suiten aus:

- Migration: unveränderte V8-Blockmarkierungen, Aufgaben, Inventar, Notizen, unbekannte Zusatzfelder, Standort und Assistentencursor; alte Sicherungen; zusätzliche V8-/Werkzeugeinstellungen; Speicherplatzfehler; Schutz beschädigter Daten; Rückabwicklung fehlgeschlagener Importe.
- Datenintegrität: SHA-256 der unveränderten ursprünglichen V8-Blockliste, 9.881 eindeutige Positionen, 74 Materialtypen, Ebenen −19 bis 20, alle Scriptdateien syntaktisch gültig, referenzierte Dateien und Bedienelemente vorhanden, eindeutige HTML-IDs.
- Renderer: Werkbankanker, tatsächliche komprimierte Terrain-Daten, 25.637 Geländeoberflächen, vier Drehungen mit 16 Zellfällen, sechs Flächen-/UV-Richtungen, Schnittflächen, Baugruppen, Treppen-/Stufeneigenschaften, versteckte Innenflächen, gespeicherte und komprimierte ZIP-Einträge, Namespaces, Kisten-Entity-Atlanten, erstes Animationsbild, ungültige Archive, Lazy-Initialisierung, zusammengefasste Renderanforderungen, Leerlauf, Ersatzansicht und Freigabe von Ressourcen.

Gesamte Hausgeometrie im Node-Test: etwa 117–160 ms auf diesem Rechner; kein Leistungsversprechen für andere Geräte.

## Browserprüfungen

- Desktop 1280 und 1440 Pixel, Tablet 768 Pixel, Smartphone 390 und 320 Pixel: Hauptansichten ohne horizontalen Seitenüberlauf; lange Blockpläne bleiben gezielt innerhalb ihres eigenen Bereichs verschiebbar.
- Alle erhaltenen Bereiche geöffnet: Studio, Standort, Blockplan, Materialien, Bauschritte, Erdgeschoss, Geheimkeller, Dach/Fassade, Garten/Details, Galerie, Bergfotos, Werkzeuge und klassische 3D-Ansicht.
- Materialvorrat 137 eingegeben, +64 auf 201 erhöht, Neuladen: 201 blieb gespeichert. Testwert danach zurückgenommen. Direkte Eingaben speichern sofort, ohne den Fokus durch Neurendern zu verlieren.
- Aufgabe abgehakt und Notiz gespeichert; beide blieben nach Neuladen erhalten. Teständerungen zurückgenommen.
- Kellerboden Y −19 im Ebenenplan: 551 Blöcke. Im Assistenten dieselbe Ebene geöffnet, einen Block gebaut und rückgängig gemacht; Zähler 0 → 1 → 0. Fokus kehrte nach Schließen zur Startschaltfläche zurück.
- 90°-Drehung geprüft: Haus lokal 3/4/5 bei Ursprung −211/112/−389 ergibt Welt −206/116/−392. X um einen Block verschoben und zurückgesetzt. Gelände- und Hausschnitt-Regler geprüft.
- Standort-Ausgangsposition: 321 Hauspositionen in Gelände, 2.245 Positionen geplanter Keller-Aushub, 0 in Wasser, 2.252 oberhalb des Exportbereichs. Dies sind konservative Prüfwerte des bestehenden Entwurfs, keine Baufreigabe.
- Tatsächliche Minecraft-1.21.4-JAR aus der lokalen Installation importiert: 74 von 89 registrierten Texturen original, 15 verbleibende Vorschauen. Native PNG-Dekodierung, Deflate-Entpackung und IndexedDB-Speicherung funktionierten. Texturen erschienen nach Neuladen weiter; Gelände und Haus verwenden dieselbe Sammlung. Originaldateien wurden nicht in das Repository kopiert.
- Kellerfilter, Dach ausblenden, Schnitte, Ansichtswechsel, mobile Bereichsauswahl, Bereichssuche und PNG-Export geprüft. Export-PNG wurde visuell kontrolliert.
- Abschließender frischer Browserlauf: keine JavaScript-Fehler und keine Warnungen in den geprüften Abläufen.

## Verbleibende Grenzen

Kein Test auf einem physischen Mobilgerät oder in Safari/Firefox. Keine Messung mit gedrosseltem Mobilfunk und keine garantierte Bildrate auf schwachen GPUs. Die Ersatzansicht wurde automatisch getestet; WebGL-Kontextverlust wurde nicht im echten Browser erzwungen.

Das Original-Litematic liegt hier als vorhandener V8-Terrain-Export vor, ohne vollständige Blockstates. Exakte Orientierungen aller Gelände-/Dekoblöcke, Custom-Modelle, Shaderpacks, biomeabhängige Farben, vollständig sortierte Transparenz und funktionierende Redstone-Schaltungen sind damit nicht zugesichert. Vollständige Mod-Texturen benötigen die zugehörigen lokalen Dateien.
