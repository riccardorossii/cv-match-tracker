# Match & Tracker

App reale (Next.js + Supabase) per analizzare la corrispondenza tra CV e annuncio di lavoro
tramite l'AI di Anthropic, e per tenere un tracker delle candidature — ogni utente vede
solo i propri dati.

## Stack

- **Next.js 14** (App Router) — frontend + API route server-side
- **Supabase** — autenticazione (email/password) + database Postgres con Row Level Security
- **Anthropic API** — analisi del match e suggerimento ruoli affini (chiamata solo dal server,
  la chiave API non è mai esposta al browser)
- **Vercel** — hosting consigliato (gratuito per iniziare)

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project** (piano Free va benissimo).
2. Una volta creato, vai su **SQL Editor** → **New query**, incolla il contenuto di
   `supabase/schema.sql` ed esegui (Run). Questo crea la tabella `applications` con le
   policy di sicurezza che isolano i dati per utente.
3. Vai su **Authentication → Providers** e assicurati che **Email** sia abilitato
   (lo è di default).
4. (Opzionale ma consigliato in fase di test) In **Authentication → Settings**, disattiva
   temporaneamente "Confirm email" se vuoi registrarti e accedere subito senza controllare
   la casella di posta.
5. Vai su **Project Settings → API** e copia:
   - `Project URL` → sarà `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → sarà `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Prendi una chiave Anthropic

Vai su [console.anthropic.com](https://console.anthropic.com) → **API Keys** → crea una
chiave. Sarà `ANTHROPIC_API_KEY`. Questa chiave resta solo sul server (le route in
`app/api/`), non viene mai inviata al browser.

## 3. Configura le variabili d'ambiente in locale

```bash
cp .env.example .env.local
```

Apri `.env.local` e incolla i tre valori raccolti sopra.

## 4. Avvia in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): verrai reindirizzato al login.
Registrati con una email/password, poi accedi.

## 5. Metti online (Vercel)

1. Crea un repository Git (GitHub/GitLab) con questi file e fai push.
2. Vai su [vercel.com](https://vercel.com) → **Add New Project** → importa il repository.
3. In **Environment Variables**, aggiungi le stesse tre variabili di `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`).
4. Deploy. Vercel ti darà un URL pubblico (es. `tuoapp.vercel.app`).
5. Torna su Supabase → **Authentication → URL Configuration** e aggiungi l'URL di Vercel
   sia come **Site URL** sia tra le **Redirect URLs** (es. `https://tuoapp.vercel.app/**`),
   altrimenti la conferma email/redirect dopo login non funzionerà in produzione.

## Struttura del progetto

```
app/
  page.tsx                 dashboard (tab Analizza / Tracker), protetta da login
  login/page.tsx           login e registrazione
  auth/callback/route.ts   scambio del codice di conferma email
  api/analyze/route.ts     chiama Claude per il match CV/annuncio (richiede utente autenticato)
  api/suggest-roles/route.ts  chiama Claude (+ ricerca web) per suggerire ruoli affini
components/
  AnalyzeView.tsx          upload PDF (drag&drop), job description, risultato match, ruoli affini
  TrackerView.tsx          board a colonne per lo stato delle candidature
  MatchGauge.tsx           il quadrante circolare del punteggio
lib/
  supabase/client.ts       client Supabase per componenti browser
  supabase/server.ts       client Supabase per Server Components e route
  types.ts                 tipi condivisi (Application, Status)
middleware.ts              protegge le pagine: senza sessione, redirect a /login
supabase/schema.sql        tabella + Row Level Security da eseguire su Supabase
```

## Come funziona l'isolamento dei dati tra utenti

La tabella `applications` ha una colonna `user_id` e Row Level Security attiva: le policy
in `supabase/schema.sql` permettono a ogni utente di leggere/scrivere solo le righe dove
`user_id` corrisponde al proprio id autenticato. Anche se qualcuno manomettesse le richieste
dal browser, il database rifiuterebbe l'accesso ai dati altrui.

## Note e limiti di questa prima versione

- Il CV in PDF viene inviato all'analisi ma **non salvato** da nessuna parte: ogni volta
  va ricaricato. Se vuoi conservarlo (es. per rianalizzarlo in futuro), il prossimo passo
  naturale è aggiungere **Supabase Storage** con un bucket privato per utente.
- L'autenticazione è solo email/password. Si può aggiungere login con Google/LinkedIn tramite
  i **Providers** di Supabase Auth con poche righe di codice in più.
- `npm audit` segnala alcune vulnerabilità note di Next.js 14 risolte solo nella major 16
  (che introduce breaking change non testati in questo scaffold). Per un uso in produzione
  con dati sensibili, vale la pena valutare l'aggiornamento più avanti.
- Ogni chiamata a `/api/analyze` e `/api/suggest-roles` consuma crediti Anthropic: se l'app
  sarà pubblica, valuta un limite di richieste per utente per evitare abusi.
