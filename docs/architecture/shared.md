# Shared Package

The `@hoop/shared` package (`packages/shared/`) contains everything that both the API and the web app need: TypeScript types, Zod validation schemas, constants, and utility functions. It is imported by both `@hoop/api` and `@hoop/web` as `workspace:*`.

The package has a single entry point (`src/index.ts`) that re-exports everything from four subdirectories.

## Folder structure

```
packages/shared/src/
├── index.ts             # Re-exports everything
├── constants/
│   ├── index.ts
│   ├── enums.ts         # Role, LicenseStatus, Gender
│   ├── genderLabels.ts  # Human-readable gender labels
│   └── templatePlaceholders.ts  # Placeholder registry and lists
├── filters/
│   ├── index.ts
│   ├── filterFieldDefinition.ts  # Generic filter field types
│   ├── playerFilterFields.ts     # Player filter definitions
│   └── licenseFilterFields.ts    # License filter definitions
├── types/
│   ├── index.ts
│   ├── club.ts
│   ├── player.ts
│   ├── license.ts
│   ├── season.ts
│   ├── user.ts
│   ├── template.ts
│   └── spreadsheetPreview.ts
├── schemas/
│   ├── index.ts
│   ├── authSchema.ts
│   ├── playerSchema.ts
│   ├── licenseSchema.ts
│   ├── seasonSchema.ts
│   ├── clubSchema.ts
│   ├── ocrSchema.ts
│   └── spreadsheetPreviewSchema.ts
└── utils/
    ├── index.ts
    └── computeCategory.ts
```

---

## Constants

### Enums (`constants/enums.ts`)

String literal union types used across the application:

#### Role

```typescript
type Role = "adminClub"
```

Currently only one role exists. Club administrators have full access to their club's data.

#### LicenseStatus

```typescript
type LicenseStatus = "active" | "expired"
```

#### Gender

```typescript
type Gender = "G" | "F" | "H" | "D"
```

| Value | French meaning | English meaning |
|---|---|---|
| G | Garçon | Boy |
| F | Fille | Girl |
| H | Homme | Man |
| D | Dame | Woman |

### Gender labels (`constants/genderLabels.ts`)

A record mapping gender codes to human-readable labels:

| Key | Label |
|---|---|
| `G` | Boy |
| `F` | Girl |
| `H` | Man |
| `D` | Woman |

### Template placeholders (`constants/templatePlaceholders.ts`)

Defines all placeholders that can be used in XLSX and DOCX templates. Placeholders use the `{{name}}` syntax.

#### Placeholder registry

The `placeholderRegistry` is the central definition. It contains two scopes:

**Document-level placeholders** — replaced once per document:

| Placeholder | Description |
|---|---|
| `{{seasonLabel}}` | Season label (e.g., "2025-2026") |
| `{{clubName}}` | Club name |
| `{{clubSection}}` | Club section |
| `{{exportDate}}` | Document generation date |

**Player-row placeholders** — replaced once per player row:

| Placeholder | Description |
|---|---|
| `{{order}}` | Row number (1, 2, 3...) |
| `{{playerLastName}}` | Player last name |
| `{{playerFirstName}}` | Player first name |
| `{{playerBirthDate}}` | Player birth date (formatted dd/MM/yyyy) |
| `{{playerGender}}` | Player gender code |
| `{{playerAddress}}` | Player address |
| `{{playerPhone}}` | Player phone number |
| `{{playerEmail}}` | Player email address |
| `{{playerCategory}}` | Computed category based on birth date |
| `{{licenseNumber}}` | License number |
| `{{licenseStatus}}` | License status |
| `{{licenseStartDate}}` | License start date |
| `{{licenseEndDate}}` | License end date |
| `{{licenseCategory}}` | License category |

#### Exported lists

| Export | Description |
|---|---|
| `documentPlaceholders` | Array of document-level placeholder strings |
| `playerRowPlaceholders` | Array of player-row placeholder strings |
| `allPlaceholders` | Combined array of all placeholder strings |
| `placeholderRegistry` | Full registry with scope, label, and description for each |

