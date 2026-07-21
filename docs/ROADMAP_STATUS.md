# Paid Media Dashboard Roadmap Status

Last updated: 2026-07-21

Current project completion: 49%

Current milestone: M0.2 — Reproducible dependency and validation baseline (complete)

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
| Client persistence | Code-verified | Writes use durable KV when configured; production refresh/deployment persistence still requires an authenticated live create/read validation. |
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

## Milestone log

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

## Completed milestones

- Metrics Platform Foundation v1 and previously recorded runtime-consumption work.
- Shared normalized paid-media contract and source conversion mapping foundation.
- Meta mapping resolution and integration routes.
- TikTok connection storage, integration library, and OAuth connect route baseline.
- M0.1 — Active-client selection propagation.
- M0.2 — Reproducible dependency and validation baseline.

## Remaining milestones

1. Complete immediate client persistence validation and diagnostics.
2. Phase 5.1 — TikTok authentication and event-discovery hardening.
3. Phase 5.2 — TikTok production validation (requires external setup and credentials).
4. Phase 5.3 — TikTok paid-media data normalization.
5. Phase 5.4 — Blended paid-media reporting.
6. Phase 5.5 — Admin mapping and client-management polish.
7. Phase 5.6 — Production QA and monitoring.
8. Phase 6 — Google Ads, then Snapchat, through the shared architecture.

## Known issues

- Production client create/read persistence still requires authenticated live validation.
- TikTok event discovery requires API-contract verification.
- Admin labels TikTok as planned despite the existing backend routes.
- The lint baseline contains 14 errors and 14 warnings.

## Technical debt

- Resolve the existing React effect-state lint violations, hook dependency warnings, two explicit `any` usages, and unused declarations.
- Add automated tests for active-client propagation, durable client persistence, mapping resolution, and integration failure states.
- Pin the npm toolchain through project metadata if cross-environment lockfile churn becomes recurring.

## Required external setup

- TikTok: production app credentials, approved redirect URI and permissions; required for Phase 5.2, not for the next Phase 5.1 code milestone.
- Google Ads: developer token, OAuth client, and account access; required in Phase 6.
- Snapchat: developer app credentials and Ads API access; required in Phase 6.

## Rollback and deployment

- Current rollback commit: `6e58b3e` (last production state before M0.1/M0.2).
- Recreated GitHub commits: M0.1 `f77f30e830d9163b8fa5047999cfaf4cefbeb8e2`; M0.2 `7404b719603e33c6c4f095fef3a43d5cf7c70469`. These differ from local hashes `4e80f51` and `89792dd` because the connector recreated commit metadata; their Git trees match the validated local commits exactly.
- Deployed commit: `7404b719603e33c6c4f095fef3a43d5cf7c70469`.
- Deployment timestamp: `2026-07-21 13:29:40 UTC`.
- Deployment status: READY (production); production alias `https://media-dashboard-psi.vercel.app`.
- Next milestone: complete immediate client persistence diagnostics and automated store validation without requiring production credentials.
