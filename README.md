# claude-lab — episode tracker

Progress through the personal-agent course (opencode). An episode is checked
when its deliverable exists in this lab, committed on its branch, or when
confirmed by the human (non-main branches of the shared repo).

Last update: 2026-10-06.

- [x] E01 — hello lab (`01-hello/`, branch `lab/01-hello`)
- [x] E02 — confirmed on non-main branches of the shared repo
- [x] E03 — landing v1/v2 (`03-landing/`, `de6ca4f`, branch `lab/03-landing`)
- [x] E04 — project brief AGENTS.md v2-skill (`03-landing/`, `4b85343`)
- [x] E05 — brand assets Séquence (`05-brand/`, `5d5b8dd` + `1ef1fde`)
- [x] E06 — competitive analysis + marketing plan (`06-plugins/`, `95f7ff6` + `d84458a`)
- [x] E07 — confirmed on non-main branches of the shared repo
- [x] E08 — confirmed on non-main branches of the shared repo
- [x] E09 — confirmed on non-main branches of the shared repo
- [x] E10 — confirmed on non-main branches of the shared repo
- [x] E11 — agent lab (`11-agent/`, `849ab8d`, branch `lab/11-agent`)
- [x] E12 — personal-os scaffold (`personal-os/`, `vault/log.md`)
- [x] E13 — morning brief via Notion MCP (`personal-os/`, `075ccfc`, branch `lab/personal-os`)
- [x] E14 — firebase-reviewer subagent + security audit + safe fixes (`promptlens/`, `ed244d1`, branches `phase-2` / `lab/promptlens`)

## Repos

| Folder | Local branch | Remote tip |
| ------ | ------------ | ---------- |
| `01-hello/` | `lab/01-hello` (active), `main` | `origin/lab/01-hello`, `origin/main` |
| `03-landing/` | `lab/03-landing` (active), `main` | `origin/lab/03-landing`, `origin/main` |
| `05-brand/` | `lab/05-brand` (active), `main` | `origin/lab/05-brand`, `origin/main` |
| `06-plugins/` | `lab/06-plugins` (active), `main` | `origin/lab/06-plugins`, `origin/main` |
| `11-agent/` | `master` | `origin/lab/11-agent` |
| `personal-os/` | `master` | `origin/lab/personal-os` |
| `promptlens/` | `phase-2` (active), `phase-1`, `lab/promptlens` | matching `origin/*` |
| `screenshots/` | `lab/screenshots` (active) | `origin/lab/screenshots` |

## Pending (E14 leftovers)

- ~~H-1 callable auth~~ — done 2026-10-06 (`ab7e04c`, anonymous sign-in +
  `requireAuth` guard; App Check still deferred until a real project)
- ~~M-4 `users/{uid}/entries/{id}` structure~~ — done 2026-10-06
  (`20f825e`, per-user subtree + owner-only `firestore.rules`, edited but
  not deployed until the first real deploy)
- ~~M-5 real Firebase project config~~ — done 2026-10-06: `promptlens-prod`
  created (alias `prod`), web app + `.env.local` (gitignored) wired via
  `VITE_FIREBASE_*`, Firestore database (`europe-west1`), M-4 rules
  released, first hosting release at https://promptlens-prod.web.app
- ~~Frame storage on Cloudflare R2~~ — done 2026-10-06 (`162579b`): private
  bucket `promptlens-frames`, Worker routes `POST /frames` (auth) /
  `GET /frames/:key`, `Entry.frameId` + journal thumbnails (8/8 probes OK)
- ~~Version this tracker~~ — done 2026-10-06: this README lives in
  `reymouhid95/claude-lab` (only `README.md` tracked, sub-repos ignored)
- Revoke the current GitHub PAT once it is no longer needed (pushes use
  `ghp_OK7lTO…` until then)
- M-6 first full deploy — **split outcome** 2026-10-06:
  - ✅ Anonymous provider live (console), Gemini analysis live in
    production via Cloudflare Worker `promptlens-gemini` (free tier, no
    billing): https://promptlens-gemini.thiernooury89.workers.dev
    (Firebase ID token required, probe 401/400/200 OK)
  - ❌ still waiting on an **open billing account** (card declined):
    Firebase functions deploy (Cloud Build) + App Check — gen1 conversion
    tried & reverted, firebase-tools needs Cloud Build either way
