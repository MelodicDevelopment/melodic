# Repository Guidelines

`CLAUDE.md` is the full reference for this repository (module map, import paths, component
conventions). This file is the short version for any coding agent.

Working in a project that **uses** Melodic rather than on Melodic itself? Read
`USING_MELODIC.md` instead: it is the guide to building with the framework and the
component library.

## Project Structure

npm workspaces monorepo publishing three packages:

| Path | Package | What it is |
|---|---|---|
| `src/` (repo root) | `@melodicdev/core` | Framework: `components/`, `template/`, `signals/`, `routing/`, `forms/`, `http/`, `injection/`, `state/`, `config/`, `bootstrap/`, `testing/`, `devtools/` |
| `packages/melodic-components/` | `@melodicdev/components` | UI component library (`ml-*` elements, theme tokens) |
| `packages/cli/` | `@melodicdev/cli` | `melodic` scaffolding and code generation, plus `templates/` |

Other directories:

- `tests/unit/` — core tests. `packages/*/tests/` — package tests.
- `web/example/` — framework example app. `web/demo/` — component library demo. `web/benchmark/` — interactive benchmark page.
- `scripts/` — headless-Chrome smoke checks, build helpers (`clean.mjs`, `check-bundle-size.mjs`, `lib/vite-build-plugins.mjs`).
- `docs/` — core docs. `packages/melodic-components/docs/` — component docs.
- Build output: `lib/`, `packages/*/lib`, `packages/cli/dist`, `dist/` are generated and git-ignored. `bundle/` and `packages/melodic-components/assets/*.js|css` are generated **and committed** (they are published and served from CDNs) — rebuild them for a release, never edit them by hand.

## Commands

```bash
npm run dev                # example app (Vite dev server)
npm run demo               # component demo
npm run test:unit          # core tests (Vitest + happy-dom)
npm run test:components    # component library tests
npm run test:cli           # CLI tests
npm run test:all           # all three
npm run lint               # ESLint (has a known backlog; non-blocking in CI)
npx tsc --noEmit           # typecheck
npm run build              # typecheck + build the example app
npm run build:lib          # core -> lib/ (cleans lib/ first)
npm run build:bundle       # core CDN bundle -> bundle/
npm run build:components   # components -> lib/ + assets/
npm run build:cli          # CLI -> packages/cli/dist
npm run smoke:apps         # build example + demo, drive both in headless Chrome
npm run smoke:bundle       # boot both CDN bundles in headless Chrome
npm run size               # fail if a .min.js bundle is not really minified
npm run benchmark          # open the benchmark page
npm run benchmark:update   # rebuild the bundle and record its size
```

## Testing

- Vitest with happy-dom. Core: `tests/unit/**/*.test.ts`. Components: `packages/melodic-components/tests/**/*.test.ts`. CLI: `packages/cli/tests/**/*.test.ts` (Node environment).
- Use `@melodicdev/core/testing` (`mount`, `flush`, `query`, `text`, `unmountAll`) rather than hand-rolled microtask flushing — renders and teardown are both deferred. See `docs/TESTING.md`.
- A bug fix comes with a test that fails without it.
- happy-dom is not a browser. For anything involving layout, the Popover API, focus or real event dispatch, also run `npm run smoke:apps`.
- Coverage: `npm run test:coverage` (requires `@vitest/coverage-v8`).

## Coding Style

- Tabs for indentation; Prettier config in `.prettierrc` (single quotes, 160 columns, no trailing commas).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- TypeScript uses legacy decorators: `experimentalDecorators: true`, `useDefineForClassFields: false`. Do not change either.
- Private class fields are prefixed `_` (which also excludes them from component reactivity).
- Component files: `name.component.ts`, `name.template.ts`, `name.styles.ts`, optional `name.types.ts`, and an `index.ts` barrel.
- Component styles read tokens as `var(--ml-x, default)` and never declare a rule-read token on `:host` (enforced by `tests/components/token-inheritance.test.ts`).
- Standards live in `docs/CODING_PRACTICES.md`; ESLint config in `tools/standards/`.

## Commits and Pull Requests

- Short, imperative, capitalized subject ("Add effect system to Store").
- Do not commit unless asked. Do not add co-author trailers.
- Do not bump versions or edit `CHANGELOG.md` as part of a fix unless asked; releases do both together.
- A PR description says what changed and why, and how it was verified.

## Public API

- Core entry points are the `exports` map in `package.json` (`.`, `./signals`, `./template`, …), each backed by an `index.ts` barrel under `src/`. `docs/API_SURFACE.md` lists every export; update it when the surface changes.
- Adding a component: follow "Adding a New Component Checklist" in `CLAUDE.md` (package export, tsconfig path, Vite alias, demo entry).
