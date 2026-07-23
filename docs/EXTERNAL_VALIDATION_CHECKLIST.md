# Combined External Setup and End-to-End Validation

All platform code is implemented and contract-tested, but live success must not be claimed until this checklist is completed.

## Exact validation order

1. TikTok: create/approve app, add redirect URI, add environment variables, complete OAuth, select advertiser, discover events, map conversions, load normalized report.
2. Google Ads: obtain developer access/token, configure OAuth client and redirect URI, add environment variables, complete OAuth, select customer/manager account, discover conversion actions, map conversions, load normalized report.
3. Snapchat: create Marketing API OAuth app, configure redirect URI, add environment variables, complete OAuth, select organization/ad account, load conversion metric catalog, map conversions, load normalized report.
4. Meta: reconnect/revalidate token, ad account, discovery/mapping, and normalized report.
5. Client persistence: create a disposable client, edit it, refresh, verify listing/selection, deploy a no-op release, verify persistence, then delete it.
6. Conversion mapping: validate global defaults, a client override, missing purchases, missing value, and no implicit fallback on every platform.
7. Blended reporting: compare each platform channel total to its source UI, then confirm included-channel blended arithmetic and no double counting.
8. Single-client reporting: verify date range, campaigns, channel totals, blended totals, issues, and mapping states for one live client.
9. Portfolio reporting: verify client boundaries, owner access, mixed-currency warning, store truth, paid totals, and readiness across at least two clients.
10. Production monitoring: force or observe an expired token, failed request, stale sync, missing account, and missing mapping; verify Health shows each state and clears after remediation.

## Remaining external configuration

- TikTok developer app, approved scopes/redirect, production credentials, advertiser access.
- Google Cloud OAuth consent/client, Google Ads developer token/access level, redirect, customer and optional manager access.
- Snapchat Business Manager OAuth app, Marketing API access, redirect, organization/ad-account access.
- Meta authenticated revalidation.
- Durable production KV/Upstash snapshot and authenticated client persistence test.
