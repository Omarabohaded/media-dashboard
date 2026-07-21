# Paid Media Dashboard Roadmap Status

Last updated: 2026-07-21

Current project completion: 58%

Current milestone: Phase 5.1 — TikTok authentication and event-discovery hardening (complete; deployment pending)

## Verified repository baseline

- Repository: `Omarabohaded/media-dashboard`
- Branch: `main`
- Deployed baseline commit: `7404b719603e33c6c4f095fef3a43d5cf7c70469`
- Working tree at inspection: clean
- Deployment evidence: the Vercel status check for `6e58b3e` is successful.
- Client store: `media-dashboard:client-state` through the shared runtime storage adapter.
- Durable production location when configured: Vercel KV / Upstash REST.
- Local fallback: `/tmp/media-dashboard/client-state.json`; this fallback is ephemeral and is surfaced as non-durable in Admin.
- Previously saved production clients cannot be enumerated from repository files. They reside under the runtime-store key above and require the deployed authenticated API or configured KV instance to inspect.

## Immediate blocking validation

| Check | Status | Evidence / remaining validation |
| --- | --- | --- |
| Client creation | Implemented | Authenticated Admin `POST /api/admin/clients` calls the shared `createClient` store function. |
| Client listing | Implemented | Authenticated `GET /api/admin/clients` returns access-filtered records from the shared client store. |
| Client persistence | Code-verified with automated storage test | Writes use durable KV when configured; the Admin API now reports live reachability, store version, update time, and client count. Authenticated production create/read evidence remains an operational validation. |
| Active-client selection | Fixed, validation pending | Shared header changes now notify dashboard and Admin consumers immediately. Browser validation remains. |
| Existing client recovery | Location identified | Runtime key `media-dashboard:client-state`; live contents require production access. |

## Phase 5.1 inventory

- OAuth connect route: present.
- OAuth callback route: present.
- Connection status route: present.
- Advertiser discovery and selection: present.
- Per-client advertiser persistence: present through the shared runtime adapter.
- Event preview route: present, but the TikTok event-discovery request and raw-event extraction require API-contract verification.
- Shared source mapping resolver: called by TikTok normalization.
- TikTok conversion values: not yet implemented; current normalizer explicitly returns zero and therefore Phase 5.3 is not complete.
- Admin TikTok connection/mapping UI: not yet integrated; Admin still labels TikTok as planned.
- Rollback checkpoint for Phase 5.1: `33e99625d7b80565d90fe66e9295a8b6b3ae4a90`.
- Contract verification: TikTok's official Business API SDK documents the synchronous integrated report as `GET /open_api/v1.3/report/integrated/get/`; the current implementation incorrectly uses POST and is being corrected in this milestone.

## Milestone log

### Phase 5.1 — TikTok authentication and event-discovery hardening

- Status: code complete and locally validated; deployment pending.
- Corrected synchronous TikTok reporting calls to the documented GET contract with JSON-encoded array query parameters.
- Added a raw event catalog that keeps conversion count and conversion value as distinct selectable source events with accurate roles; events absent from the API response are not advertised as detected.
- Event preview now performs one upstream request, returns raw event evidence, records discovery success/failure time, and returns the shared conversion-mapping resolution.
- TikTok status now reports shared mapping health, last discovery state, token expiry metadata, and integration readiness without exposing tokens.
- OAuth callback now handles provider denial and missing client cookies safely and stores token expiry metadata.
- TikTok routes now require an exact existing client ID instead of silently falling back to another client.
- Added `docs/TIKTOK_PRODUCTION_SETUP.md` with the non-secret portal/Vercel configuration and Phase 5.2 validation sequence.
- Tests: `npm run test:tiktok-contract` passed (3/3); `npm run test:client-storage` passed (2/2).
- Validation: clean `npm ci`, `npx tsc --noEmit`, targeted lint, and `npm run build` passed; all 45 routes generated.
- Architecture impact: reused the TikTok adapter, shared connection store, shared mapping resolver, normalized paid-media contract, client store, and runtime storage. No parallel store, resolver, or dashboard formula was added.
- Rollback checkpoint: `33e99625d7b80565d90fe66e9295a8b6b3ae4a90`.

### M0.1 — Active-client selection propagation

- Added one shared browser event for active-client changes.
- Dashboard readiness consumers refresh against the newly selected client without requiring a page reload.
- Admin selection state follows the shared header and updates the URL context.
- Preserved the existing local-storage key for backward compatibility.
- Validation: `npx tsc --noEmit` passed; `npm run build` passed and generated all 45 routes.
- Repository lint baseline: `npm run lint` is blocked by 14 pre-existing errors in unrelated files. The failure is recorded for a separate cleanup milestone.
- Reproducible install baseline: `npm ci` is blocked because the committed lockfile omits the existing `next-auth` dependency from `package.json`.

Next: validate this milestone, then harden client-store diagnostics and production persistence evidence before completing TikTok Phase 5.1.

### M0.2 — Reproducible dependency and validation baseline

