# Paid Media Dashboard Roadmap Status

Last updated: 2026-07-23

Current project completion: 80%

Current milestone: Audit remediation — provider token refresh

Credential-independent code completion: 80%
Remaining completion attributable to authenticated live validation: not yet isolated; credential-independent audit remediation is active

## Final implementation audit remediation

The repository-only Final Implementation Verification Report supersedes earlier
completion claims. Its findings are mandatory acceptance criteria. No external
platform validation will begin until every credential-independent remediation
item is implemented and backed by automated evidence.

Priority order:

1. Access control and authorization.
2. Client lifecycle and data cleanup.
3. Multi-platform sync health and monitoring.
4. Provider token refresh.
5. Google Ads completeness.
6. Snapchat completeness.
7. Single-client reporting.
8. Portfolio reporting.
9. Route, storage, component, and end-to-end tests.
10. Final credential-independent production-readiness audit.

Evidence-based status at remediation start:

- Fully implemented foundations: shared paid-media contract and calculations,
  exact conversion-mapping resolver, TikTok normalization, shared aggregation,
  and operational documentation.
- Partial: client lifecycle, Admin mapping, Google Ads, Snapchat, single-client
  reporting, portfolio reporting, integration health, and access control.
- Stubbed or placeholder: Snapchat metric/event discovery labeling,
  multi-platform sync execution evidence, production authenticated smoke
  coverage, and Google customer display-name enrichment.
- Not implemented: provider refresh orchestration, paid-platform sync-run
  recording, complete handler/client authorization, cleanup of client-scoped
  mappings/runtime state, and the required route/component/end-to-end tests.

Remediation rollback checkpoint:

- Deployed source baseline: `f42994b3e372311bbf2e8cedf5dbde94485a1b38`.
- Existing release and rollback checkpoints remain unchanged.
- New immutable remediation checkpoint: `audit-remediation-baseline-20260723`
  (points to the deployed source baseline).

## Execution strategy — code-first completion

- Complete every credential-independent implementation milestone before opening TikTok, Google Ads, or Snapchat developer portals.
- Platform code must use official API contracts, the shared normalized paid-media contract, the shared source-conversion mapping resolver, and shared runtime/integration patterns.
- Credential-independent validation uses contract tests, deterministic fixtures, mocked API responses, TypeScript validation, production builds, and smoke tests.
- A platform may be labelled **implemented, awaiting live validation** after its complete code path passes those checks. It must not be labelled connected or production-validated until authenticated production evidence exists.
- No dashboard page may introduce platform-specific metric calculations. Single-client and portfolio views must consume the shared metric engine.
- All external setup and authenticated production verification is deferred to the final roadmap stage, **Combined External Setup and End-to-End Validation**.

## Verified repository baseline

- Repository: `Omarabohaded/media-dashboard`
- Branch: `main`
- Deployed baseline commit: `1245d4647b290aa795ef725fad40f90cc10d8a28`
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

### Audit remediation 3 — Multi-platform sync health

- Shared paid-media execution now records a persisted attempt, success or
  failure, timestamps, row count, and failure reason for Meta, TikTok, Google
  Ads, and Snapchat requests.
- Single-client/blended reporting and each platform report-preview route use
  the same sync recorder; no parallel monitoring store was introduced.
- Sync history retention was expanded so portfolio health is not silently
  truncated to the latest 25 runs.
- Integration Health derives never-synced, stale, failed, expired-token,
  missing-account, missing-mapping, and healthy states from shared connection,
  mapping, and sync evidence.
- Automated tests prove TikTok, Google Ads, and Snapchat success/failure
  persistence and the complete health-state precedence.
- Rollback: `fccc93f59869eff89e0a724f464784ed962dee21`.

### Audit remediation 2 — Client lifecycle and data cleanup

- Client create, list, update, and delete operations are exercised through the
  configured runtime storage abstraction.
