# AI Assistant Production Vidéo — Next.js 16

Assistant IA de production vidéo pour les étudiants de Swiss Umef University Campus de Dakar,
en collaboration avec ATA SUARL. Front Next.js 16 (App Router, Tailwind 4), agent Python derrière.

Ce projet remplace le front Vite historique (`../ai-assistant`) lors du déploiement.

## Architecture

```
Browser → Next.js (:3000) → /api/chat, /api/presets (proxy) → Flask (:5001) → Gemini + SQLite
```

The proxy keeps `GEMINI_API_KEY` on the server: it never reaches the browser.
Students are anonymous — a random id in `sessionStorage` gives each tab its own memory.

## Requirements

- Node 20+, pnpm 10
- Python 3 with `flask` and the OpenAI Agents SDK installed
- A `GEMINI_API_KEY` environment variable

## Run

Terminal 1 — agent backend:

```bash
cd ../ai-assistant/standalone-server
GEMINI_API_KEY=... python3 server.py        # :5001
```

Terminal 2 — frontend:

```bash
pnpm install
pnpm dev                                     # :3000
```

Production:

```bash
pnpm build
pnpm start
```

Set `FLASK_URL` if the backend is not on `http://127.0.0.1:5001`.

## Endpoints

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/chat` | POST | `{ message, student_level, student_id }` → agent reply |
| `/api/presets?level=` | GET | shot catalogue for a level (`master1`, `master2`, `licence`, `alternance`) |

## Notes

- First dev build downloads three Google fonts and takes several minutes; later builds are fast.
- Levels, presets and the SQLite memory live in `../ai-assistant/standalone-server/server.py`.
