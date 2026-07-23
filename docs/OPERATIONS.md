# Paid Media Dashboard Operations

## Environment inventory

Never store secret values in Git. Production requires only the variables for features being validated.

- Authentication/runtime: `AUTH_SECRET`, access-user configuration already documented by the deployed auth model, and either `KV_REST_API_URL` + `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- Meta: existing Meta app variables used by `src/lib/integrations/meta.ts`.
- TikTok: `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`; see `docs/TIKTOK_PRODUCTION_SETUP.md`.
- Google Ads: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`; optional `GOOGLE_ADS_API_VERSION` defaults to `v23`.
- Snapchat: `SNAP_CLIENT_ID`, `SNAP_CLIENT_SECRET`.
- Store truth: existing Shopify, WooCommerce, and WordPress variables documented by their integration modules.

## Backup

The runtime stores are the production data source. Before live onboarding or a risky release:

1. Export/snapshot the connected Vercel KV or Upstash database from its provider console.
2. Record the GitHub commit currently aliased to production.
3. Save the environment-variable name inventory from Vercel without copying secret values into tickets or Git.
4. Confirm the snapshot contains client state, source-conversion mappings, sync state, and each platform connection store.

The `/tmp` fallback is explicitly non-durable and is not a valid production backup.

## Rollback

1. Select the last READY deployment in Vercel and promote/redeploy it.
2. If source rollback is required, revert the affected milestone commit with a new Git commit; do not force-push `main`.
3. Restore the runtime database snapshot only when the code rollback requires older data. Current credential-independent milestones are backward-compatible and add stores/fields without destructive migration.
4. Run `npm ci`, all contract tests, TypeScript, the production build, and `npm run smoke:production`.

## Release gate

Run:

```bash
npm ci
npm run test:client-storage
npm run test:tiktok-contract
npm run test:google-contract
npm run test:snap-contract
npm run test:paid-media
npm run test:portfolio-reporting
npm run test:integration-health
npx tsc --noEmit
npm run build
npm run smoke:production
```