- Active-client persistence and immediate browser event propagation are
  covered by automated tests.
- Client deletion now clears client-scoped source conversion mappings, metric
  mappings, TikTok/Google Ads/Snapchat connections and selections, shared sync
  state, media/business snapshots, and access assignments before deleting the
  client record.
- Meta, Shopify, and WooCommerce records remain cleaned atomically inside the
  client store.
- Cleanup steps are idempotent and the client record is deleted last, allowing
  an interrupted cleanup to be retried safely.
- Global conversion defaults and metric mappings are explicitly preserved.
- Rollback: `de675bf797d96a04685701a4389b0f20ff78bc63`.

### Audit remediation 1 — Access control and authorization

- Middleware now validates the decoded Auth.js session and expiry; it no longer
  treats a session-cookie name as authentication.
- Added handler-level authentication to protected Admin, reporting, sync,
  Meta, TikTok, Google Ads, Snapchat, Shopify, WooCommerce, and WordPress
  routes.
- Added client-visibility authorization for every protected handler that accepts
  a client ID.
- Integration writes require owner/admin access or an explicit client-level
  manage/admin assignment. Owner/Admin management remains enforced server-side.
- `/api/reports/client` rejects users without visibility for the requested
  client.
- Health results are filtered to clients visible to the authenticated user.
- Split Auth.js into an Edge-safe session-validation config and server-only
  credential verification so middleware does not bundle Node-only storage or
  cryptography.
- Automated evidence covers no session, fabricated/unverified session,
  expired/invalid session, valid session, visible client, unauthorized client,
  non-admin management denial, and handler-level guard coverage.
- Validation: clean `npm ci`; 64/64 tests; TypeScript; targeted lint; 63-route
  production build.
- Production deployment: `de675bf797d96a04685701a4389b0f20ff78bc63`
  (`READY` on Vercel).
- Remote verification: deployed Git tree
  `cbd142552b8adb6af77abacf9b12f6bef070f9d8` exactly matches the validated
  local tree for `e201c4eb17f23d356018ac5727b1ccffa7c57c67`.
- Production smoke validation: 12/12 passed, including unauthenticated
  rejection for health, reporting, TikTok, Google Ads, and Snapchat protected
  endpoints.
- Rollback: `audit-remediation-baseline-20260723`.

### Phase 10 — Documentation, backup, rollback, and deployment readiness

- Added an executable production smoke suite for public pages and protected Admin/reporting/integration routes.
- Added an environment-variable name inventory without secret values.
- Added durable-runtime backup, recoverable Git/Vercel rollback, and release-gate instructions.
- Added the final Admin/client/platform/reporting user workflow.
- Consolidated every portal/credential/live-account action into `docs/EXTERNAL_VALIDATION_CHECKLIST.md` in exact test order.
- No destructive migration or production-data mutation is required by the credential-independent roadmap.
- Rollback checkpoint: `860898c2d1dec1b9b423db79c3dcaedfded949d3` before the health/documentation releases.

### Phase 9 — Integration health interfaces

- Added a production Health-page operations panel backed by the shared fleet-health endpoint.
- Shows every client/platform connection, token expiry, account selection, conversion mapping, last attempt, last successful sync, failed request, freshness, durable-storage state, and exact next action.
- Summary counters expose healthy, action-needed, failed, expired, and stale states without claiming never-synced sources are healthy.
- Validation: clean `npm ci`, health tests (3/3), TypeScript, targeted lint, and production build passed; 63 routes generated.
- Rollback checkpoint: `860898c2d1dec1b9b423db79c3dcaedfded949d3`.

### Phase 8 — Portfolio reporting

