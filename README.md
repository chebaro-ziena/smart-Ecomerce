# Smart Shop — AI-Powered E-Commerce

Next.js 14 (App Router, TypeScript) store where an admin uploads a product photo and Claude
(Gimini) automatically writes the product name, description, tags, and category. Includes a
public storefront home page, an admin dashboard, auth, and Sentry error tracking.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Prisma + SQLite (zero-config local DB, swap `DATABASE_URL` for Postgres/MySQL in production)
- NextAuth (credentials login) for admin auth
- Anthropic Claude vision API for AI product generation (`src/lib/ai.ts`)
- Sentry (`@sentry/nextjs`) for error tracking, wired into API routes, client, and global error boundaries

## Setup

1. Copy env vars and fill in your Anthropic key when you have it:
   ```
   cp .env.example .env
   ```
   Required to enable AI generation: `ANTHROPIC_API_KEY`. Everything else has sane local defaults.

2. Install dependencies:
   ```
   npm install
   ```

3. Create the database and seed an admin user + starter categories:
   ```
   npm run prisma:push
   
   
  
4. Run the dev server:
   ```
   npm run dev
   ```
   Visit `http://localhost:3000` for the storefront, `http://localhost:3000/login` to sign in as admin.

## How the AI flow works

1. Admin goes to **Admin Dashboard → + New product (AI)** and selects a photo.
2. The browser sends the image (as a data URL) to `POST /api/admin/analyze`.
3. That route calls `generateProductFromImage()` in `src/lib/ai.ts`, which sends the image to
   Claude with a system prompt asking for structured JSON (name, description, tags, category,
   suggested price).
4. The form auto-fills with the AI's suggestions — the admin can edit anything before saving.
5. On save, `POST /api/admin/products` stores the image in `public/uploads/` and creates the
   `Product` row (category is upserted by name).

If `gimini_API_KEY` isn't set yet, the analyze endpoint returns a clear error and the admin can
still fill the form manually — nothing else breaks.

## Error tracking (Sentry)

Set `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client) in `.env` to enable. Until then,
Sentry initialization is a no-op (`enabled: false`) so the app runs fine without it. All API routes
funnel errors through `src/lib/logger.ts` (`logError`), which logs to console and reports to Sentry
when configured.

## A note on this machine's npm

This machine's global `npm`/`npx` (via an nvm-windows install) is broken against the installed
Node 24 binary (`Class extends value undefined is not a constructor or null` — a stale bundled npm
incompatible with the node version). A working npm was fetched into `.binshim/npm-fresh` and a
wrapper script at `.binshim/npm` runs it with the correct `node.exe`. If `npm`/`npx` misbehave in a
fresh shell, call `./.binshim/npm <command>` directly, or fix the underlying nvm-windows install.
