# Evening Sequencer Product Roadmap

**Goal:** Turn the Evening Sequencer from a static form into a small LifeOS product: a web interface for nightly reflection that can hand off to Hermes/Discord and eventually write durable Obsidian notes.

## Product shape

Evening Sequencer should be a tiny, calm interface that helps Mo complete the nightly routine without needing to remember the prompt structure.

Core loop:

1. Mo opens the interface at night.
2. Mo fills the guided check-in.
3. The app generates a clean structured payload.
4. Hermes turns it into tomorrow’s plan, including exactly one morning yoga pick.
5. The final plan is posted back to Discord and/or saved into LifeOS notes.

## Build sequence

### Phase 1 — Static GitHub Pages app

**Status:** started locally.

- Host `index.html` on GitHub Pages.
- Keep it local-first: no login, no backend, no database.
- Persist drafts in `localStorage`.
- Generate copy/paste markdown for Hermes.

This is enough to prove whether the interface actually helps the nightly routine.

### Phase 2 — Better client-side product

- Add sections for:
  - Today recap
  - Tomorrow constraints
  - Work obligations
  - Family/admin
  - Something for self
  - Energy/body
  - Yoga window
- Add a final review screen.
- Add “short mode” for low-energy nights.
- Add “good enough” completion state so the form does not become another chore.
- Add mobile-first polish.

### Phase 3 — Hermes handoff

Options:

1. **Manual paste:** safest MVP; copy markdown into Discord/Hermes.
2. **Webhook/API endpoint:** app submits payload to a small backend that triggers Hermes or posts into a Discord thread.
3. **Local file bridge:** app downloads or saves a markdown payload that Hermes can ingest.

Recommended next step: keep manual paste until the routine proves useful for a week, then add a webhook.

### Phase 4 — Discord bot / Discord app

A Discord bot is worth building if the goal is to make the Evening Sequencer live inside the place Mo already uses at night.

Bot capabilities:

- `/evening` starts the guided check-in.
- Bot sends a modal or step-by-step prompts.
- Bot posts a structured summary into the Evening Sequencer thread.
- Bot can call Hermes / a backend to produce tomorrow’s plan.
- Bot can route completed journal content to Obsidian/LifeOS.

But the bot should probably come **after** the GitHub Pages web app, not before.

Reason:

- The web app is faster to iterate.
- Discord modal UX has constraints.
- The form structure and output schema need to stabilize first.
- Bot deployment adds token management, hosting, permissions, and failure modes.

## Recommended architecture

### Now

```text
GitHub Pages static app
  ↓ copy markdown
Discord Evening Sequencer thread
  ↓ Hermes reply
LifeOS daily review / tomorrow plan
```

### Later

```text
Discord slash command or web app
  ↓ structured JSON payload
Small API worker
  ↓ calls Hermes / writes markdown / posts Discord reply
LifeOS vault + Discord plan
```

Possible stack for later:

- Frontend: static HTML/CSS/JS or Vite + React if the UI grows.
- Hosting: GitHub Pages for static frontend.
- Backend: Cloudflare Worker or small Node service.
- Discord: slash command + modal flow.
- Storage: Obsidian markdown as source of truth; optionally GitHub repo for schemas/templates.

## Decision

Build the GitHub Pages app first. Treat the Discord bot as Phase 4 once the interface proves it reduces friction.

## Immediate next tasks

1. Authenticate GitHub CLI with `gh auth login`.
2. Create/push `evening-sequencer` repo.
3. Enable GitHub Pages from `main` / root.
4. Verify live URL.
5. Add mobile polish and a “short mode.”
6. Define a stable JSON/markdown payload schema for future bot/API handoff.
