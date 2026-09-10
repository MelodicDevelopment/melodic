# Changelog

## 3.1.1 (unreleased)

### @melodicdev/core

- **Fixed lazily loaded and default child routes bypassing their guards.** `loadChildren` was resolved inside the outlet *after* the router had already committed the parent match, so the loaded children were matched and rendered by nested outlets without ever passing through the service's guard/resolver pipeline — a child `canActivate` returning `false` ran zero times and the child rendered anyway. Separately, the matcher stopped at an exact parent match and never descended into a `path: ''` child, so a default child's guards were also skipped. Lazy loading (`loadChildren` and `loadComponent`) now happens inside the navigation pipeline: the router matches, loads, re-matches into the loaded routes, and only then runs every guard and resolver on the complete chain before committing. Default children are part of the match chain. Each lazy loader is invoked once and its promise shared. A failed load fails the navigation (or renders the 404 view on initial load / back-forward). Outlets render `matches[depth]` of the committed chain and no longer re-match the URL themselves.
- **Fixed a slow lazy route overwriting a newer screen** and **outlet route reassignment installing the previous route array.** Outlet renders now carry a generation that is checked after every await and invalidated on destroy; `onPropertyChange` uses the incoming value (the hook fires before the field updates).
- **Rewrote signal scheduling as invalidate-then-execute.** Writes first mark every transitive dependent (computeds dirty, effects queued) and only then run anything. Fixes: effects observing inconsistent intermediate values across diamond dependencies (`[5, 7, 10]` instead of `[5, 10]`); computed reads inside `batch()` returning stale values; the circular-effect guard being bypassed when an effect re-queued itself across flush passes; one throwing subscriber silently dropping every later notification in the batch; and an effect destroyed while queued running anyway and resubscribing. Errors thrown by subscribers/effects are collected, every other callback still runs, and the failure is rethrown to the writer (an `AggregateError` when several threw). `SignalEffect` gained `clearDependencies()` (dependency reset without disposal), a `destroyed` getter and an `onInvalidate` option; `addDependency` now takes the producer rather than relying on `unsubscribe(effect.run)`.
- **Fixed HTTP deduplication merging requests with different response semantics.** The dedup key was `method:url[:bodyHash]`, so two concurrent `GET /me` calls with different `Authorization` headers (or different `params`, `credentials`, `mode`) executed one fetch and both received the first request's response. The identity now includes query params, headers (case-insensitive, order-independent), credentials, mode and the full serialized body — no hash. Completed shared requests also detach every participant's abort listener, so a long-lived caller signal no longer retains settled responses.
- **Template transitions dispose what they replace.** `repeatRaw()` removes the element a factory replaces instead of leaving both in the DOM (and gained an optional `update(element, item, index)` callback that preserves row identity); `repeat()` and `repeatRaw()` work at the root of a template (markers still inside the template fragment); switching a node part from a nested template or bare node to a keyed array clears the prior content; attribute/property directives are disposed when replaced by a plain value, not only by another directive; `when()` removes a previously rendered fallback when the fallback argument is dropped while the condition stays false; `repeat()` items release their creation-time node snapshot and no longer retain the original item object.
- **Resource lifetimes.** A throwing `onDestroy`/`onDisconnect` no longer prevents framework cleanup (disposables are released in `finally`); `observe()` and `onInit` run inside the component's ownership scope, so a `computed` created in `onInit` is disposed with its component instead of surviving it or registering with a constructing parent; singleton *factory* bindings are resolved with no active component, matching class bindings, so a component requesting a factory-provided signal no longer destroys it for everyone on unmount; async validation that settles after a control is destroyed is ignored, and a rejecting async validator records an `asyncValidator` error instead of an unhandled rejection; `bootstrap()` rolls back installed window error handlers and a mounted root when a later step fails, `app.destroy()` is idempotent and releases the global `IMelodicApp` binding (only if it still refers to that app).
- **Bulk form writes are batched.** `FormGroup`/`FormArray` `setValue`, `patchValue`, `reset`, `enable`, `disable` and `markAllAs*` wrap their child writes in `batch()`: one aggregate `value`/`state` notification and one group validation per call, instead of one per child (previously O(N²) aggregate work for an N-field write, and N async group validations).
- **Benchmarks.** The add/remove workload now actually removes 200 rows and adds 200 (it previously sliced back to the original keys, timing a no-op diff), and the benchmark README no longer presents a cross-framework speed ranking that the suite does not measure.
- **Fixed nested conditionals leaving orphaned DOM behind, so a block appeared twice after a toggle.** A node part that rendered a nested `html` template captured the nodes it inserted once, on first render, and its teardown removed only that snapshot. The snapshot went stale as soon as a node part *inside* the rendered template swapped its own content (`${inner ? html`…X…` : html`…Y…`}`): the swap detached nodes the parent's list knew about and inserted new ones it did not. Tearing the parent down (`outer = false`) then removed the stale list and left the swapped-in nodes stranded between the parent's markers, and re-rendering (`outer = true`) placed a fresh copy beside the orphan — two `.x` blocks, one of them dead. The same-key fast path (in-place update of an unchanged nested structure) never refreshed the list either. The three-level "where does it live → create or URL → connected or not" dialog shape hit this every time. Teardown now clears the **live range between the part's `startMarker`/`endMarker`** instead of trusting a snapshot, so nothing a child part inserted can outlive its parent. The workaround of wrapping every conditional branch in a single stable root element is no longer needed.
- **The same stale-snapshot teardown existed in `when()` and in interpolated-array items, and is fixed the same way.** `when()` now clears the live range between its markers when a branch is removed. Keyed and unkeyed (`${items.map(…)}`) array items now get their own `<!--item-start-->`/`<!--item-end-->` marker pair — the pattern `repeat()` already used — and every removal, reorder and in-place rebuild walks that range. Previously an item whose template contained a swapping nested part stranded nodes on removal, on shrink, and when the item's structure or value type changed; a keyed reorder could also move a stale node list. `repeat()` items whose *own* template structure changed had the same gap on the rebuild path (only the original nodes were removed); the shared rebuild helper now replaces the item's whole live range.
- **Teardown ordering is unchanged.** Directive and action cleanups still run (via the recursive container disposal) *before* the DOM is removed, and exactly once per rendered container — the disposal branches (`nestedContainer`, `renderedContainers`, `arrayState`, `positionalArrayState`) are untouched; only the node-removal step moved from "remove the remembered list" to "clear between the markers". Regression tests assert both the single `.x` and the exact cleanup counts across nested-template, `when()`, keyed, unkeyed and `repeat()` variants.

