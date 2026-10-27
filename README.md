# HERBSTGRAT GRAND · V9

Minecraft-Survival-Bauatelier auf Grundlage des unveränderten V8-Modells. Haus, Innenräume, Dachdetails, Geheimkeller, Materialvorräte und Baufortschritt bleiben erhalten. Die App benötigt weder Anmeldung noch einen Server für persönliche Daten.

## Benutzen

- **Übersicht:** nächster Bauschritt und Fortschritt.
- **3D-Studio:** Haus ohne Keller, komplette Base oder einzelne Bereiche; Dach ausblenden, Höhen schneiden, drehen, zoomen und PNG exportieren.
- **Standort:** echter Berg aus den vorhandenen `herbstgrat.litematic`-Exportdaten, Hausplatzierung und konservative Kollisionsprüfung.
- **Blockplan / Bauassistent:** Ebenen bis zum Kellerboden, einzelne Blöcke abhaken, Rückgängig und Weltkoordinaten.
- **Materialien:** Vorrat sofort speichern, Reserve berücksichtigen, TXT/CSV exportieren. Auf Mobilgeräten als Materialkarten.
- **Weitere Bereiche / Mehr:** Innenräume, Geheimkeller, Fassadendetails, Bilder, Notizen, Sicherungen, Fokus-Timer und Meilensteine.

Tastatur: `Strg/Cmd K` öffnet die Bereichssuche, `B` den Bauassistenten, `Esc` schließt Dialoge. Im Assistenten: Pfeiltasten für vor/zurück, `G` zum Abhaken. Bewegungen folgen der Systemeinstellung „Bewegung reduzieren“.

## Originaltexturen

Im 3D-Studio die Minecraft-Client-JAR aus der eigenen Installation wählen. Sie kann je nach Launcher `client.jar` oder beispielsweise `<Version>.jar` heißen. Danach können Resourcepacks oder Mod-JARs zusätzlich importiert werden. Der Import verarbeitet ZIP/JAR direkt im Browser und speichert die benötigten Texturen lokal in IndexedDB. Haus und Berg verwenden dieselbe Textursammlung; der Berg muss vor dem Import nicht geöffnet werden.

Es werden keine Originaltexturen öffentlich mitgeliefert. Eingebaute Texturen sind eigens erzeugte Vorschauen. Der Status nennt die Zahl originaler und fehlender Texturen. Die Herbstblätter und weitere Modblöcke benötigen die passenden Moddateien. Animierte Texturen zeigen das erste Bild, HD-Texturen werden auf 32×32 normalisiert.

## Kalibrierung und Genauigkeit

Werkbank Welt **−210 / 110 / −354** = Terrain lokal **30 / 57 / 80**. Daraus folgt der Terrain-Offset **−240 / 53 / −434**. Der Import prüft den tatsächlichen Werkbankblock an dieser Stelle.

Die vorgeschlagene Hausposition **−211 / 112 / −389** ist der Haus-Nullpunkt, nicht die Werkbankposition. Haus-X/Y/Z werden mit der gewählten Vierteldrehung in Weltkoordinaten umgerechnet. 3D, Ebenen, Assistent und CSV verwenden dieselbe Zellkonvention, auch bei 90°, 180° und 270°.

Die Geländeauswahl umfasst 120×67×116 Zellen und endet bei Welt-Y 119. Darüber und außerhalb des Exports sind Kollisionen unbekannt. Keller-Aushub wird separat von Hauskollisionen gezählt. Stützen werden heuristisch beurteilt, Treppen und Stufen bei Kollisionen als Vollblöcke.

Die vorhandenen Daten enthalten keine vollständigen Blockstates. Treppenrichtungen werden deshalb teilweise abgeleitet; Türen, Zäune und Möbel bleiben angenähert. Der Renderer kann vorhandene optionale Stair-/Slab-Properties auswerten, ist aber kein vollständiger Minecraft-Blockmodell- oder Shaderpack-Renderer. Redstone-Räume bleiben der bestehende Bauentwurf; eine funktionierende Schaltung muss in der jeweiligen Minecraft-Version getestet werden. Details: [Renderer-Dokumentation](assets/world-viewer.md).

## Gespeicherte Fortschritte

V8 nutzte für den Hauptspielstand weiterhin `herbstgrat-grand-v5`. V9 übernimmt Aufgaben, Vorräte, unveränderte Block-IDs, Notizen, Hausposition, Filter und Assistentenposition nach `herbstgrat-grand-v9`. Der alte Schlüssel bleibt als Wiederherstellungskopie erhalten. Zusätzliche V8- und Werkzeug-Einstellungen bleiben nutzbar. Beschädigte neue Daten werden nicht stillschweigend überschrieben; bei Platzmangel bleibt die App im Arbeitsspeicher benutzbar.

Die automatische Übernahme funktioniert im selben Browser unter derselben Herkunft, zum Beispiel auf der bisherigen GitHub-Pages-Adresse. Für Browser- oder Gerätewechsel unter **Werkzeuge → Sicherung exportieren/importieren** arbeiten. Alte V5/V8-Sicherungen werden angenommen. Originaltexturen müssen auf einem anderen Gerät erneut importiert werden; die frühere V8-Atlasablage bleibt erhalten, wird aber nicht als vollständiges Originalpaket ausgegeben.

