# claude-lab — episode tracker

Progress through the personal-agent course (opencode). An episode is checked
when its deliverable exists in this lab, committed on its branch, or when
confirmed by the human (non-main branches of the shared repo).

Last update: 2026-10-07.

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

## Assistant deployment (Next 16 + Cloudflare Workers)

Unified assistant for the four Swiss Umef levels — the PromptLens sections
(research, Journal, Describe, Image) included; replaces the Vite front and
the Flask backend (no Python service in production).

- Live: https://ai-assistant-nextjs-global.thiernooury89.workers.dev
- Branch `feat/ui-refresh` (pushed): v2 UI refresh on top of
  `feat/cloudflare-deploy` (vinext migration `2dadbd1` → deploy `e04feed`)
- UI v2 (2026-10-07): REC indicator + timecode wired to real activity
  (frozen at rest), 44px touch targets, fixed bottom nav on phones,
  hover/focus/press feedback, film grain + tinted shadows, branded
  favicon/og:image, skip link
- Stack: Next 16 built by vinext (Vite) into a single Worker; the Flask
  backend is ported to TypeScript in the route handlers (chat with the
  `search_vault` tool, presets, log-shot, journal, analyze-text/image,
  frames)
- Data: D1 `ai-assistant` (WEUR, `d1/migrations/`), R2 `promptlens-frames`
  under the `assistant/` prefix, `GEMINI_API_KEY` as a Worker secret
- Vault: inlined from `personal-os/vault/` at build time — the repo is
  public, so the notes are never committed (0 vault files tracked)
- Deploy: `pnpm build:vinext && pnpm exec cf deploy --prebuilt` (first
  deploy of a new Worker also needs `--secrets-file <file>`, format
  `NAME=value`; secrets are set afterwards with `cf workers secrets update`)
- Free tier only: Workers + D1 + R2, no billing, no card

