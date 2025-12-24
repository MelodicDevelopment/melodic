# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the framework source code, split by domain (`components/`, `template/`, `signals/`, `routing/`, `state/`, `http/`).
- `example/` contains demo components and usage samples.
- `benchmark/` includes performance test pages and scripts.
- `docs/` hosts supplemental documentation.
- `dist/` is the build output (generated).

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: compile TypeScript and build production assets.
- `npm run preview`: serve the production build locally.
- `npm run benchmark`: open the performance benchmark page.
- `npm run benchmark:update`: rebuild and refresh benchmark baselines.

## Coding Style & Naming Conventions
- Indentation: tabs are used in TypeScript sources; keep new files consistent.
- Type-only imports: use `import type` where applicable (`tsconfig` uses `verbatimModuleSyntax`).
- Component file pattern (when applicable):
  - `component-name.component.ts`
  - `component-name.template.ts`
  - `component-name.styles.ts`

## Testing Guidelines
- No automated test framework is configured yet; validate changes via manual usage or the benchmark flow.
- Keep new code easy to exercise in `example/` or add focused demo entries when needed.

## Commit & Pull Request Guidelines
- Commit messages follow a short, imperative style with capitalized verbs (e.g., "Add effect system to Store").
- PRs should include: a clear description, linked issues (if any), and screenshots or usage notes for UI/behavior changes.

## Architecture & References
- Public API exports are centralized in `src/index.ts`; update it when exposing new modules.
- This repo does not rely on assistant-specific guidance files; treat them as optional or out-of-scope if present.
