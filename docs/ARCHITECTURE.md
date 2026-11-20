# Baseline architecture (Phase 0 audit)

Audited before any TRON / Graph / Academy changes. Checkpoint: git tag `checkpoint-pre-tron`.

## Stack
- React 18 + Vite 5 (plain JS/JSX, no router, no TypeScript, no test runner).
- Only runtime deps: `react`, `react-dom`. Dev deps: `vite`, `@vitejs/plugin-react`.
- No database, no auth. Backend = one Vite middleware plugin (`scripts/scraper.mjs`).

## Data
- `data/data.csv` (open hackerone-reports dataset) -> `scripts/build-data.mjs` -> `public/reports.json` (static, ~1.3 MB).
- `src/data.js` loads that JSON and derives classes, programs, stats.
- Report row layout: `[id, programIdx, weaknessIdx, classIdx, upvotes, bounty, title, guessedFlag]`.

## API (contract must not change)
- `GET /api/report/:id` (dev + preview server only) -> trimmed HackerOne report JSON, cached in memory.

## Routes
- Single page, hash anchors only: `#top #map #programs #search #modules #about`.

## Components (src/components)
Header (nav + Access panel), Hero, ClassMap, Programs, Search, ReportModal, Sections (Modules/About/Footer), Starfield.

## Settings
- `hooks.js` `useSettings`: motion / contrast / text size in localStorage key `hexbrain-nexus-settings`, mirrored to `<html data-*>`.

## Baseline behaviour to preserve
- 15,219 reports, 428 programs, 215 weaknesses, 18 classes + Other.
- Class -> weakness -> search jump; program -> search jump; filters; 30-per-page load more; click report -> scraper modal.

## Tests
- None existed. Verification so far: `vite build` + manual endpoint checks.
