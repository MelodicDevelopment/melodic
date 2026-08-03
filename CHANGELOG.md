# Changelog

## 3.0.3

### @melodicdev/core

- **Fixed bindings inside attribute values that contain the other quote character.** `title="it's ${x}"` and `title='say "${x}"'` did not parse as attribute bindings: the parser matched an attribute's opening quote with `(["'])([^"']*)$`, so a value containing the opposite quote failed to match and fell through to the text-position branch. That injected a comment marker *inside* the attribute value, which leaked into the DOM as literal text (`title="it's &lt;!--m8f3k2p--&gt;"`) and left the binding permanently stale. Each quote style is now matched only against its own delimiter. Apostrophes in `title`/`placeholder`/`aria-label` values are common enough that this was likely hitting real apps silently.
- **New dev-mode diagnostic for leaked template part markers.** After parsing a template, any interpolation that could not be anchored to a node is reported by selector-free template snippet — the signature of a malformed template, most often an unbalanced quote in an attribute value, which makes the HTML parser swallow the following markup (and its markers) into the attribute. Previously this failed silently and could surface far from the mistake, e.g. as a stray marker in an attribute *name* on an unrelated element. Runs once per template on the parse path only (templates are cached), so update renders are unaffected; never throws, and stays quiet in production builds. Joins the existing unsupported-binding-position warnings and defers to them when both would fire.

### Documentation

- **Removed a documented-but-nonexistent global styles API.** `docs/COMPONENT_SYSTEM.md` and `README.md` described `registerGlobalStyles()` and `setGlobalStylesAttribute()`, including a "shared source of truth" config pattern built on the latter. Neither symbol has ever existed. The real API is `applyGlobalStyles(root)`, driven by the fixed `melodic-styles` attribute on a `<style>`/`<link>` tag and called automatically by `ComponentBase`. Docs now describe what ships, and note two previously undocumented constraints: `<link melodic-styles>` sheets are read through the CSSOM so they must be same-origin, and the tags are collected once on first adoption, so they must be present before the first component renders.
- **`styleMap` numeric values.** Documented in `MELODIC_FRAMEWORK.md` and `docs/TEMPLATE_SYSTEM.md` that values are emitted as-is and lengths need explicit units — `styleMap({ left: 42 })` produces invalid CSS that the browser drops silently. Unlike React's style object, no `px` is appended. This matches lit-html and is unchanged behaviour; only the docs were missing.

## 3.0.2

### @melodicdev/core

- **Fixed the second (previously masked) no-build CDN failure:** `getEnvironment()` read `import.meta.env.VITE_ENV` unguarded at module load, throwing `Cannot read properties of undefined (reading 'VITE_ENV')` in plain browsers where no bundler defines `import.meta.env`. Now guarded (same pattern as the template dev-mode checks — Vite still statically replaces the member expressions); without a bundler the environment falls back to `'dev'`. Found by the 3.0.1 CDN smoke check — 3.0.1 fixed the esm.sh module graph, which unmasked this load-time crash, so bare `https://esm.sh/@melodicdev/core` first fully works at 3.0.2.

## 3.0.1

### @melodicdev/core

- **Fixed bare esm.sh CDN loading.** `https://esm.sh/@melodicdev/core` (import-map, no-build usage) threw `The requested module './injection.mjs' does not provide an export named 'Injectable'` before any user code ran. esm.sh rebuilds each `exports`-map entry into a standalone module, and its rebuild of runtime `export *` barrel chains silently dropped names, serving a self-inconsistent module graph (the npm package itself was fine — bundlers, Node, and the prebuilt `bundle/` were unaffected). Every entry barrel (`.` and all subpaths) now uses explicit named re-exports for runtime values (`export type *` for types, which emits nothing); the public API surface is unchanged, verified export-for-export against 3.0.0.
- New `npm run smoke:cdn -- <version>` release check (`scripts/cdn-smoke-check.mjs`): boots the documented esm.sh import-map pattern in headless Chrome against the exact published version and fails on any module-graph or console error. Run it after every publish — this failure class only exists at the CDN. A unit test additionally pins the no-runtime-`export *` invariant on entry barrels.

## 3.0.0

Whole-repo remediation release driven by the 2026 full-repo review: correctness bugs, memory leaks, security hardening, accessibility, API consistency, and structural debt. Breaking changes are covered in [MIGRATION.md](./MIGRATION.md).

### @melodicdev/core

- **Signals:** `SignalEffect` is exception-safe (a throwing effect no longer corrupts global tracking state); `computed()` is now lazy (recomputes on read, not on every source change) and read-only — `.set()`/`.update()` throw; new `ReadonlySignal<T>` type.
- **Template engine:** recursive part disposal — directive/event cleanups now run for content removed by `when`, `repeat`, and nested templates (fixes subscription/listener leaks, e.g. `:formControl` inside a toggled `when`); `when` re-renders correctly when the branch template's structure changes; switching a binding between directive types no longer passes stale state; composite-attribute change detection fixed; typed part tree replaces `any`-based internals; one stable event listener per part (supports `{handleEvent, ...options}` values); template cache is LRU; dev-mode warnings for `.innerHTML`/`.outerHTML` property bindings and unsupported binding positions.
- **Components:** attributes coerce by declared type — numbers now coerce (`offset="12"`), booleans coerce correctly for initially-undefined props, and `static propertyTypes` lets components declare types explicitly; reflection no longer drops values for initially-undefined props; equal values skip re-render; reassigning a signal/form-control field re-subscribes cleanly; per-class constructed stylesheets replace per-instance `<style>` elements; `@MelodicComponent` validates custom-element selectors.
- **Routing:** the full match→guards→resolvers→commit pipeline runs in `RouterService` (guards no longer run twice; popstate now enforces guards and runs resolvers); new `provideRouter()`; history patching is idempotent and happens at router init, not module import; `:param` no longer matches empty segments; params URL-encode; query strings merge; sibling routes are backtracked after failed child matches; `javascript:` URLs are rejected by router links; modifier/middle clicks behave natively; router-link element and `:routerLink` directive share one core.
- **HTTP:** response interceptors run exactly once across retries and deduped requests; error-interceptor throws propagate (domain-error mapping works); `onProgress` no longer turns text responses into Blobs; `AbortSignal.timeout()`-based timeouts; `IRequestConfig.signal` (`abortController` deprecated); deduped requests ref-count cancellation.
- **State:** keyless dispatch applies every matching slice (indexed by action type, batched) and fires effect-only slices; effect errors are caught; `select()` caches by function identity.
- **Config:** environment overrides deep-merge like `extends`; `deepMerge` guards against prototype pollution.
- **DI:** `@Inject` metadata no longer shared across the inheritance chain; `@Service` caches falsy resolutions.
- **Barrel:** forms are exported from the root `@melodicdev/core` entry.

### @melodicdev/components

- **Overlays:** `DialogRef.afterClosed` fires on Escape/backdrop dismiss; `afterOpened`/`afterClosed` accumulate callbacks; `DialogService` warns instead of throwing for unknown ids and no longer leaks listeners; dialog and popover emit `ml:open`/`ml:close`; drawer adds `ml:opened`/`ml:closed` and tokenized animation timing; popover traps focus; dropdown/date-picker no longer steal focus on pointer light-dismiss; shared `OverlayPositioner`/toggle-dismiss guard across popover, dropdown, select, autocomplete, date-picker; `:tooltip` directive redesigned (no reparenting, dynamic content updates, proper cleanup).
- **Positioning utils:** `shift()` axes gate independently (mainAxis clamp off by default); `flip()` preserves `offset()`; `autoUpdate` runs an initial update; middleware data merges across middleware; `clickOutside` works across shadow boundaries; `focusTrap` works inside shadow DOM.
- **Data display:** shared `TableCore` behind `ml-table`/`ml-data-grid`; table selection resets when rows change; `ml:select` emits row objects + original-order indices; avatar image-error fallback works; calendar-view uses one local-time basis; data-grid clamps its page when rows shrink and column-resize no longer triggers sort.
- **Forms:** autocomplete async race fixed (stale results ignored); select/autocomplete follow scroll/resize while open and implement the WAI-ARIA combobox pattern; radio group has roving-tabindex arrow navigation and emits a single `ml:change`; form-field re-syncs ARIA on every render; `ml-button` submits/resets real forms and drops its redundant host role; checkbox/toggle/button-group support `error`; date-picker uses a text input (single picker); slider fill derives from the thumb-size token; `ml-file-upload` binds to `:formControl`.
- **A11y:** progress exposes `role="progressbar"` on all shapes with clamped values; tooltips show on keyboard focus, dismiss on Escape, and wire `aria-describedby`; tabs/steps keep focus through selection changes and slotted-mode arrows move focus; interactive list items are keyboard-operable; `announce()` queues messages; icon ligatures are `aria-hidden`.
- **Consistency:** dismissal standardized on `ml:dismiss` (tag's `ml:close`, file-upload's `ml:remove` deprecated); internal coordination events no longer leak past their parent; reserved `title` attributes migrated to prefixed names (`alert-title`, `toast-title`, `hero-title`, `header-title`, `section-title`, `page-title`) with deprecation shims; `error` is the canonical status variant (`danger` deprecated alias); per-component size types match implemented styles; kebab-case attributes (`dot-color`, `avatar-src`, `sidebar-collapsed`, …) now actually reach their properties; slot presence is reactive across card, list-item, activity-feed-item, page-header, page-section, divider, and the page components.
- **Theme:** `createTheme`/`injectTheme` validate names and values (CSS-injection guard); `createBrandTheme` supports `mode: 'dark'`.

### @melodicdev/cli

- **Security:** generate/add names are validated (`^[a-z][a-z0-9-]*$` after kebab-casing; path separators and `..` rejected in names and `--path`); hyphen-less component names auto-prefix `app-`.
- **Monorepo scaffolding rebuilt:** libs are npm workspace packages (`@<repo>/<name>`) with `exports` maps — tsconfig and Vite resolve identically; fresh `init --monorepo` builds out of the box; `add app`/`add lib` require a workspaces root and stay consistent with the seeded app (`monorepo-app` template).
- **Generators:** components generate the directory + barrel structure; v2-correct interceptor template; new `generate guard`/`generate resolver`; `--dry-run`/`--force`; atomic generation with prechecks; JSONC-tolerant tsconfig edits; strict `util.parseArgs` argument handling.
- **Templates:** dependencies pinned (`@melodicdev/core` `^2.0.0` until 3.0.0 is published — bump on release; current Vite); `@types/node` added; starter-app `repeat` keys by id; dead `templates/basic` removed; README rewritten.
- **Tests:** new vitest suite (40 tests) covering generated trees, validation, and scaffold invariants.

### Infrastructure

- GitHub Actions CI: per-package typecheck/test/build plus a scaffold smoke test (`melodic init` → `npm run build` for basic and monorepo projects).
- `engines: { node: ">=20.19.0" }` on all published packages. `@melodicdev/components`' `@melodicdev/core` peer range and the CLI templates' pin are `^3.0.0` (components 3.0 runtime-requires core 3.0's `propertyTypes` support); locally the peer resolves to the workspace root via a `file:../..` devDependency, so installs work before core 3.0.0 is on the registry. **Publish order:** core first, then components/CLI. `sideEffects: false` was evaluated and deliberately NOT set — importing component modules registers custom elements (inherently side-effectful).

## 2.0.3

### @melodicdev/components

- Fixed table row divider collapsing layout on hover.

## 2.0.2

### @melodicdev/core

- Restored host exposure of public computed getters.

### @melodicdev/components

- Version aligned with the core getter-exposure fix.

## 2.0.1

### @melodicdev/core

- Fixed overly-strict `HttpClient` request body type.

### @melodicdev/components

- Fixed `DialogService` dropping registration on inline dialog re-render.

## 2.0.0

Major hardening release across the core framework and component library.

### @melodicdev/core

- **Signals & template:** hardened the template engine; added the `batch()` primitive for glitch-free, de-duplicated updates; signals now throw on access after destruction to surface lifetime bugs.
- **Component lifecycle:** added `onConnect`/`onDisconnect` hooks; teardown is deferred so re-parenting an element preserves its state (only permanent removal runs `onDestroy`).
- **Dependency injection:** more robust resolution; services are now constructed with no active component, so signals a service creates are owned by the service rather than destroyed when a transient consumer unmounts.
- **Routing:** correctness fixes for catch-all routes, params, query strings, guard chains, and navigation races.
- **Forms:** standard, Angular-aligned reactive-forms semantics on a single `AbstractControl` base (`FormControl`, `FormGroup`, `FormArray`).
- **HTTP & state:** hardened the HTTP client and state effects; defined `ComponentStateBaseService.select()` ownership semantics.

### @melodicdev/components

- Fixes across table, data-grid (incl. virtual scrolling), radio-group, radio-card-group, dropdown, popover, and tooltip.
- Theme system fixes (`applyTheme`, `createTheme`, dark preset).

### @melodicdev/cli

- Version aligned to 2.0.0 for release continuity. Templates target `@melodicdev/core` 2.0.

See [MIGRATION.md](./MIGRATION.md) for upgrade guidance.

## 1.0.0

- @melodicdev/core: First stable release of the Melodic framework.
- @melodicdev/cli: First stable release of the Melodic CLI with scaffolding and generators.