- Status: complete.
- Synchronized the committed npm lockfile with the existing `next-auth` dependency in `package.json`.
- `npm ci --ignore-scripts --cache /tmp/media-dashboard-npm-cache` passed from a clean dependency installation.
- `npx tsc --noEmit` passed.
- `npm run build` passed and generated all 45 routes.
- `npm run lint` consistently reports the existing baseline of 14 errors and 14 warnings; this milestone introduced no application-source lint changes.
- Architecture impact: none; this milestone changes dependency reproducibility and validation evidence only.
- Rollback checkpoint: `4e80f51`.
- Recreated GitHub commit: `7404b719603e33c6c4f095fef3a43d5cf7c70469` (local milestone commit: `89792dd`).
- GitHub lockfile verification: remote blob `7f5c4313e0c10d740f365387359946b6389ea5e4` and SHA-256 `c96cffdc60cae08a796021220490013db470c0a1f8e7a8c9cb3a6d208f7a328d` match the validated local file exactly.
- Remote-state validation: `npm ci`, manifest/lock consistency, `npx tsc --noEmit`, and `npm run build` passed from an archive of the GitHub commit; all 45 routes were generated.
- Production smoke tests: production alias and login returned `200`; unauthenticated Admin clients and TikTok status routes returned the expected `401` JSON response.

### M0.3 — Client persistence diagnostics and automated validation

- Status: complete.
- Added a read-only runtime storage health check that distinguishes configured-and-reachable durable storage from degraded ephemeral storage or an unreachable durable backend.
- Extended the existing Admin clients response with storage health, store key, state version, last update timestamp, and client count; no new store or schema was introduced.
- Added an automated JSON persistence round-trip and explicit ephemeral-risk health test.
- Validation: `npm run test:client-storage` passed (2 tests); `npx tsc --noEmit` passed; targeted lint passed; `npm run build` passed and generated all 45 routes.
- Architecture impact: preserved the shared runtime storage adapter and client store as the only ownership layer.
- Rollback checkpoint: `742cef7da4649570f3633b5211437989008e78a5`.
- Recreated GitHub commit: `a1879a374c93b3dce57dbb6969c57b948ee4176c` (local milestone commit: `395d2bf`).
- Deployment timestamp: `2026-07-21 13:36:46 UTC`; deployment reached READY at `2026-07-21 13:37:18 UTC`.
- Deployment status: READY (production); root smoke test returned `200` and the unauthenticated clients endpoint returned the expected `401`.

## Completed milestones

- Metrics Platform Foundation v1 and previously recorded runtime-consumption work.
- Shared normalized paid-media contract and source conversion mapping foundation.
- Meta mapping resolution and integration routes.
- TikTok connection storage, integration library, and OAuth connect route baseline.
- M0.1 — Active-client selection propagation.
- M0.2 — Reproducible dependency and validation baseline.
- M0.3 — Client persistence diagnostics and automated validation.
- Phase 5.1 — TikTok authentication and event-discovery hardening.

## Remaining milestones

1. Phase 5.2 — TikTok production validation (requires external setup and credentials).
2. Phase 5.3 — TikTok paid-media data normalization.
3. Phase 5.4 — Blended paid-media reporting.
4. Phase 5.5 — Admin mapping and client-management polish.
5. Phase 5.6 — Production QA and monitoring.
6. Phase 6 — Google Ads, then Snapchat, through the shared architecture.

## Known issues

- Production client create/read persistence still requires authenticated live validation.
- TikTok production OAuth, advertiser discovery, and event discovery require authenticated Phase 5.2 validation.
- Admin labels TikTok as planned despite the existing backend routes.
- The lint baseline contains 14 errors and 14 warnings.

## Technical debt

- Resolve the existing React effect-state lint violations, hook dependency warnings, two explicit `any` usages, and unused declarations.
- Add automated tests for active-client propagation, durable-KV integration, mapping resolution, and integration failure states.
- Pin the npm toolchain through project metadata if cross-environment lockfile churn becomes recurring.

## Required external setup

- TikTok: production app credentials, approved redirect URI, and advertiser/reporting permissions are now the Phase 5.2 blocker; see `docs/TIKTOK_PRODUCTION_SETUP.md`.
- Google Ads: developer token, OAuth client, and account access; required in Phase 6.
- Snapchat: developer app credentials and Ads API access; required in Phase 6.

## Rollback and deployment

- Current rollback commit: `6e58b3e` (last production state before M0.1/M0.2).
- Recreated GitHub commits: M0.1 `f77f30e830d9163b8fa5047999cfaf4cefbeb8e2`; M0.2 `7404b719603e33c6c4f095fef3a43d5cf7c70469`. These differ from local hashes `4e80f51` and `89792dd` because the connector recreated commit metadata; their Git trees match the validated local commits exactly.
- Deployed commit: `a1879a374c93b3dce57dbb6969c57b948ee4176c`.
- Deployment timestamp: `2026-07-21 13:36:46 UTC` (READY at `2026-07-21 13:37:18 UTC`).
- Deployment status: READY (production); production alias `https://media-dashboard-psi.vercel.app`.
- Next milestone: Phase 5.2 TikTok production validation.