- Added authenticated owner/admin `GET /api/reports/portfolio`, which runs every visible client through the same shared paid-media reporting service.
- Portfolio results preserve client, channel, currency, issue, mapping, and blended-total boundaries; client totals are never merged across currencies.
- The existing Portfolio UI now combines store truth with the shared four-platform paid-media report instead of treating Meta as the only paid source.
- Readiness and issue displays reflect all included paid channels and explicitly retain partial/missing-source states.
- Deterministic portfolio contract test passed, covering client boundaries, reporting-client counts, and action-needed counts.
- Validation: all suites (21/21), TypeScript, targeted lint, and production build passed; 63 routes generated.
- Rollback checkpoint: single-client reporting GitHub checkpoint (deployment record pending publication).

### Phase 7 — Single-client reporting

- Extracted one shared paid-media reporting service used by dashboard/report endpoints for Meta, TikTok, Google Ads, and Snapchat.
- Added authenticated `GET /api/reports/client` with selected-client/date-range reporting, channel totals, blended totals, rows, mapping states, and explicit source issues.
- The existing Paid Media UI now labels and renders all four sources through the same normalized rows and aggregation engine.
- Included-channel rules are resolved once in the shared service; no page owns platform-specific formulas.
- Validation: all suites passed, TypeScript passed, targeted lint passed, and the production build generated 63 routes.
- Rollback checkpoint: `725618f743cbd91c92ff4f0d6c4ab61b3e50a4af`.

### Phase 6.2 — Snapchat integration

- Status: credential-independent implementation complete; awaiting live validation.
- Added per-client OAuth/token storage, expiry metadata, organization/account selection, discovery history, and error state.
- Added OAuth connect/callback/disconnect, organization and ad-account discovery/selection, conversion metric catalog, status, and normalized report-preview routes.
- Uses the official Snap Marketing API OAuth, `/me/organizations?with_ad_accounts=true`, and ad-account measurement contracts.
- Campaign reporting normalizes micro-currency spend/value, impressions, swipes/clicks, purchases, purchase value, derived efficiency metrics, date range, campaign identity, and raw metadata into the shared contract.
- Stats requests include base delivery fields plus exactly the two mapped conversion metrics. Missing mappings produce zero conversion values and explicit status without fallback.
- Admin exposes connection, account selection, conversion discovery, missing environment values, token state, and mapping health.
- Snapchat rows participate in unified included-channel/blended reporting and the shared fleet-health evaluator.
- Contract fixtures passed (3/3): exact requested fields, micro-currency normalization, and no unrelated fallback.
- Validation: clean `npm ci`, all suites (20/20), TypeScript, targeted lint, and production build passed; 61 routes generated.
- Architecture impact: follows the existing platform connection-store, shared source-mapping resolver, normalized adapter, unified report, and health patterns.
- Rollback checkpoint: `725b9bf54c71c36a49d18db102edbf1e95fe82e1`.

### Phase 6.1 — Google Ads integration

- Status: credential-independent implementation complete; awaiting live validation.
- Added per-client OAuth connection storage, access/refresh token metadata, token expiry, selected customer, optional manager login customer, discovery history, and error state.
- Added OAuth connect/callback/disconnect, accessible-customer discovery and selection, conversion-action discovery, status, and normalized report-preview routes.
- Uses Google Ads REST accessible-customer and `searchStream` contracts with configurable API version.
- Campaign reporting normalizes cost micros, impressions, clicks, purchases, purchase value, CTR, CPC, CPM, ROAS, campaign identity, date range, and raw metadata into the shared paid-media contract.
- Conversion reporting requests only the two explicitly mapped conversion actions. Unrelated conversions are never substituted or summed into purchases/value.
- Added Google Ads to the unified paid-media endpoint and shared included-channel behavior.
- Admin now exposes connection, customer/manager selection, conversion discovery, missing environment requirements, token state, and shared mapping health.
- Client deletion clears the client-scoped Google Ads and TikTok connection records.
- Contract fixtures passed (3/3): exact conversion-action query, no unrelated fallback, and distinct purchase/value role extraction.
- Validation: clean `npm ci`, all suites (17/17), TypeScript, targeted lint, and production build passed; 55 routes generated.
- Architecture impact: follows the existing connection-store, shared mapping, normalized adapter, and unified-report pattern. No Google-specific dashboard calculations were added.
- Rollback checkpoint: `628264899243ae0ef704e4a22bbd7c27ecb76bd0`.

