# SplitVerde

Insurance commission reconciliation SaaS. Astro + React + Cloudflare Workers + D1.

## Setup

```sh
npm install
npm run dev
npm run check
npm run build
```

## Cloudflare

Existing D1 database binding: `DB`. Apply migrations using `npx wrangler d1 migrations apply splitverde-db --remote` after reviewing migrations. Deploy with `npm run deploy` once Cloudflare authentication is configured.

The workers.dev staging site is deliberately non-indexable. Do not use real customer data until authentication and tenant isolation are implemented.
