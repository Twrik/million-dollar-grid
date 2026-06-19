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

### Schritt 11 — Sicherheits-Review (50 Punkte durchgegangen)
- [x] Row-Level-Security (RLS) auf allen Tabellen aktiviert (cells, comments, reports, usernames)
- [x] Admin-Routen abgesichert (`app/api/admin/_auth.ts` prüft Cookie-Auth + ADMIN_EMAIL, Service Role Key nur serverseitig)
- [x] Upload-Validierung: Magic-Bytes-Check (JPEG/PNG/GIF/WebP), 2MB Limit, Rate Limiting
- [x] Dual-Auth-Pattern für Upload/Save-Link: Stripe `session_id` ODER Cookie-Auth + DB-Ownership-Check
- [x] Rate Limiting (`app/lib/ratelimit.ts`, In-Memory Map) auf Upload/Like/Comment-Vote/Checkout
- [x] Security Headers in `next.config.ts` (X-Frame-Options, HSTS, Permissions-Policy etc.)
- [x] Source Maps in Produktion deaktiviert
- [x] Fehlermeldungen generisch gemacht (keine internen DB-Fehler an Client)
- [x] CVE-Fix: postcss override in package.json

### Schritt 12 — Design & Mobile-Optimierung
- [x] Design-Research durchgeführt, Farbpalette/Layout-Feedback eingearbeitet (Gold-Theme behalten)
- [x] Mobile-Header-Overlap gefixt (Counter/Titel/User-Bereich responsive gestapelt)
- [x] Touch-Support fürs Grid: Pinch-to-Zoom, Touch-Pan, Tap-to-Select
- [x] Viewport-Meta-Tag ergänzt (fehlte komplett — Ursache für viele Mobile-Bugs)
- [x] Canvas-Resize-Bug gefixt (Grid verschwand/verschob sich bei Adressleisten-Ein/Ausklappen)
- [x] Bilder werden jetzt auch bei starkem Rauszoomen als Vorschau gezeigt (downscaled statt Flatfarbe)
- [x] Tap-zum-Markieren-dann-Tap-zum-Kaufen Flow für Mehrfach-Zellen-Blöcke auf Touch-Geräten
- [x] Cross-Device-Like-Sync (neue Tabelle `cell_likes`, vorher nur localStorage pro Gerät)
- [x] `owner_email`-Fallback beim Kauf (Cookie-Auth schlägt auf Mobile manchmal fehl)
- [x] Fehleranzeigen bei fehlgeschlagenen Supabase-Requests (Leaderboard, My Cells)

### Schritt 13 — Deployment & Domain
- [x] GitHub-Repo erstellt (`Twrik/million-dollar-grid`), Repo auf public gestellt (Hobby-Plan-Limit)
- [x] Vercel-Projekt verbunden, Environment Variables eingetragen
- [x] Eigene Domain gekauft: `milliondollargrid.company` (über Vercel, $3.99/Jahr)
- [x] Domain mit Projekt verbunden, läuft

### Schritt 14 — Rechtliches (teilweise)
- [x] Datenschutzerklärung erstellt (`app/privacy/page.tsx`)
- [x] Widerrufsrecht-Checkbox vor Kauf eingebaut (`CellModal.tsx`) — Nutzer muss aktiv bestätigen
- [ ] **Impressum fehlt noch** — baut der Nutzer selbst (`/impressum`, Datenschutzerklärung verlinkt schon dorthin)

## Nächste Schritte (geplant)
1. **Impressum erstellen** (Nutzer macht das selbst — braucht echten Namen + Adresse)
2. **Stripe Live-Modus aktivieren** — Konto wird aktuell von Stripe verifiziert (1-2 Werktage), danach:
   - Live-Keys aus Stripe Dashboard holen (`pk_live_...` / `sk_live_...`)
   - In Vercel Environment Variables ersetzen (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`)
   - Redeploy auslösen

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
- **Tailwind CSS** — Styling
- **Supabase** — Datenbank, Storage, Auth
- **Stripe** — Zahlungsabwicklung (aktuell Test-Modus, Live-Verifizierung läuft)
- **Vercel** — Hosting

## Live-Links
- Seite: https://milliondollargrid.company
- GitHub: https://github.com/Twrik/million-dollar-grid
- Vercel-Projekt: million-dollar-grid-5ntd
