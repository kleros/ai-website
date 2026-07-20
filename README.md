# Kleros × AI minisite

A static, Vercel-ready minisite explaining the Kleros trust stack for AI agents.

## Pages

- `index.html` — the complete lifecycle: verify, transact, resolve, connect
- `proof.html` — live tools, prototypes, courts, and research
- `builders.html` — Agent Access: how agents use Kleros through practical access layers

## Run locally

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy

Import this directory into Vercel. No build command or framework preset is required.

To enable the contact form, add these Environment Variables in Vercel:

- `RESEND_API_KEY` — an API key from Resend
- `CONTACT_FROM_EMAIL` — a sender on a domain verified in Resend, for example `Kleros AI <website@your-domain.com>`

Messages are delivered directly to `fortunato@kleros.io`. The form uses the visitor's address as `reply_to`.
