# Kleros × AI minisite

A static minisite explaining the Kleros trust stack for AI agents. No framework, no build step — the repository root is the deploy artifact.

## Pages

- `index.html` — the complete lifecycle: verify, transact, resolve, connect
- `products.html` — Products A: dark product landing page for agent checkout, verification, and support
- `products-b.html` — Products B: lean corporate alternative using the same product narrative
- `products-c.html` — Products C: technical cut of the same three products (protected payment, verification, disputes), written for a developer audience
- `our-solutions.html` — live tools, prototypes, courts, and research (`/proof` redirects here)
- `builders.html` — Agent Access: how agents use Kleros through practical access layers

The canonical URL of every page is the **extensionless** form (`/our-solutions`, not `/our-solutions.html`); `netlify.toml` 301s the `.html` form to it. Internal links must use the extensionless form too.

The three `products-*` pages are unlinked A/B variants. They carry `noindex,follow` and are deliberately excluded from `sitemap.xml`.

**When you change the copy on a live page, update its `<lastmod>` in `sitemap.xml`** — nothing does it for you. Run `./scripts/check-sitemap-lastmod.sh` to see which pages have drifted. Only bump for substantive content changes: a stale date is harmless, but bumping all three on every deploy teaches Google to ignore the field.

## Discovery files

Three hand-maintained files at the root, for crawlers and agents:

- `robots.txt` — fully open, including AI training (`Content-Signal: search=yes, ai-input=yes, ai-train=yes`). **Never add a `Disallow` line**; the reason is written in the file. Control indexing with `X-Robots-Tag` in `netlify.toml` or `<meta name="robots">` in the page instead.
- `sitemap.xml` — the three live pages only, canonical extensionless URLs, no `changefreq`/`priority` (Google ignores both).
- `llms.txt` — a guided entry point for agents, following the `skills.kleros.io` house format.

⚠️ `ai.kleros.io` is behind Cloudflare, which can **prepend** its own managed `robots.txt` — including `Disallow: /` for ClaudeBot and GPTBot — ahead of this one. After changing `robots.txt`, confirm production matches the repo: `diff <(curl -sS https://ai.kleros.io/robots.txt) robots.txt`.

## Run locally

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

The contact form renders and validates locally, but **submitting will fail** — Netlify Forms only works on a deployed URL. Use a deploy preview to test it end to end.

## Deploy

Netlify, with no build command. `netlify.toml` sets the publish directory, the `/proof` → `/our-solutions` redirect, the `.html` → extensionless canonical redirects, the security and `Link` headers, and the content types for the agent-facing files.

Because the publish directory is the repository root, **committing a file publishes it**. `.gitignore` keeps the internal working documents out.

`scripts/` is hand-run and never executed by Netlify: `update-digests.js` after editing a skill, `render-og-card.sh` after changing the social card, `check-sitemap-lastmod.sh` when deciding whether to bump a sitemap date.

## Contact form

The four contact forms (`index.html`, `products.html`, `products-b.html`, `products-c.html`) all use [Netlify Forms](https://docs.netlify.com/manage/forms/setup/). There is no server code, no API key, and no environment variable to set.

All four submit to a single form named `contact`. A hidden `source` field records which page the submission came from (`home`, `products-a`, `products-b`, `products-c`), and a hidden `subject` field sets the notification email's subject line. The `website` field is a honeypot, declared via `data-netlify-honeypot`.

`app.js` submits over AJAX so the inline success/error state stays on the page; without JavaScript the form falls back to a native POST and Netlify's own success page.

### One-time Netlify setup

Form detection is **off by default** — without step 1 no submissions are recorded.

1. **Forms → Enable form detection**, then redeploy. A form named `contact` should then appear under **Forms**.
2. **Project configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email**, and set the recipient address.

The notification's `Reply-to` is set automatically from the form's `email` field, so replying to a notification reaches the submitter. If the inbox attracts spam, enable the reCAPTCHA 2 challenge under Netlify's form spam-filter settings.

## Agent skills

An [Agent Skills discovery index](https://github.com/cloudflare/agent-skills-discovery-rfc) (RFC v0.2.0), so agents can find Kleros' skills unprompted.

- `.well-known/agent-skills/index.json` — the index. One entry today.
- `agentkit-onboarding/skill.md` — installing `@kleros/agentkit`. `netlify.toml` also serves it at the conventional `/.well-known/agent-skills/agentkit-onboarding/SKILL.md`, so one digest covers both URLs.
- `scripts/update-digests.js` — after editing any skill, run it and commit the rewritten index.

Clients reject a skill whose bytes don't match its `digest`, and route on its `description`. The script syncs both from the file; a `name` mismatch it only warns about.

Keep `skill.md` to the install path — usage guidance belongs to the companion skill `kleros skills add` installs, which ships with the package and stays current. Claims about AgentKit are governed by `LANDING_PAGE_HANDOFF.md` §3.6–3.7.