#### Types

| Type | Description |
|---|---|
| `PlaceholderScope` | `"document"` or `"playerRow"` |
| `PlaceholderDefinition` | `{ key, label, description, scope }` |
| `DocumentPlaceholder` | Union type of document placeholder string literals |
| `PlayerRowPlaceholder` | Union type of player-row placeholder string literals |
| `TemplatePlaceholder` | Union of `DocumentPlaceholder` and `PlayerRowPlaceholder` |

---

## Filters

The filter system provides a generic, data-driven way to define filterable fields. The web app's `FilterBar` component reads these definitions and renders appropriate inputs.

### FilterFieldDefinition (`filters/filterFieldDefinition.ts`)

```typescript
type FilterFieldType = "text" | "select" | "date"

interface FilterFieldOption {
  readonly value: string
  readonly label: string
}

interface FilterFieldDefinition {
  readonly key: string
  readonly label: string
  readonly type: FilterFieldType
  readonly placeholder?: string
  readonly options?: readonly FilterFieldOption[]
}
```

### Player filter fields (`filters/playerFilterFields.ts`)

| Key | Label | Type | Options |
|---|---|---|---|
| `search` | Search | text | — |
| `gender` | Gender | select | G (Boy), F (Girl), H (Man), D (Woman) |
| `category` | Category | select | dynamic (loaded from API) |
| `birthDateFrom` | Birth date from | date | — |
| `birthDateTo` | Birth date to | date | — |
| `seasonId` | Season | select | dynamic (loaded from API) |

### License filter fields (`filters/licenseFilterFields.ts`)

| Key | Label | Type | Options |
|---|---|---|---|
| `seasonId` | Season | select | dynamic (loaded from API) |
| `status` | Status | select | active (Active), expired (Expired) |
| `category` | Category | select | dynamic (loaded from API) |
| `number` | License number | text | — |
| `endDateFrom` | End date from | date | — |
| `endDateTo` | End date to | date | — |
| `startDateFrom` | Start date from | date | — |
| `startDateTo` | Start date to | date | — |

---

## Types

TypeScript interfaces that define the shape of data throughout the application. These mirror the Prisma models but are decoupled from Prisma — they are plain interfaces.

### Club

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `name` | string | Club name |
| `section` | string | Club section |
| `address` | string | Physical address |
| `phone` | string | Phone number |
| `email` | string | Email |
| `logoUrl` | string \| null | Logo URL |
| `createdAt` | string | ISO datetime |
| `updatedAt` | string | ISO datetime |

### Player

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `clubId` | string | Owning club |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `birthDate` | string | ISO date |
| `gender` | Gender | G, F, H, or D |
| `address` | string | Address |
| `phone` | string \| null | Phone |
| `email` | string \| null | Email |
| `photoUrl` | string \| null | Photo URL |
| `createdAt` | string | ISO datetime |
| `updatedAt` | string | ISO datetime |

### License

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `playerId` | string | Licensed player |
| `seasonId` | string | Season |
| `number` | string | Unique license number |
| `status` | LicenseStatus | active or expired |
| `category` | string | Category |
| `startDate` | string | ISO date |
| `endDate` | string | ISO date |
| `createdAt` | string | ISO datetime |
| `updatedAt` | string | ISO datetime |

### LicenseWithRelations

Extends `License` with:

| Field | Type | Description |
|---|---|---|
| `player` | `{ firstName, lastName }` | Player name |
| `season` | `{ label }` | Season label |

### Season

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `label` | string | Display label |
| `startDate` | string | ISO date |
| `endDate` | string | ISO date |
| `active` | boolean | Whether currently active |

### User

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `clubId` | string \| null | Associated club |
| `name` | string | Display name |
| `email` | string | Email |
| `passwordHash` | string | bcrypt hash |
| `role` | Role | User role |
| `lastLogin` | string \| null | ISO datetime |
| `createdAt` | string | ISO datetime |

