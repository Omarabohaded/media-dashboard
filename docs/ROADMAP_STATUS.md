# Paid Media Dashboard Roadmap Status

Last updated: 2026-07-21

## Verified repository baseline

- Repository: `Omarabohaded/media-dashboard`
- Branch: `main`
- Baseline commit: `6e58b3e`
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