### Phase 5.6 — Production QA infrastructure and monitoring

- Status: credential-independent implementation complete; authenticated live monitoring verification remains in the final combined stage.
- Added one shared integration-health evaluator with deterministic priority for missing connection, expired token, missing account, failed request, missing mapping, stale data, and first-live-validation states.
- Added authenticated `GET /api/health/integrations` fleet health for every client across Meta, TikTok, Google Ads, and Snapchat.
- Health output includes selected-account state, shared mapping status, token expiry, latest attempt, latest successful sync, last error, data freshness, recommended action, durable-store health, and summary counts.
- Data freshness is explicit (`fresh`, `stale`, or `never`) and never implies a successful sync when none exists.
- Added deterministic monitoring tests covering healthy data, token-expiry precedence, and never-synced live-validation state (3/3).
- Validation: clean `npm ci`, all existing tests (14/14 total), TypeScript, targeted lint, and production build passed; 49 routes generated.
- Architecture impact: health reads the existing connection, mapping, sync, client, and runtime stores. It adds no alternate persistence or calculation engine.
- Rollback checkpoint: `6b05e590553fa85edc0bd67e8dd79e636db1f670`.

### Phase 5.5 — Admin mapping and client-management polish

- Status: credential-independent implementation complete; platform connections remain awaiting live validation.
- Added authenticated Admin read/write routes for the existing shared source-conversion mapping store.
- Admin supports global platform defaults and per-client overrides for exactly one purchases event and one purchase-value event.
- Added explicit resolved mapping health for Meta, TikTok, Google Ads, and Snapchat without implicit fallback.
- TikTok is no longer presented as a planned source: Admin now exposes connection/reconnection, advertiser selection, discovered-event loading, mapping health, token-expiry state, missing environment requirements, and last discovery time.
- Added client editing while preserving existing identifiers and connection ownership; creation, selection, deletion, and durable-store diagnostics remain on the shared client store.
- Manual mapping input remains available when event discovery is unavailable; discovered TikTok events populate role-filtered suggestions.
- Architecture impact: extended the existing client store, source-conversion mapping store, and integration routes only. No schema migration, parallel store, or dashboard-owned platform calculation was introduced.
- Validation: clean `npm ci`, storage tests (2/2), TikTok contract tests (7/7), paid-media aggregation tests (2/2), TypeScript, production build (48 routes), and targeted lint for new Phase 5.5 files passed. The two pre-existing Admin effect lint findings remain tracked for Phase 5.6 cleanup.
- Rollback checkpoint: `4eef74d11fcc4dd4678f2fce6f9ae1de7fc6b609`.

### Phase 5.4 — Blended Meta and TikTok reporting

