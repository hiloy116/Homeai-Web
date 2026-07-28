# HomeAi — Web App

This is the same HomeAi prototype you've been using in chat, now packaged
as a real, standalone project — the kind any hosting platform (Vercel,
Netlify, or your own server) can build and deploy directly, no Claude
involved at runtime.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Deploy it

**Vercel** (recommended — fastest path to a live URL):
1. Push this folder to a GitHub repo
2. vercel.com → **Add New Project** → import that repo → it auto-detects
   Vite and deploys. `vercel.json` is already set up for correct routing.
3. Add your environment variables (see below) in Project Settings →
   Environment Variables before the first real deploy.

**Netlify** — same idea: push to GitHub, "Add new site → Import project,"
`netlify.toml` in this folder already tells it how to build.

Either way, every future `git push` redeploys automatically.

## Environment variables

Copy `.env.example` to `.env` and fill in real values — see
`homeai-backend/db/README.md` for where the Supabase ones come from, and
add these same three variables (with the `VITE_` prefix, required by Vite
to expose them to the browser) in your hosting platform's dashboard too,
not just locally.

## What's real right now vs. what's still simulated

This is the important part, worth being exact about: **packaging this app
does not, by itself, connect it to the real backend.** Deploying it today
gives you a live, working *demo* — identical behavior to what you've been
testing in chat, running entirely on local browser state. To make it
genuinely functional (real accounts, real diagnosis, real payments), the
code changes described in these docs (from `homeai-backend/`) still need
to be applied to `src/App.jsx`:

| Doc | What it wires up |
|---|---|
| `FRONTEND_AUTH.md` | Real login/register, replacing the simulated onboarding auth |
| `FRONTEND_DATA.md` | Real data persistence for properties, jobs, nudges, etc. |
| `STRIPE_SETUP.md` | Real subscription checkout, replacing the simulated Plans screen buttons |
| `README.md` (backend root) | Real photo diagnosis, replacing the multiple-choice picker |

Deployed-but-unwired is still a completely legitimate and useful stage —
it's shareable, testable by real people on real phones, and a good way to
get feedback before spending time wiring the backend in. Just worth
knowing which stage you're actually in before showing it to anyone as more
than a demo.

## Project structure

```
src/
  App.jsx        — the entire app (this is homeai-prototype.jsx, unchanged)
  main.jsx       — mounts it
  index.css      — Tailwind
index.html
vite.config.js
tailwind.config.js
```

Everything lives in one `App.jsx` file for now, matching how it was built.
Once the backend wiring above is applied, splitting it into smaller files
(one per screen/component) becomes worth doing — not required for it to
work, just for it to stay maintainable as more people touch the code.
