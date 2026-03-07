# Auth.js Trust Host Production Fix Design

**Date:** 2026-03-07

**Problem**

Production sets `NEXTAUTH_URL`, but Auth.js v5 still rejects requests with `UntrustedHost` for `https://hoop.nyhasinavalona.com/api/auth/session`.

**Root Cause**

The deployed app uses `next-auth` v5, where `NEXTAUTH_URL` is used for request URL and base-path handling, but automatic host trust in production is derived from `AUTH_URL` or `AUTH_TRUST_HOST`. The current web container environment forwards `NEXTAUTH_URL` and `NEXTAUTH_SECRET`, but not `AUTH_URL` or `AUTH_TRUST_HOST`, so `trustHost` remains false and Auth.js rejects the host.

**Approaches Considered**

1. Deployment-only patch
   Add `AUTH_URL` and `AUTH_TRUST_HOST` to the production web container environment and document them in deployment docs.

2. Code-only patch
   Hardcode `trustHost: true` in the NextAuth config.

3. Combined patch
   Apply both deployment and code changes.

**Decision**

Use the deployment-only patch.

**Rationale**

- Fixes the issue at the environment layer where it originates.
- Keeps trust policy explicit in deployment configuration.
- Avoids hardcoding permissive host trust across all environments.
- Matches Auth.js v5 environment conventions while remaining compatible with existing `NEXTAUTH_URL` usage.

**Design**

Update the production compose file so the `web` service receives:

- `AUTH_URL: ${NEXTAUTH_URL}`
- `AUTH_TRUST_HOST: ${AUTH_TRUST_HOST:-true}`

Update deployment documentation to:

- List `AUTH_TRUST_HOST` as a configurable variable.
- Mention `AUTH_URL` as the Auth.js v5 canonical host URL.
- Keep `NEXTAUTH_URL` documented because the app and deployment already use it, while showing that `AUTH_URL` should match it in production.

**Expected Outcome**

After redeploying with the new environment variables, Auth.js should trust requests for `https://hoop.nyhasinavalona.com` and `/api/auth/session` should stop failing with `UntrustedHost`.
