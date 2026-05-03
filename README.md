# 🐾 lokali – Setup-Anleitung

## Was du brauchst (alles kostenlos)
- GitHub-Account → github.com
- Supabase-Account → supabase.com
- Vercel-Account → vercel.com

---

## Schritt 1 – Supabase einrichten

1. Gehe zu **supabase.com** → "New Project" → Name: `lokali`
2. Wähle eine Region nahe Deutschland (z.B. Frankfurt)
3. Warte bis das Projekt lädt (~1 Min)
4. Gehe zu **SQL Editor** (links in der Sidebar)
5. Füge den kompletten Inhalt der Datei `supabase_setup.sql` ein und klicke **Run**

Dann:
6. Gehe zu **Project Settings → API**
7. Kopiere:
   - `Project URL` → das ist dein `VITE_SUPABASE_URL`
   - `anon public` Key → das ist dein `VITE_SUPABASE_ANON_KEY`

---

## Schritt 2 – Code auf GitHub hochladen

1. Gehe zu **github.com** → "New repository" → Name: `lokali` → Create
2. Lade alle Dateien aus diesem Ordner hoch:
   - Klicke "uploading an existing file"
   - Ziehe ALLE Dateien/Ordner rein (src/, index.html, package.json, vite.config.js, etc.)
   - Commit

---

## Schritt 3 – Auf Vercel deployen

1. Gehe zu **vercel.com** → "Add New Project"
2. Verbinde dein GitHub-Konto und wähle das `lokali`-Repository
3. Bei "Environment Variables" füge hinzu:
   - `VITE_SUPABASE_URL` = deine Project URL
   - `VITE_SUPABASE_ANON_KEY` = dein anon Key
4. Klicke **Deploy**
5. Nach ~2 Minuten bekommst du eine URL wie `lokali.vercel.app` 🎉

---

## Schritt 4 – Als App auf dem Handy installieren (PWA)

- **iPhone**: Safari → Teilen-Button → "Zum Home-Bildschirm"
- **Android**: Chrome → Menü (⋮) → "App installieren"

---

## Eigene Domain (optional)

In Vercel: Settings → Domains → z.B. `lokali.app` kaufen und eintragen (~10€/Jahr)

---

## Fragen?

Frag Claude einfach weiter – z.B. "Wie füge ich Oberthemen hinzu?" oder "Wie richte ich Push-Notifications ein?"
