# Million Dollar Grid — Fortschritt

## Projektziel
Website nach dem Vorbild der "Million Dollar Homepage":
- 1.000.000 Kästchen in einem 1000×1000 Raster
- Kästchen können einzeln oder als Block gekauft werden
- Käufer laden ein Bild hoch
- Zoom & Pan Funktion
- Random-Modus (TikTok-Style) mit Likes & Links

---

## Erledigte Schritte

### Schritt 1 — Programme installiert
- [x] Node.js installiert
- [x] VS Code installiert
- [x] Git installiert

### Schritt 2 — Projektordner
- [x] Ordner `D:\million-dollar-grid` erstellt
- [x] Ordner in VS Code geöffnet

### Schritt 3 — Projekt initialisiert
- [x] PowerShell Skript-Ausführung erlaubt: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
- [x] Next.js installiert: `npx create-next-app@latest .` (mit empfohlenen Defaults)
- [x] Entwicklungsserver gestartet: `npm run dev`
- [x] Website läuft auf: http://localhost:3000

### Schritt 4 — Erste eigene Seite
- [x] `app/page.tsx` geleert und mit eigener Startseite ersetzt

### Schritt 5 — Canvas Raster
- [x] `app/components/Grid.tsx` erstellt — 1000×1000 Raster via HTML Canvas
- [x] Zoom mit Scrollrad
- [x] Pan (Verschieben) mit Maus halten + ziehen
- [x] Hover-Highlight beim Überfahren von Kästchen

### Schritt 6 — Kauf-Dialog
- [x] `app/components/CellModal.tsx` erstellt
- [x] Klick auf Kästchen öffnet Dialog mit Position und Preis (1,00 €)
- [x] Kaufbutton vorhanden (Zahlung noch nicht aktiv)

---

## Aktueller Stand
Vollständiges Raster mit Zoom/Pan. Kauf-Dialog öffnet sich beim Klick auf ein Kästchen.

---

### Schritt 7 — Supabase Datenbank
- [x] Supabase Projekt erstellt (Frankfurt, kostenlos)
- [x] `.env.local` mit URL und API Key angelegt (sicher in .gitignore)
- [x] `npm install @supabase/supabase-js` installiert
- [x] `app/lib/supabase.ts` Verbindungsdatei erstellt
- [x] Tabelle `cells` mit Spalten: id, created_at, x, y, image_url, owner_email
- [x] Website lädt gekaufte Kästchen aus DB und zeigt sie gold an
- [x] Bereits gekaufte Kästchen zeigen "Bereits gekauft" im Dialog

### Schritt 8 — Stripe Zahlungsabwicklung
- [x] Stripe Account erstellt (Test-Modus)
- [x] `npm install stripe @stripe/stripe-js` installiert
- [x] Stripe Keys in `.env.local` eingetragen
- [x] `app/api/checkout/route.ts` — erstellt Stripe Checkout Session
- [x] `app/success/page.tsx` — Erfolgsseite nach Zahlung
- [x] Kästchen wird nach Zahlung in DB gespeichert
- [x] Rechtsklick öffnet keinen Dialog mehr

### Schritt 9 — Bildupload
- [x] Supabase Storage Bucket `cell-images` erstellt (public)
- [x] Upload-Policy für anonyme Nutzer eingerichtet
- [x] Bildupload auf Erfolgsseite nach Zahlung
- [x] Bilder erscheinen auf dem Canvas im Raster

### Schritt 10 — Block-Kauf & UI-Verbesserungen
- [x] Größenauswahl (1×1, 2×2, 5×5, 10×10, benutzerdefiniert n×n)
- [x] Block leuchtet beim Hover nach oben-links auf
- [x] Kauf-Modus Button unten — wechselt zwischen Normal und Kauf-UI
- [x] Zufälliges freies Kästchen finden mit Block-Highlight
- [x] Block-Bilder strecken sich über den ganzen Block
- [x] Rechtsklick öffnet keinen Dialog
- [x] Bild-Großansicht beim Klick auf gekauftes Kästchen

## Nächste Schritte (geplant)
1. Deployment auf Vercel

---

## Wichtige Befehle

| Befehl | Wofür |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `Strg + C` | Server stoppen |

## Wichtige Dateien

| Datei | Wofür |
|---|---|
| `app/page.tsx` | Hauptseite der Website |
| `app/layout.tsx` | Grundlayout (gilt für alle Seiten) |

---

## Tech Stack
- **Next.js** — Framework für die Website (Frontend + Backend)
- **Tailwind CSS** — Styling (wird automatisch mitgeliefert)
- **Supabase** — Datenbank & Bildupload (kommt noch)
- **Stripe** — Zahlungsabwicklung (kommt noch)
- **Vercel** — Hosting (kommt noch)
