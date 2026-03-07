# Admin Bootstrap from Deploy Environment Design

**Date:** 2026-03-07

## Problem

Production currently applies Prisma schema migrations on API startup, but the default admin user and club only exist in `apps/api/prisma/seed.ts`. The seed script is not part of the production startup path, so a fresh production database can start without an administrator account.

The requested behavior is:

- bootstrap an admin user from deploy environment values
- bootstrap the associated club if the database is empty
- skip bootstrap when admin credentials are not configured
- update the deployment workflow so those inputs can be managed in GitHub repository settings

## Constraints

- Prisma migrations run as static SQL via `prisma migrate deploy`; they are not a safe place to consume runtime secrets such as admin credentials.
- The application expects an `adminClub` user to be associated with a `clubId`.
- Missing admin bootstrap env should not block deployment.
- Credentials must not be hardcoded in repository history.

## Approaches Considered

### 1. Recommended: API startup bootstrap script

After `prisma migrate deploy`, run an idempotent application-level bootstrap routine that reads deploy env values, creates or updates the club, and creates or updates the admin user.

### 2. SQL migration with fixed defaults

Add a Prisma migration that inserts a hardcoded club and admin user.

### 3. SQL migration with runtime-driven SQL variables

Try to pass deploy secrets into SQL migration execution and consume them inside the migration.

## Decision

Use the API startup bootstrap script.

## Rationale

- It can safely read deploy-time secrets already available to the container.
- It keeps schema migrations focused on schema, not environment-specific data.
- It supports skip behavior when bootstrap secrets are missing.
- It remains idempotent and can reconcile existing club/admin records on every startup.

## Design

### Bootstrap flow

On API startup:

1. run `prisma migrate deploy`
2. invoke a bootstrap routine before the server starts
3. read:
   - required secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - optional variables: `ADMIN_NAME`, `ADMIN_CLUB_NAME`, `ADMIN_CLUB_SECTION`, `ADMIN_CLUB_EMAIL`, `ADMIN_CLUB_PHONE`, `ADMIN_CLUB_ADDRESS`
4. if `ADMIN_EMAIL` or `ADMIN_PASSWORD` is missing, log a clear skip message and continue startup
5. otherwise:
   - hash the password with `bcrypt`
   - upsert the configured club
   - upsert the admin user by email
   - ensure the user has role `adminClub` and is linked to the configured club

### Idempotency rules

- Empty database: create the club and admin user
- Existing club: update to configured values
- Existing admin email: update name, password hash, role, and `clubId`
- Missing bootstrap secrets: skip without failing startup

### Transaction boundary

Club and admin writes should run inside a single Prisma transaction so the system does not create one without the other.

### Deployment workflow changes

Update the GitHub deploy workflow to pass:

- secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- variables: `ADMIN_NAME`, `ADMIN_CLUB_NAME`, `ADMIN_CLUB_SECTION`, `ADMIN_CLUB_EMAIL`, `ADMIN_CLUB_PHONE`, `ADMIN_CLUB_ADDRESS`

These should be injected only into the API runtime environment.

### Operator docs

Update deployment docs and the GitHub env sync helper so operators know which values are secrets versus plain variables.

## Error Handling

- Missing `ADMIN_EMAIL` or `ADMIN_PASSWORD`: log and skip
- Hashing failure: fail startup
- Prisma write failure: fail startup
- Existing admin linked to another club: reassign to the configured bootstrap club

## Testing

Add tests for:

- skip behavior when required secrets are absent
- creation of club and admin on empty state
- update of existing admin and relinking to configured club
- password hashing before persistence

## Expected Outcome

A fresh production deployment can start with a configured administrator account and club without relying on `prisma db seed`, while preserving safe secret handling and non-blocking behavior when bootstrap credentials are intentionally omitted.
