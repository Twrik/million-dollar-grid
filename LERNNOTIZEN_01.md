# Lernnotizen — Session 1
**Datum:** 11.06.2026  
**Projekt:** Million Dollar Grid

---

## 1. Das Terminal
**Was ist es?**  
Das Terminal ist ein Textfenster in dem man dem Computer direkt Befehle eintippen kann. Statt auf Buttons zu klicken, schreibt man Anweisungen.

**Wozu braucht man es?**  
Als Entwickler nutzt man das Terminal ständig — zum Installieren von Programmen, Starten der Website, und vielem mehr.

**In VS Code öffnen:**  
Strg + ` (Backtick, links neben der 1)

**Beispiele:**
- `npm run dev` → Website starten
- `npm install paketname` → Ein Paket installieren

---

## 2. Next.js
**Was ist es?**  
Next.js ist ein Framework — ein fertiger Baukasten für Websites. Man muss nicht alles selbst bauen, sondern bekommt viele Dinge gratis dazu.

**Wozu braucht man es?**  
Es kümmert sich automatisch um: Seiten anzeigen, schnelles Laden, Verbindung zum Backend. Fast alle modernen Websites nutzen sowas.

**Wie startet man es?**  
`npm run dev` im Terminal → dann Browser auf http://localhost:3000

**Wichtige Dateien:**
- `app/page.tsx` → Die Hauptseite (was der Besucher sieht)
- `app/layout.tsx` → Das Grundgerüst (gilt für alle Seiten)
- `app/components/` → Wiederverwendbare Bausteine

---

## 3. TSX Dateien
**Was ist es?**  
TSX ist eine Mischung aus TypeScript (Programmiersprache) und HTML. Man schreibt darin was der Browser anzeigen soll.

**Beispiel:**
```tsx
export default function Home() {
  return (
    <h1>Hallo Welt</h1>
  );
}
```
Das `<h1>` ist HTML — eine große Überschrift. Der Rest ist TypeScript.

---

## 4. HTML Canvas
**Was ist es?**  
Canvas ist eine Zeichenfläche im Browser. Man kann darauf Linien, Rechtecke und Bilder zeichnen — mit Code.

**Wozu haben wir es benutzt?**  
Ein normales HTML-Raster mit 1.000.000 Kästchen würde den Browser zum Absturz bringen. Canvas ist viel schneller weil es nur ein einziges Element ist — wir zeichnen das Raster selbst als Bild.

**Zoom & Pan:**  
Mit `ctx.translate()` und `ctx.scale()` verschiebt und vergrößert man die Zeichenfläche — so entsteht der Zoom-Effekt.

---

## 5. Komponenten
**Was ist es?**  
Eine Komponente ist ein wiederverwendbarer Baustein der Website. Zum Beispiel ist unser Kauf-Dialog eine Komponente (`CellModal.tsx`) — man könnte ihn an vielen Stellen einbauen.

**Unsere Komponenten:**
- `Grid.tsx` → Das Raster
- `CellModal.tsx` → Der Kauf-Dialog

---

## 6. .env.local Datei
**Was ist es?**  
Eine Datei für geheime Einstellungen die nur auf deinem Computer existieren. "ENV" steht für Environment Variables (Umgebungsvariablen).

**Warum geheim?**  
Der API Key ist wie ein Passwort zur Datenbank. Würde er im Code stehen, könnte ihn jeder sehen der den Code sieht.

**Wichtig:**  
Diese Datei wird nie ins Internet hochgeladen — Next.js schützt sie automatisch über die `.gitignore` Datei.

**Inhalt unserer Datei:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 7. Datenbank (Supabase)
**Was ist es?**  
Eine Datenbank ist wie eine riesige Excel-Tabelle im Internet. Daten werden dauerhaft gespeichert — auch wenn die Website neu geladen wird.

**Wozu brauchen wir sie?**  
Wir speichern dort welche Kästchen bereits gekauft wurden, von wem, und welches Bild draufkommt.

**Unsere Tabelle "cells":**
| Spalte | Typ | Bedeutung |
|---|---|---|
| id | Zahl | Eindeutige Nummer jedes Eintrags |
| x | Zahl | Spalte des Kästchens (0–999) |
| y | Zahl | Zeile des Kästchens (0–999) |
| image_url | Text | Link zum hochgeladenen Bild |
| owner_email | Text | E-Mail des Käufers |
| created_at | Datum | Wann wurde es gekauft |

---

## 8. SQL
**Was ist es?**  
SQL ist die Sprache mit der man mit Datenbanken redet. Sie liest sich fast wie normales Englisch.

**Beispiele:**
```sql
-- Daten einfügen:
INSERT INTO cells (x, y, owner_email) VALUES (500, 500, 'test@test.de');

-- Daten lesen:
SELECT * FROM cells;

-- Tabelle ändern:
ALTER TABLE cells ADD COLUMN image_url text;
```

---

## 9. API Key
**Was ist es?**  
Ein API Key ist wie ein Passwort das unsere Website benutzt um mit Supabase zu reden. Nur wer den Key kennt darf auf die Datenbank zugreifen.

**Publishable Key vs. Secret Key:**
- Publishable Key → Darf im Browser benutzt werden (sicherere Version)
- Secret Key → Nur auf dem Server, niemals im Browser!

---

## Wichtige Befehle zum Merken

| Befehl | Bedeutung |
|---|---|
| `npm run dev` | Website starten |
| `npm install paket` | Paket installieren |
| Strg + S | Datei speichern |
| Strg + ` | Terminal öffnen |
| Strg + Z | Rückgängig |
