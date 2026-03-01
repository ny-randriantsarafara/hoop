# License Category Relation Design

Date: 2026-03-01
Status: Approved

## Context

The import flow currently builds licenses from OCR data, but category handling is string-based end-to-end. This allows drift between configured categories and stored license values and weakens integrity.

Current state:
- License payload uses `category: string`.
- Database stores `licenses.category` as a plain string.
- API validates format but does not enforce category ownership via relation.

## Decision Summary

Adopt a full relation model:
- Replace license category string with `categoryId` (FK to category config).
- Move authoritative validation to API.
- Frontend sends `categoryId` only.
- Keep category labels for display by joining relation on read paths.

## Goals

- Guarantee every license is tied to a valid category by foreign key.
- Ensure API enforces category existence and club ownership.
- Remove hard-coded category strings from write contracts.

## Non-Goals

- Redesign category management UX.
- Add category versioning/history.
- Introduce broad compatibility layers beyond a short migration window.

## Architecture

### Data Model

`License` schema changes:
- Add `categoryId` mapped to `category_id`.
- Add relation from `License.categoryId` to `CategoryConfig.id`.
- Remove `License.category` string column after backfill.

Result: license category integrity is guaranteed by DB constraints.

### API Contract

Shared schema changes:
- `CreateLicenseInput`:
  - remove `category: string`
  - add `categoryId: uuid`
- Batch schema updates in the same way.

API behavior:
- On license create (single and batch), validate:
  1. player exists,
  2. season exists,
  3. category exists,
  4. category belongs to the same club context.
- Reject mismatches with explicit 4xx errors.

### Frontend Contract

Write operations:
- License forms and OCR import send `categoryId`.
- Category select option value is `categoryId`; label remains category name.

Read operations:
- Display category names through relation-resolved fields.

## Validation Ownership

Primary validation lives in API + DB:
- DB: FK guarantees relation integrity.
- API: ownership and business rule checks.

Frontend validation remains UX-oriented only:
- required select,
- prevent obvious empty submits,
- do not replace server validation.

## Migration Plan

1. Add nullable `category_id` + FK.
2. Backfill `licenses.category_id` by matching old `licenses.category` to `category_configs.name` within club scope (case-insensitive).
3. Run pre-check query before hardening:
   - unmatched categories,
   - ambiguous matches.
4. Resolve data issues.
5. Make `category_id` required.
6. Drop old `licenses.category`.

If needed, keep a short temporary compatibility layer where API accepts legacy `category` for one release, then remove it.

## Error Handling

API error cases:
- `Category not found` (unknown id),
- `Category not allowed for club` (cross-club mismatch),
- standard `Player not found` / `Season not found`.

Frontend behavior:
- show explicit toast/error message from API,
- OCR flow blocks license creation when no categories are configured.

## Testing Strategy

API tests:
- create license with valid `categoryId` succeeds,
- unknown `categoryId` fails,
- other-club `categoryId` fails,
- batch endpoint enforces same rules.

Migration verification:
- dry run pre-check on staging snapshot,
- assert zero unmatched/ambiguous before enforcing not-null.

Web tests:
- forms and OCR import submit `categoryId` payload,
- no string category writes remain.

## Rollout

Deploy order:
1. DB migration,
2. API changes,
3. web changes.

Post-deploy checks:
- create license from manual form,
- create license from OCR import,
- create licenses batch,
- verify DB row has valid `category_id` relation and correct UI label rendering.

## Acceptance Criteria

- No license write path accepts or sends raw category strings.
- API contract uses `categoryId` for single and batch create.
- Every `licenses` row references a valid category via FK.
- API rejects invalid/mismatched category relations with clear 4xx responses.
- Import and manual flows successfully create licenses using selected category relation.
