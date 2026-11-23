# FINANCIA

**Your Family Finance & Wealth Management**

FINANCIA is a private household finance workspace for two users: husband and wife. It centralizes household finances while retaining ownership and account-level attribution.

## Product principles

- Private, single-family application for exactly two invited users.
- Equal access for both users; every mutation retains an audit trail.
- Indonesian interface, IDR as the primary currency, and Asia/Jakarta timezone.
- Ledger-oriented financial records: transfers are not income or expenses, asset purchases are not consumption, and business revenue is not treated as household profit.
- Privacy-first capture. External AI processing is optional and requires explicit consent.

## Architecture

- **Web:** Next.js App Router, React, TypeScript, Tailwind CSS, and shadcn/ui.
- **Backend:** Supabase PostgreSQL, Auth, Storage, and Edge Functions.
- **Hosting target:** Cloudflare Pages using Next.js static export.
- **PWA:** Web manifest and a conservative service worker that caches only same-origin static assets and a generic offline page.
- **Timezone/currency:** `Asia/Jakarta` / `IDR`.

The static-export deployment keeps application code on Cloudflare Pages while authenticated data access is handled by Supabase. Do not add server-only Next.js features (Server Actions, request-time Route Handlers, dynamic server rendering) without revisiting this hosting decision.

## Local development

Requirements: Node.js 22 LTS and npm.

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase project URL and publishable key when the Supabase client is introduced.
3. Install the pinned dependencies with `npm ci` (the lockfile is committed).
4. Run `npm run dev`.
5. Run validation with `npm run check`.

## Environment variables

Only public client configuration belongs in `NEXT_PUBLIC_*` variables. Never put a Supabase service-role key, database password, or other secret in the browser bundle or in a committed file.

## Deployment

Cloudflare Pages target settings:

- Framework preset: **Next.js (Static HTML Export)**
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `out`

The first deployment still requires Cloudflare Pages to be connected to this private GitHub repository. Deployment credentials must be configured as Cloudflare/GitHub secrets, never committed to this repository.

## Repository visibility

The repository is public. Do not commit personal financial data, credentials, database passwords, service-role keys, private keys, or production environment files.

## Project status

Phase 1 — Project Discovery & Foundation is being established. Database schema, authentication policies, and financial modules are intentionally deferred to their dedicated phases.
