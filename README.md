# Evening Sequencer

A static, local-first interface for Mo's LifeOS Evening Sequencer routine.

## What it does

- Captures gratitude, tomorrow excitement, positive frame, work loops, self-care, journal notes, body/energy, yoga window, and fixed constraints.
- Saves an in-browser draft with `localStorage`.
- Generates Discord-ready markdown to paste into Hermes for the final next-day plan.

## Deploy

Primary app URL:

```text
https://evening-sequencer.vercel.app/
```

The Vercel deployment includes the `/api/submit-evening` serverless proxy, which signs submissions and forwards them to the local Hermes webhook endpoint via the configured tunnel.

GitHub Pages static fallback:

```text
https://mojahama.github.io/evening-sequencer/
```

The GitHub Pages version can render the form, but it cannot use `/api/submit-evening`; use the Vercel URL for the **Send to Hermes** button.

## Local use

Open `index.html` directly in a browser for copy/paste mode, or run `vercel dev` for the API route.