### Template

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `clubId` | string | Owning club |
| `name` | string | Template name |
| `description` | string \| null | Description |
| `format` | `"xlsx"` \| `"docx"` | File format |
| `placeholders` | string[] | Placeholder keys found in the file |
| `createdAt` | string | ISO datetime |
| `updatedAt` | string | ISO datetime |

### Spreadsheet preview types (`types/spreadsheetPreview.ts`)

Used by the template upload flow to display and interact with XLSX files.

#### CellStyle

| Field | Type | Description |
|---|---|---|
| `bold` | boolean | Bold text |
| `italic` | boolean | Italic text |
| `fontSize` | number \| null | Font size in points |
| `fontColor` | string \| null | Font color (hex) |
| `backgroundColor` | string \| null | Background color (hex) |
| `borderTop` | boolean | Top border |
| `borderBottom` | boolean | Bottom border |
| `borderLeft` | boolean | Left border |
| `borderRight` | boolean | Right border |
| `horizontalAlignment` | `"left"` \| `"center"` \| `"right"` \| null | Horizontal alignment |

#### PreviewCell

| Field | Type | Description |
|---|---|---|
| `row` | number | Zero-based row index |
| `col` | number | Zero-based column index |
| `value` | string | Cell text content |
| `style` | CellStyle | Cell styling |
| `placeholder` | string \| null | Detected placeholder (if the cell contains one) |

#### MergedRegion

| Field | Type | Description |
|---|---|---|
| `startRow` | number | Zero-based start row |
| `startCol` | number | Zero-based start column |
| `endRow` | number | Zero-based end row |
| `endCol` | number | Zero-based end column |

#### CellMapping

| Field | Type | Description |
|---|---|---|
| `row` | number | Zero-based row index |
| `col` | number | Zero-based column index |
| `placeholder` | string | Placeholder to write into this cell |

#### SpreadsheetPreview

| Field | Type | Description |
|---|---|---|
| `cells` | PreviewCell[] | All cells with values and styles |
| `mergedCells` | MergedRegion[] | Merged cell regions |
| `columnWidths` | number[] | Column widths in pixels |
| `rowCount` | number | Total number of rows |
| `colCount` | number | Total number of columns |

---

## Schemas

Zod validation schemas shared between the API (for request validation) and the web app (for form validation). Each schema file exports both the schema and its inferred TypeScript type.

### Auth schema (`schemas/authSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `loginSchema` | `email` (string, email), `password` (string, min 8) | Login request validation |

Inferred type: `LoginInput`.

### Player schema (`schemas/playerSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `createPlayerSchema` | `clubId` (uuid), `firstName` (string), `lastName` (string), `birthDate` (date), `gender` (G/F/H/D), `address` (string), `phone?`, `email?`, `photoUrl?` | Create player validation |
| `updatePlayerSchema` | All fields from create, but all optional | Update player validation |

Inferred types: `CreatePlayerInput`, `UpdatePlayerInput`.

### License schema (`schemas/licenseSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `createLicenseSchema` | `playerId` (uuid), `seasonId` (uuid), `number` (string), `status` (active/expired), `category` (string), `startDate` (date), `endDate` (date) | Create license validation |
| `createLicensesBatchSchema` | `licenses` (array of createLicenseSchema) | Batch create validation |

Inferred types: `CreateLicenseInput`, `CreateLicensesBatchInput`.

### Season schema (`schemas/seasonSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `createSeasonSchema` | `label` (string), `startDate` (date), `endDate` (date), `active` (boolean) | Create season validation |
| `updateSeasonSchema` | All fields from create, but all optional | Update season validation |

Inferred types: `CreateSeasonInput`, `UpdateSeasonInput`.

### Club schema (`schemas/clubSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `createClubSchema` | `name`, `section`, `address`, `phone`, `email`, `logoUrl?` | Create club validation |
| `updateClubSchema` | All fields from create, but all optional | Update club validation |

