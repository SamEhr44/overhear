# Overhear

A travel communication cockpit for travelers who don't speak the local language — live English
captions of the Spanish around you (**Listen**), hand-to-a-stranger conversation (**Talk**), and
driver comms (**Ride**), with an offline **Essentials/SOS** layer and a local, on-device **Trip
Context**. First market: English ⇄ Mexican Spanish.

Mobile-first installable PWA. Design source of truth: the Claude Design project
_"Mexico tourist app directions"_ — direction **1c "Wayfinding"** (airport-signage clarity,
single deep signal blue, Manrope), implemented as swappable design tokens.

**Live:** https://overhear-two.vercel.app (web · Vercel) · API on Fly.io pending first
`fly auth login` (see Deploys).

## Architecture

```
┌───────────────────────────────┐        wss://…/ws/listen         ┌──────────────────────────────┐
│  apps/web · Next.js PWA       │  ───────────────────────────────▶│  services/api · Fastify      │
│  (Vercel)                     │   JSON control + binary audio    │  (Fly.io, region qro)        │
│  mic capture → WS stream      │  ◀───────────────────────────────│  ASR ⇄ MT pipeline behind    │
│  captions UI · packs · TTS    │   captions / results / pong      │  provider interfaces         │
└──────────────┬────────────────┘                                  └──────────────┬───────────────┘
               │                                                                  │
        packages/shared  ◀────────────────────────────────────────────────────────┘
        (WS protocol + zod schemas · provider interfaces · phrase packs · trip types)
```

- **apps/web** — Next.js (App Router) + React + TypeScript + Tailwind v4. Installable PWA
  (manifest + service worker; app shell + offline fallback in M0, full phrase-pack offline in M4).
- **services/api** — Fastify (TypeScript) + `@fastify/websocket`. Streams audio → ASR → MT →
  captions. M0 ships mock `echo-*` providers behind the real interfaces; M1 swaps in Deepgram
  (ASR) + DeepL (MT) via env config. Keys live server-side only.
- **packages/shared** — the WS protocol (zod-validated), provider interfaces, phrase packs, and
  Trip Context types shared by both sides.

### Stack decisions

- **API language: TypeScript (Fastify)** — one language end-to-end lets `packages/shared` type
  the WS protocol on both sides; first-class WebSocket support; the Deepgram/DeepL SDKs are
  TS-first; small cold-start footprint on Fly.
- **ASR: Deepgram** (streaming, low-latency partials, word-level confidence — needed for the
  low-confidence UI; generous free credits). **MT: DeepL** (best ES⇄EN quality, formality
  control for warm-polite _usted_, free tier 500k chars/mo). Both behind `AsrProvider` /
  `MtProvider` interfaces so self-hosted Whisper/NLLB can replace them without touching callers.
- **TTS:** browser Web Speech Synthesis (works offline) with a server fallback interface for
  quality later.

### Honest offline model (web MVP)

Live ASR needs connectivity. Phrase packs, TTS, SOS and the destination card work offline;
live Listen/Talk show a clear "needs connection" state. True on-device live translation is the
native-iOS Phase 2, out of scope here.

## Local setup

```bash
corepack enable        # pnpm 11 (see packageManager)
pnpm install
pnpm build             # builds shared first (turbo)
pnpm dev               # web on :3000 + api on :8787 + shared in watch mode
```

The web dev server talks to `ws://localhost:8787/ws/listen` automatically. Open
http://localhost:3000 → Listen screen shows "Live · _n_ ms" and a mock round-trip translation
once the socket is up.

### Commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `pnpm dev`             | All workspaces in dev/watch mode              |
| `pnpm build`           | Build shared → api + web                      |
| `pnpm lint`            | ESLint across workspaces                      |
| `pnpm typecheck`       | `tsc --noEmit` across workspaces              |
| `pnpm test`            | Vitest (shared protocol, api WS, web UI)      |
| `pnpm e2e`             | Playwright smoke suite against a prod build   |

## Deploys

| Surface | Where | How |
| ------- | ----- | --- |
| Web     | https://overhear-two.vercel.app (`main` → prod, PRs → preview) | Vercel Git integration; monorepo root dir `apps/web` |
| API     | Fly.io app `overhear-api`, region `qro` | `.github/workflows/deploy-api.yml` on `main` (needs `FLY_API_TOKEN` repo secret) |

First-time API setup (owner action — needs Fly login + billing consent):

```bash
fly auth login
fly apps create overhear-api
fly deploy . --config services/api/fly.toml --dockerfile services/api/Dockerfile
fly tokens create deploy -a overhear-api   # → add as FLY_API_TOKEN repo secret
```

Then set the web env in Vercel: `NEXT_PUBLIC_API_WS_URL=wss://overhear-api.fly.dev/ws/listen`.

Manual API deploy from the repo root:

```bash
fly deploy . --config services/api/fly.toml --dockerfile services/api/Dockerfile
```

### Environment

See [.env.example](.env.example). Set `NEXT_PUBLIC_API_WS_URL` in Vercel once the Fly app is
live; set provider keys with `fly secrets set` (never committed). Unset API URL degrades to an
honest "No caption API yet" UI state.

## Milestones

- **M0** — scaffolding, design system + Home/Listen reference screens, WS hello-world, CI/CD, deploys ✅
- **M1** — Listen live (Deepgram + DeepL, streaming captions, sub-modes, pin/save, low-confidence UI)
- **M2** — Talk (two-way conversation, situation packs, hand-off UX, Web Speech TTS)
- **M3** — Ride (destination card, driver deck, screenshot/paste → OCR → translate, Speaker + Listen)
- **M4** — Offline (service worker + packs + IndexedDB Trip Context), Essentials/SOS, onboarding
- **M5** — Polish (WCAG AA, performance budgets, motion, full test pass, docs)

## Quality bar

Latency: partial caption < ~400 ms, finalized < ~1.2 s. Lighthouse: installable PWA,
performance & accessibility (WCAG AA) green. No server-side audio retention. Privacy-safe,
opt-out analytics (M5).
