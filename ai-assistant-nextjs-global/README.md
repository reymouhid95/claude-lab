# AI Assistant Production Vidéo — Next.js 16 on Cloudflare Workers

Assistant IA de production vidéo pour les étudiants de Swiss Umef University Campus de Dakar,
en collaboration avec ATA SUARL. Les quatre niveaux Swiss Umef (`master1`, `master2`,
`licence`, `alternance`), accès anonyme (pas d'auth).

Live: https://ai-assistant-nextjs-global.thiernooury89.workers.dev

Ce projet remplace le front Vite historique (`../ai-assistant`) et son backend
Flask : il n'y a plus de service Python en production.

## Architecture

```
Browser → Worker Cloudflare (Next 16, build par vinext/Vite)
          ├── /            app : chat, Catalogue, Journal, Décrire, Image
          └── /api/*       route handlers TypeScript
                ├── chat (+ outil search_vault) → Gemini REST (gemini-flash-lite-latest)
                ├── presets, journal, log-shot  → D1 `ai-assistant`
                └── analyze-image               → R2 `promptlens-frames` (préfixe assistant/)
```

The proxy keeps `GEMINI_API_KEY` on the server: it never reaches the browser.
Students are anonymous — a random id in `sessionStorage` gives each tab its own memory.

## Requirements

- Node 20+, pnpm 10
- CLI `cf` (Wrangler) authentifiée pour le déploiement
- Une `GEMINI_API_KEY` (secret Worker, jamais dans le bundle client)

## Dev local

```bash
pnpm install
pnpm dev:vinext             # :3001 — écoute en IPv6 : curl localhost, pas 127.0.0.1
```

- La clé locale va dans `.dev.vars` (gitignoré, jamais tracké).
- Les tables D1 sont créées au premier usage (`ensureSchema`, idempotent) ;
  le schéma versionné vit dans `d1/migrations/`.

## Endpoints

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/chat` | POST | `{ message, student_level, student_id }` → agent reply (tool loop `search_vault`) |
| `/api/presets?level=` | GET | shot catalogue for a level (`master1`, `master2`, `licence`, `alternance`) |
| `/api/journal?level=` | GET | journal entries (D1) |
| `/api/log-shot` | POST | append a shot description to the journal |
| `/api/analyze-text` | POST | `{ text }` → structured shot description |
| `/api/analyze-image` | POST | `{ imageBase64, mimeType }` → description + frameId (stockée en R2) |
| `/api/frames/[frameId]` | GET | frame stored in R2 (préfixe `assistant/`) |

## Interface (refonte 2026-10-07, branche `feat/ui-refresh`)

- **REC vérité** : le témoin et le timecode du header ne s'animent que pendant
  qu'une requête tourne réellement ; figés au repos.
- **Cibles tactiles 44 px** (boutons, onglets, champs) ; sur téléphone, une barre
  fixe en bas (Chat · Catalogue · Journal · Décrire · Image, cibles 56 px) remplace
  les onglets — le chat et le panneau se substituent au lieu de s'empiler.
- **Surfaces** : grain de régie 4 % (fixe, immobile) + ombres teintées bleu-nuit,
  survols/focus/clics avec retour visuel.
- **Marque** : favicon SVG + ICO multi-tailles, apple-icon, og:image 1200×630,
  `theme-color`, skip link clavier « Aller au contenu ».

## Deploy

```bash
pnpm build:vinext && pnpm exec cf deploy --prebuilt
```

- Changer la clé : `cf workers secrets update GEMINI_API_KEY --worker ai-assistant-nextjs-global`
  (valeur en pipe, jamais en clair).
- Le vault est inliné au build depuis `personal-os/vault/` — le dépôt est public,
  aucune note n'est committée (0 fichier vault tracké). Toute modification du vault
  exige un rebuild + redeploy.

## Notes

- First dev build downloads three Google fonts and takes several minutes; later builds are fast.
- Les niveaux, presets et la logique métier vivent dans `lib/` (`levels`, `presets`,
  `memory`, `gemini`, `vault`).