- Status: credential-independent implementation complete; TikTok data remains awaiting live validation in the final combined stage.
- Added `GET /api/dashboard/paid-media` as the unified Meta/TikTok reporting endpoint for the selected client and reporting window.
- Meta rows are now converted into the same normalized paid-media contract used by TikTok before aggregation.
- Added shared contract aggregation for channel summaries and one blended summary; dashboard pages do not calculate platform-specific totals.
- Included-channel configuration for `total_ad_spend` controls which channel rows enter the blended report.
- Channel totals remain visible separately from blended totals, preventing hidden double counting.
- Source failures, unavailable connections, and conversion-mapping statuses are returned explicitly instead of being hidden or replaced.
- Updated the Paid Media page to consume the unified report, show Meta and TikTok campaign rows together, identify each channel, and distinguish channel totals from blended totals.
- Tests: paid-media aggregation fixtures passed (2/2), covering blended arithmetic, channel separation, and included-channel exclusion; TikTok contract tests remained 7/7.
- Validation: TypeScript, targeted lint, and production build passed; 47 routes generated.
- Architecture impact: the shared paid-media contract owns normalization-derived metrics and aggregation. The endpoint orchestrates existing adapters/stores; the page displays the shared result only.
- Rollback checkpoint: `7f36cb47559c55b9a38fc0aa0d4e7fce1d069ffc`.
- Local milestone commit: `8ac6ee787531f60c08bf676ee0ac3dbe018a2abe`; recreated GitHub commit: `8846815697717b66fd1b1d738dddcc95e1374857`. Both point to tree `7959ebd95443ff775eb6ffc4d5d5ed03eccc1629`.
- Deployment timestamp: `2026-07-22 13:38:37 UTC`; Vercel deployment `dpl_HYMiS5h1ExnFtFDzSdzrCYTb3FZp` reached READY.
- Production smoke tests: root, Paid Media, and the blended-report API enforced authentication (`307`, `307`, and `401`); login returned `200`.


### Phase 5.3 — TikTok paid-media data normalization

- Status: credential-independent implementation complete; awaiting live validation in the final combined stage.
- Added the documented campaign-level synchronous reporting query with pagination and an explicit date range.
- The reporting query requests base delivery metrics plus exactly the configured purchases and purchase-value metrics; it does not add implicit conversion events or sum multiple events.
- Added normalized reporting fetch and preview route at `GET /api/integrations/tiktok/report-preview`.
- Normalized spend, impressions, clicks, purchases, purchase value, CTR, CPC, CPM, ROAS, source, channel, client, date range, mapping status, and selected event identifiers.
- Preserved campaign identifiers, campaign names when returned, raw dimensions, and raw source metrics as metadata.
- Moved derived paid-media calculations into the shared paid-media contract helper so dashboard pages do not own TikTok formulas.
- Missing mappings produce explicit mapping status and zero conversion values; unrelated TikTok conversion fields are never substituted.
- Contract fixtures cover query construction, distinct event roles, exact mapped-event extraction, missing mappings, and duplicate metric avoidance (7/7 passed).
- Validation: clean `npm ci`, client-storage tests (2/2), TikTok contract tests (7/7), TypeScript, targeted lint, and production build passed; 46 routes generated after adding the normalized preview endpoint.
- Architecture impact: extended the existing TikTok adapter and normalized contract only; reused the shared conversion-mapping resolver and connection store. No platform-specific dashboard calculation layer was added.
- Rollback checkpoint: `a13d4eecc1bc8355e88169eb6c82b1f8d6fb6949`.
- Local milestone commit: `298875a94f01bbf3990d6e4494168e70724c9759`; recreated GitHub commit: `f805982f7326c6f1861f14408c5c24a4f4cead0d`. Both point to tree `695dff74b7a1414f1c6ee80884e9f70970ddf5c5`.
- Deployment timestamp: `2026-07-22 13:28:46 UTC`; Vercel deployment `dpl_3d4pmuDGSpcaY2nGyJsU3NTSt3P6` reached READY.
- Production smoke tests: root redirected to authentication (`307`), login returned `200`, and the unauthenticated normalized TikTok report endpoint returned the expected `401` JSON response.


### Phase 5.1 — TikTok authentication and event-discovery hardening