#### Migrating

- **Guards now run for lazily loaded and default (`path: ''`) children.** Apps that relied on those guards silently not running will see navigations blocked; that is the fix. `IRouteContext` gained a `matches` field carrying the committed chain.
- **Signal subscriber errors surface to the writer.** A `set()` whose subscriber throws still throws, as before, but now *after* every other subscriber has run. Several failures arrive as one `AggregateError`.
- **Computed reads inside `batch()` are fresh.** Code that (accidentally) depended on stale computed values within a batch will now see the written values.
- **`FormGroup`/`FormArray` bulk writes emit once.** A `value.subscribe()` callback that counted per-child emissions during `setValue` now fires once per call.
- **HTTP dedup is stricter.** Requests that differ in headers, params, credentials or mode no longer share a fetch. Pass identical configuration if sharing is intended.
- **`SignalEffect.addDependency`** now takes the producer signal and expects it to expose the internal dependents set; only code that hand-built producers (none in the public API) is affected.
- **Interpolated arrays now emit two comment nodes per item** (`<!--item-start-->` … `<!--item-end-->`), as `repeat()` always has. Code that walks `childNodes` around an interpolated array and counts or indexes raw nodes will see the extra comments; `children` and `querySelector*` are unaffected.
- **Internal types tightened.** `ITemplatePart.renderedNodes` and `IArrayItem.nodes` are gone (the live DOM between the markers is the source of truth); `IArrayItem` gained `start`/`end`. Both types are exported for typing only and nothing in the public rendering API changed.

## 3.1.0

### @melodicdev/core

- **Unkeyed arrays now preserve DOM identity across renders (behaviour change — see the migration note below).** A plain `${items.map(item => html`…`)}` binding tore its entire subtree down and rebuilt it on *every* render: only the keyed path diffed and updated in place, and everything else fell through to `clearRenderedNodes` plus a full rebuild. The rendered output was always correct, so nothing ever failed loudly — what was destroyed was node identity, and identity is load-bearing. The browser only fires `click` when `mousedown` and `mouseup` land on the same node, so a list inside a template that re-renders faster than a human click (a signal on an animation-frame clock, a poll, a resize observer) could not be clicked at all: both mouse events fired, no `click` ever did, and the handler never ran. Focus, text selection, scroll position, `:hover`, CSS transitions and `IntersectionObserver`/`ResizeObserver` registrations were lost the same way. Arrays are now reused positionally — same length reuses every node, growth appends, shrinkage disposes and removes the tail, and an index whose value type changed (template ↔ Node ↔ primitive) is rebuilt in place at its own position. Reordering an unkeyed array still moves content between fixed nodes; `repeat(items, keyFn, template)` remains the way to track items by identity, and its LIS reordering is unchanged.
- **Fixed an array item that changed from a primitive/Node to a TemplateResult rendering nothing.** The in-place update path assumed the item's container already held a part tree; when it did not (the item previously held a text node or a bare Node), the new template was rendered into the *detached* container and never reached the DOM, leaving the stale content live. Affected the keyed path too, where it was latent.
- **Primitive array items update their existing text node** instead of replacing it, so text-only arrays no longer churn nodes either.
- **New dev-mode advisories for arrays.** An unkeyed array that actually churns — two or more items rebuilt in a single update, the signature of entries shifting position — logs a one-time advisory naming `repeat(items, keyFn, template)`. Arrays that reuse cleanly are never warned about, since a plain `.map()` is now correct for the common case. Separately, an array that mixes keyed and unkeyed items warns once: keyed diffing requires *every* item to carry a key, so one unkeyed entry silently demoted the whole array to index-based reuse. Both are stripped in production builds like the existing template diagnostics.

#### Migrating

Two consequences are user-visible in existing apps:

- **Custom elements inside unkeyed arrays are no longer recreated every render.** `onCreate`/`onDestroy` (and `connectedCallback`/`disconnectedCallback`) fired on each render before and now fire once. Code that relied on that repetition — re-reading a value in `onCreate`, re-registering something per render — needs to move to `onRender` or a signal. Per-render setup that was accidentally leaking is now correct.
- **Per-node DOM state persists across renders.** Uncontrolled state that used to reset because the node was new each time — a native input's typed value, scroll position, an open `<details>` — now survives. Drive it from the template if it must reset.

### Documentation

- `docs/TEMPLATE_SYSTEM.md` and `MELODIC_FRAMEWORK.md` document interpolated-array reuse semantics, when index-based reuse is not enough (reorder/sort/filter/insert-not-at-end), the new dev advisories, and the 3.1.0 behaviour change.

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
