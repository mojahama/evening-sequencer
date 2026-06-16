# Webhook Handoff Plan

**Goal:** Let the Evening Sequencer web app send Mo's nightly check-in straight into Hermes, instead of requiring copy/paste into Discord.

## Difficulty

Medium-small. The hard part is not the UI; it is secure routing.

Hermes already supports webhook subscriptions, but this machine currently has the webhook platform disabled. Once enabled, Hermes can expose routes like:

```text
/webhooks/evening-sequencer
```

A POST to that route can trigger an agent run with the submitted payload.

## Recommended architecture

Do **not** put a Hermes webhook secret directly into the GitHub Pages app. GitHub Pages is fully client-side, so any secret in JavaScript is public.

Use this instead:

```text
GitHub Pages app
  -> Cloudflare Worker / tiny API proxy
    -> signed POST to Hermes webhook
      -> Hermes generates tomorrow plan
        -> Discord + LifeOS notes
```

The Worker holds the Hermes webhook secret server-side and signs requests. The browser only calls the Worker.

## MVP options

### Option A — Local/private MVP

Use the app's existing copy/paste flow.

Pros:
- Already works.
- No security or hosting complexity.

Cons:
- Manual paste remains.

### Option B — Direct Hermes webhook with tunnel

Enable Hermes webhooks locally and expose via Cloudflare Tunnel or ngrok.

Pros:
- Fastest real webhook path.
- Could work today.

Cons:
- If called directly from GitHub Pages, the HMAC secret cannot be safely hidden.
- Better for private testing than a durable public setup.

### Option C — Serverless proxy: Cloudflare Worker or Vercel function

GitHub Pages submits to a tiny serverless endpoint. The endpoint validates a simple public payload, signs the request with the Hermes webhook secret, and forwards to Hermes.

Cloudflare Worker version:

- Best if the Hermes endpoint is exposed through Cloudflare Tunnel or a Cloudflare-managed domain.
- Very small, fast, cheap, and easy to pair with Cloudflare rate limiting/access rules.

Vercel version:

- Also totally viable.
- Best if we want to evolve the static prototype into a Next.js/Vercel app.
- Uses Vercel environment variables for the Hermes webhook URL and secret.
- API route/serverless function signs and forwards the payload.

Pros:
- Secure enough for a public static app.
- Keeps secrets off the client.
- Easy to extend with rate limits, origin checks, idempotency, and structured responses.

Cons:
- Requires a tiny backend deployment.
- Still needs Hermes to be reachable from the serverless function, usually via tunnel or hosted gateway.

Recommended durable path: **Option C with Vercel if we expect the UI to grow into a product; Cloudflare Worker if we want the smallest possible proxy.**

## Implementation steps

### 1. Enable Hermes webhook platform

Use either `hermes gateway setup`, or configure manually:

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      host: "0.0.0.0"
      port: 8644
      secret: "strong-global-secret"
```

Restart gateway:

```bash
hermes gateway restart
```

Verify:

```bash
curl http://localhost:8644/health
hermes webhook list
```

### 2. Create a Hermes subscription

Example:

```bash
hermes webhook subscribe evening-sequencer \
  --prompt "Mo submitted an Evening Sequencer check-in.\n\nPayload:\n{payload}\n\nTurn this into tomorrow's top 3 priorities, a tomorrow sequence, one clearly labeled Morning yoga pick, and one small future-me-will-thank-me action. Save durable journal/daily notes in LifeOS where appropriate and reply concisely in Discord." \
  --description "Evening Sequencer web app submissions" \
  --skills "lifeos-discord-knowledge-base,obsidian" \
  --deliver discord
```

Exact delivery target may need to be the current Discord thread/channel target rather than generic `discord`.

### 3. Expose Hermes webhook endpoint

Use Cloudflare Tunnel or similar so the Worker can reach the local Hermes gateway:

```text
https://hermes-webhooks.<domain>/webhooks/evening-sequencer
```

### 4. Add Cloudflare Worker proxy

Worker responsibilities:

- Accept POST from `https://mojahama.github.io/evening-sequencer/`.
- Validate payload shape and size.
- Add timestamp/idempotency key.
- Sign body with Hermes webhook secret.
- Forward to Hermes webhook URL.
- Return success/error to browser.

### 5. Update frontend

Add a button:

```text
Send to Hermes
```

Flow:

1. Build JSON payload from form fields.
2. POST to Worker endpoint.
3. Show status: sent / failed / retry.
4. Keep copy/paste fallback.

## Payload schema draft

```json
{
  "source": "evening-sequencer-web",
  "version": 1,
  "submittedAt": "2026-06-15T22:00:00-04:00",
  "fields": {
    "gratitude": "...",
    "excited": "...",
    "positiveFrame": "...",
    "workWise": "...",
    "forMyself": "...",
    "journalNotes": "...",
    "energy": "low|medium|high",
    "body": "...",
    "morningYogaWindow": "...",
    "constraints": "..."
  }
}
```

## Estimate

- Direct private webhook proof: 30–60 minutes once webhooks are enabled and a tunnel exists.
- Durable secure version with Worker + frontend send button: 2–4 hours.
- Full Discord bot replacement: 1–2 focused days for a clean first version.

## Current blocker

`hermes webhook list` reports that the webhook platform is not enabled.
