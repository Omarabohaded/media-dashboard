# TikTok production setup

This runbook is for Phase 5.2. Complete it one step at a time with the project owner; do not expose secret values in screenshots, logs, commits, or status responses.

## Application settings

- Product: TikTok API for Business / Marketing API.
- Production callback URL: `https://media-dashboard-psi.vercel.app/api/integrations/tiktok/callback`
- Required application permissions: advertiser account read access and reporting read access.
- The callback URL in TikTok must match the deployed URL exactly, including HTTPS and path.

## Vercel environment variables

| Variable | Required | Value source |
| --- | --- | --- |
| `TIKTOK_APP_ID` | Yes | TikTok Developer Portal application ID |
| `TIKTOK_APP_SECRET` | Yes | TikTok Developer Portal application secret |
| `TIKTOK_SCOPES` | Optional | Defaults to `advertiser.read,reporting.read` |
| `TIKTOK_API_BASE` | Optional | Defaults to `https://business-api.tiktok.com/open_api/v1.3` |
| `TIKTOK_OAUTH_BASE` | Optional | Defaults to `https://business-api.tiktok.com/portal/auth` |

Add required secrets to Production, Preview, and Development only where that environment is intended to make real TikTok calls. Redeploy after any environment-variable change.

## Validation sequence

1. Confirm `/api/integrations/tiktok/status?clientId=...` reports `configured: true` while authenticated.
2. Start OAuth from `/api/integrations/tiktok/connect?clientId=...`.
3. Confirm the callback returns to Admin with `tiktok_connected=1`.
4. Load advertiser accounts and select exactly one account for the client.
5. Refresh Admin and verify the selected advertiser persists.
6. Run event preview and verify `rawEvents`, detected event roles, `discoveredAt`, and shared mapping status.
7. Verify denial, missing permission, expired token, and TikTok API failure states are visible and do not populate conversion reporting silently.

Production validation evidence must record timestamps, the non-secret advertiser identifier/name, mapping status, deployment commit, and visible reporting result. Never record access or refresh tokens.