Inferred types: `CreateClubInput`, `UpdateClubInput`.

### OCR schema (`schemas/ocrSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `ocrPlayerDataSchema` | `firstName`, `lastName`, `birthDate`, `gender`, `address`, `phone`, `email` — all nullable strings | Extracted player data from OCR |
| `ocrLicenseDataSchema` | `number`, `category`, `startDate`, `endDate` — all nullable strings | Extracted license data from OCR |
| `ocrExtractionResultSchema` | `confidence` (high/medium/low), `player` (ocrPlayerDataSchema), `license` (ocrLicenseDataSchema) | Full OCR extraction result |
| `ocrExtractionResponseSchema` | `extractionId` (string) + all fields from ocrExtractionResultSchema | API response with extraction ID |
| `validateExtractionSchema` | `validatedData` (object with `player` and `license`) | Human-corrected OCR data |

Inferred types: `OcrPlayerData`, `OcrLicenseData`, `OcrExtractionResult`, `OcrExtractionResponse`, `ValidateExtractionInput`.

### Spreadsheet preview schema (`schemas/spreadsheetPreviewSchema.ts`)

| Schema | Fields | Description |
|---|---|---|
| `cellMappingSchema` | `row` (int ≥ 0), `col` (int ≥ 0), `placeholder` (string) | Maps a cell position to a placeholder |
| `spreadsheetPreviewSchema` | `cells`, `mergedCells`, `columnWidths`, `rowCount`, `colCount` | Full spreadsheet preview structure |

Inferred type: `CellMapping` (also available from types).

---

## Utilities

### `computeCategory(birthDate, seasonYear, categories)`

Determines which age category a player belongs to based on their birth date and the season year.

**Logic**:
1. Calculates the player's age as `seasonYear - birthYear`.
2. Iterates through the categories list (ordered by `displayOrder`).
3. Returns the first category where `minAge <= age` and (no `maxAge` or `age <= maxAge`).
4. If no category matches, returns `"Autre"` (French for "Other").

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `birthDate` | Date | Player's birth date |
| `seasonYear` | number | The start year of the season |
| `categories` | `CategoryDefinition[]` | Array of `{ name, minAge, maxAge }` |

**Returns**: string — the category name (e.g., "U12", "U14", "Senior", or "Autre").

`CategoryDefinition` type:

```typescript
interface CategoryDefinition {
  readonly name: string
  readonly minAge: number
  readonly maxAge: number | null
}
```

---

## Tests

All schemas, utilities, and filters have unit tests:

| Test file | What it covers |
|---|---|
| `schemas/authSchema.test.ts` | Login validation (valid input, missing email, short password) |
| `schemas/playerSchema.test.ts` | Player creation and update validation |
| `schemas/licenseSchema.test.ts` | License creation and batch validation |
| `schemas/seasonSchema.test.ts` | Season creation and update validation |
| `schemas/ocrSchema.test.ts` | OCR extraction result and validation schemas |
| `schemas/spreadsheetPreviewSchema.test.ts` | Cell mapping and spreadsheet preview validation |
| `constants/templatePlaceholders.test.ts` | Placeholder registry completeness and consistency |
| `filters/filterFields.test.ts` | Player and license filter field definitions |
| `utils/computeCategory.test.ts` | Category computation logic (U12, U14, Senior, edge cases, "Autre" fallback) |

---

## How it is consumed

Both apps import from `@hoop/shared`:

```typescript
// In the API
import { createPlayerSchema, computeCategory, allPlaceholders } from '@hoop/shared';

// In the web app
import { type Player, loginSchema, genderLabels } from '@hoop/shared';
```

The package uses TypeScript source directly (no build step). Its `package.json` sets `"main": "./src/index.ts"` and `"exports": { ".": "./src/index.ts" }`. Next.js is configured with `transpilePackages: ['@hoop/shared']` to handle the compilation.