- Status: complete and deployed.
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
- Local milestone commit: `19bb5fa643145fbba6344cfc6d5c112196f7b591`; recreated GitHub commit: `1245d4647b290aa795ef725fad40f90cc10d8a28`. Both point to tree `018d7aedcbbc43b6bd0a1c7a2b45098afedd835d`.
- Remote-state validation: clean `npm ci`, TikTok contract tests, TypeScript, and production build passed from GitHub commit `1245d464`; all 45 routes generated.
- Deployment timestamp: `2026-07-21 14:02:31 UTC`; Vercel deployment `dpl_CaxdLK6dJgMNFSdwcZUFp2Tjx4fP` reached READY.
- Production smoke tests: root redirected to authentication (`307`), login returned `200`, and unauthenticated TikTok status/event-preview endpoints returned the expected `401` JSON responses.

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
- Phase 5.3 — TikTok paid-media normalization (awaiting live validation).
- Phase 5.4 — Blended Meta and TikTok reporting (awaiting live validation).
- Phase 5.5 — Admin mapping and client-management polish.
- Phase 5.6 — Production QA infrastructure and monitoring.
- Phase 6.1 — Google Ads integration (awaiting live validation).
- Phase 6.2 — Snapchat integration (awaiting live validation).
- Phase 7 — Single-client reporting (awaiting live validation).
- Phase 8 — Portfolio reporting (awaiting live validation).
- Phase 9 — Integration health interfaces.
- Phase 10 — Documentation, backup, rollback, and deployment readiness.

## Remaining milestones

1. Combined External Setup and End-to-End Validation.

## Combined External Setup and End-to-End Validation

This is the only final stage that requires developer portals, credentials, secrets, or live advertiser accounts. It contains:

- TikTok developer app setup, environment variables, OAuth validation, advertiser validation, and event validation.
- Google Ads developer setup, environment variables, OAuth validation, and reporting validation.
- Snapchat developer setup, environment variables, OAuth validation, and reporting validation.
- Meta revalidation.
- Real client creation and persistence validation.
- Real conversion mapping validation.
- Blended reporting verification.
- Single-client reporting verification.
- Portfolio reporting verification.
- Production monitoring verification.

## Known issues

- Production client create/read persistence still requires authenticated live validation.
- TikTok production OAuth, advertiser discovery, event discovery, and reporting remain implemented/implementing but awaiting live validation in the final combined stage.
- The lint baseline contains 14 errors and 14 warnings.

## Technical debt

- Resolve the existing React effect-state lint violations, hook dependency warnings, two explicit `any` usages, and unused declarations.
- Add automated tests for active-client propagation, durable-KV integration, mapping resolution, and integration failure states.
- Pin the npm toolchain through project metadata if cross-environment lockfile churn becomes recurring.

## Required external setup

- TikTok: production app credentials, approved redirect URI, and advertiser/reporting permissions; deferred to the final combined validation stage. See `docs/TIKTOK_PRODUCTION_SETUP.md`.
- Google Ads: developer token, OAuth client, and account access; deferred to the final combined validation stage.
- Snapchat: developer app credentials and Ads API access; deferred to the final combined validation stage.

## Rollback and deployment

- Final credential-independent code commit: `b03306b71201619b870a21f8f55b9862780c28a1`.
- Final deployment: Vercel deployment `dpl_vBMfzWAD49tEGH5biyacAjSfRwSW` reached READY on 2026-07-23; production alias `https://media-dashboard-psi.vercel.app`.
- Final credential-independent production smoke suite: 12/12 passed after the READY deployment.
- Current rollback commit: `33e99625d7b80565d90fe66e9295a8b6b3ae4a90` (last production state before Phase 5.1).
- Recreated GitHub commits: M0.1 `f77f30e830d9163b8fa5047999cfaf4cefbeb8e2`; M0.2 `7404b719603e33c6c4f095fef3a43d5cf7c70469`. These differ from local hashes `4e80f51` and `89792dd` because the connector recreated commit metadata; their Git trees match the validated local commits exactly.
- Deployed commit: `8846815697717b66fd1b1d738dddcc95e1374857`.
- Deployment timestamp: `2026-07-22 13:38:37 UTC` (READY).
- Deployment status: READY (production); production alias `https://media-dashboard-psi.vercel.app`.
- Next milestone: Combined External Setup and End-to-End Validation. No additional credential-independent roadmap work remains.
