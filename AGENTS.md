# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the framework source, split by domain (`components/`, `template/`, `signals/`, `routing/`, `state/`, `http/`).
- `web/example/` hosts demo components and usage samples; add small demos here for new features.
- `benchmark/` includes performance pages and scripts for regression checks.
- `docs/` contains supplemental documentation.
- `dist/` is generated build output; do not edit manually.

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: compile TypeScript and build production assets.
- `npm run preview`: serve the production build locally.
- `npm run benchmark`: open the performance benchmark page.
- `npm run benchmark:update`: rebuild and refresh benchmark baselines.

## Coding Style & Naming Conventions
- Indentation: use tabs in TypeScript sources; match existing files in other directories.
- Type-only imports: use `import type` where applicable (`verbatimModuleSyntax` is enabled).
- Component files (when relevant):
  - `component-name.component.ts`
  - `component-name.template.ts`
  - `component-name.styles.ts`
- Keep code examples concise and scoped to the impacted area (e.g., new demos in `web/example/`).

## Testing Guidelines
- No automated test framework is configured yet.
- Validate changes by running the dev server or benchmark flow.
- If behavior needs manual coverage, add a focused example in `web/example/`.

## Commit & Pull Request Guidelines
- Commit messages use short, imperative, capitalized verbs (e.g., "Add effect system to Store").
- Pull requests should include:
  - A clear description of changes and rationale.
  - Linked issues or tickets when applicable.
  - Screenshots or usage notes for UI/behavior changes.

## Architecture & Public API Notes
- Public API exports are centralized in `src/index.ts`; update this file when exposing new modules.
- Keep new modules aligned with existing domain folders to maintain structure.
