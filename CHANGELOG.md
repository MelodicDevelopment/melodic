# Changelog

## 4.0.1

### @melodicdev/core

- **`store.select(key, fn, cacheKey)` read during a render no longer trips the
  computed-in-render warning.** The warning tells you to use exactly that call, but the
  select cache creates its computed through `computed()` on the first render, so following
  the advice still warned once per component. Computeds created through the per-component
  select cache are keyed and swept, which is what the warning guards against, so they are
  exempt. A bare `computed()` in a render still warns.

### @melodicdev/components

- **Component tokens now inherit from any ancestor.** Every component declared its
  `--ml-{component}-*` defaults on its own `:host`, and a declaration on the element beats
  an inherited value, so a wrapping custom element that set `--ml-button-font-weight` on
  *its* `:host` had no effect — only a rule targeting the element (`ml-button { … }`)
  worked. Rules now read each token with its default as the `var()` fallback
  (`font-weight: var(--ml-button-font-weight, var(--ml-font-semibold))`) and the `:host`
  token block is gone from every component, so both paths work. Variant and size
  modifiers still reassign tokens on the inner element, as before, and the three tokens the
  drawer and app-shell JavaScript reads stay on `:host`. The token list for each component
  now lives in a comment at the top of its styles file, and `MELODIC_COMPONENTS.md` gained
  a "Restyling from a wrapper" section covering both override paths. A convention test
  fails if a rule-read token is declared on `:host` again.

## 4.0.0

A large review-driven pass across the framework and the component library. It fixes ~90
findings, adds render-time signal tracking, and introduces `@melodicdev/core/testing` and
`@melodicdev/core/devtools`. It is a major release because several behaviours deliberately
changed — see [Migrating](#migrating-to-400) at the end of this entry.

### @melodicdev/core

#### Reactivity

- **Templates now track every signal they read.** The template body runs inside a
  `SignalEffect` whose invalidation schedules the next render, so a template reading
  `this.auth.user()` from an injected service, a signal nested inside an object or array,
  or a computed from anywhere re-renders like any other reactive source. Previously only
  component *fields* whose value happened to be a `Signal` were subscribed and everything
  else silently never updated — the single largest usability gap in the framework.
  Lifecycle hooks are deliberately not tracked: reads in `onInit`/`onCreate`/`onRender`
  belong to your code, not to the render.
- **Components render once on mount, not twice.** Initial attribute writes and `.prop=`
  bindings scheduled a render before connect, and `connectedCallback` then rendered
  synchronously, so the queued microtask rendered again. A `_dirty` flag makes the
  microtask skip when a render already happened. A three-item `repeat()` rendered six item
  templates before this.
- **Render loops are detected and stopped.** A property written from `onRender` re-rendered
  through microtasks forever, with no error and no stack overflow — just a wedged tab. A
  component that renders 25 times in one macrotask is now stopped and reported.
- **New `effect()`**, with immediate first run, cleanup functions, `{ name }` and
  `{ manual }` options, and automatic disposal with its owning component.
- **New `untracked()`** to read signals without subscribing the surrounding effect,
  computed or render.
- **`SignalEffect.run()` executes its first run synchronously**, even inside a batch or a
  flush. Deferring it meant code immediately after `effect.run()` observed an effect that
  had not run yet, which made a predictable `effect()` helper impossible to build.
- `signal()`, `computed()` and `SignalEffect` accept an optional `{ name }`, used in
  destroyed-signal and circular-effect messages and in DevTools.
- **`computed()` created during a render warns in dev.** A new one is created on every
  render and each lives until the component unmounts (21 live computeds after 20 updates).
- **A field named like a native `HTMLElement` property** (`hidden`, `title`, `id`, `slot`,
  `dir`, `tabIndex`, …) is no longer mirrored onto the element, and warns in dev.
  `el.setAttribute('hidden', '')` used to leave `el.hidden === false`.
- **An element re-attached after teardown is no longer a zombie.** Teardown now clears the
  root's `__parts`/`__templateKey`, so a reconnect re-initialises instead of taking the
  unchanged-template fast path with handlers that never re-attach.

#### Templates

- **Text after `word=` is no longer parsed as an attribute binding.** The parser tracks
  whether the cursor sits inside an open tag (quote-aware), so `` html`<p>Total=${n}</p>` ``
  renders the value instead of a leaked marker — silently, in production.
- **Quoted special bindings no longer emit a stray quote attribute.** `@click="${h}"`,
  `.value="${v}"` and `?disabled="${b}"` kept the closing quote, and browsers created an
  attribute literally named `"`.
- **A directive inside a composite attribute keeps the other segments.**
  `class="card ${classMap({active})}"` rendered `class="active"`; it now renders
  `class="card active"`. Static segments are written first, then each directive segment
  runs against the element with its own state.
- **Duplicate keys no longer orphan DOM.** `repeat()` and keyed interpolated arrays track
  old items in per-key queues, so a shadowed item is either reused or removed — never left
  stranded — and dev mode warns.
- **New `live()` directive** for user-editable properties: `.value=${live(text)}` compares
  against the element's current value, so resetting the model to the value it already held
  actually clears what the user typed.
- `repeat()` calls `keyFn` once per item per render (it was two or three times), and no
  longer allocates an unused key→index map.
- `getAttributeValues()` is only built when a template declares the parameter.

#### Routing

- **A guard redirect no longer skips the redirect target's guards.** A guard returning a
  path triggered `navigate(target, { skipGuards: true })`, so a guard that redirected into
  a protected route opened it.
- **Redirect chains are bounded** at 10 hops and report the chain. `{a → /b, b → /a}` (or a
  route redirecting to itself) previously recursed through microtasks until the heap died.
- **A deactivation guard is asked once per navigation**, not once per redirect hop.
- **Guard redirects no longer inherit the caller's `queryParams` or `data`**
  (`/login?tab=users`).
- **`redirectTo` substitutes params**, so `{ path: 'u/:id', redirectTo: '/users/:id' }`
  works. A parametrised `redirectTo` previously never matched at all.
- **Query params are inserted before the fragment** — `/docs?q=1#intro`, not
  `/docs#intro?q=1`, where the query is part of the fragment and `location.search` is empty.
- **Repeat navigation to the current URL is ignored by default** (new `onSameUrlNavigation`
  option) instead of pushing a duplicate history entry and re-running resolvers. A
  hash-only popstate no longer re-runs the whole pipeline.
- **A blocked back/forward steps back by the right delta.** The router stamps a history
  index onto `history.state` and uses `history.go(delta)`; a `replaceState` over the entry
  the browser had already moved to turned `[A,B,C]` into `[A,C,C]`.
- **Scroll restoration across back/forward**, and hash scrolling that searches shadow roots
  — `getElementById` never sees an anchor inside a routed component's shadow DOM, which is
  where essentially all Melodic content lives.
- **New reactive route state**: `router.params`, `router.queryParams`, `router.resolvedData`
  and `router.events` are signals. Reading `params()` in a template is the supported way to
  react to `/users/1 → /users/2`, where the component stays mounted and `onCreate` does not
  run again; a component may also implement `onRouteChange`. The outlet re-renders the leaf
  on a param change either way.
- **`router.events`** emits `start` / `redirect` / `blocked` / `error` / `superseded` /
  `end`, so a progress bar or a resolver-failure toast can finally be built.
- **Sibling outlets are no longer mistaken for a parent.** Two outlets in one shadow root
  made the second a "child" of the first and rendered it at the wrong depth.
- **A matched route with no component clears the previous view** instead of leaving the old
  page on screen under the new URL.
- Route matchers are cached per route (they were rebuilt for every route on every match,
  several matches per navigation), and the resolvers of one route run concurrently.
- `router.getParams<'users/:id'>()` infers the param names from the path string.
- `provideRouter(routes, options)` is documented, and the example app uses it.

#### Forms

- **Disabled controls no longer make a form invalid.** `value()` excluded them but `invalid`
  did not, so a disabled `required` field blocked submit forever on a field the user could
  not reach.
- **`updateOn` now governs when the VIEW writes to the model.** Previously the
  `:formControl` directive wrote on every keystroke regardless, and only *validation*
  timing changed. A programmatic `setValue` always validates. Aggregates honour their own
  `updateOn`.
- **`createValidator` attaches its default message to the validator** instead of
  overwriting the global registry; pass `{ global: true }` for the old behaviour. Message
  resolution is now per-control → parent chain → producing validator → global → code.
- **Built-in validators accept nullable input**, so they type-check on
  `FormControl<string | null>`.
- **New `:model` directive** for two-way binding a signal to any adapter-backed control.

#### HTTP, state, DI, bootstrap, config

- **A non-JSON body under a JSON content-type keeps its status.** A 502 HTML error page
  became a `NetworkError`, so retry and auth interceptors keyed on `HttpError` never fired.
- **Keyed `dispatch(key, action)` applies every matching reducer** in that slice, as the
  key-less form always did; it used to take only the first.
- **New `store.snapshot()` / `snapshotSlice()`** for untracked reads outside a component,
  where `select()` leaked one live computed per call (100 guard invocations left 100
  dependents attached to the state signal).
- **`@Service` fields are writable**, so a test can assign a fake without a container. New
  `inject()` / `injectOptional()` derive the type from the token — unlike
  `@Service(HttpClient) http!: Logger`, which compiles. New `Injector.entries()`, and a dev
  warning when a token whose singleton was already resolved is re-bound.
- **`IMelodicApp.http` is populated**, and `IMelodicApp` is bound **before** `onReady` runs
  so startup work can resolve it. A throwing `onReady` releases the binding.
- **`RouterService` resolves `RouteContextService` through the injector**, so
  `Injector.get(RouteContextService)` is no longer a different, empty instance.
- **`getEnvironment()` respects Vite's `MODE`** — `vite build --mode qa` resolves to `'qa'`
  instead of falling through to `'prod'` and quietly using production configuration.

#### Developer experience

- **One dev-mode switch.** `src/devtools/dev-mode.ts` is the single source: template
  diagnostics, dev warnings and the DevTools hook all consult it, and
  `bootstrap({ devMode })` sets it. Left unset it follows the build, with a localhost
  fallback so no-bundler/CDN consumers get diagnostics too. `bundle/melodic-core.js` is now
  built with `import.meta.env.DEV` defined **true**, so a CDN consumer can choose a build
  that warns.
- **New entry point `@melodicdev/core/testing`** — `mount`, `flush`, `query`, `queryAll`,
  `text`, `captureEvents`, `unmountAll`. See `docs/TESTING.md`.
- **New entry point `@melodicdev/core/devtools`** — the dev-mode switch, an in-page
  `window.__MELODIC_DEVTOOLS_HOOK__` (inert until something subscribes) and a
  `window.melodic` console API: `components()`, `instances()`, `inspect($0)`, `bindings()`,
  `trace()`.
- **New `emit(host, name, detail)`** with the `composed`/`bubbles` defaults a component
  actually wants — without `composed`, an event stops at the shadow boundary and the
  consumer never sees it.
- **`attributes` may be a typed map**: `attributes: { open: 'boolean', offset: 'number' }`.
  Dev mode warns about an attribute name containing an uppercase letter (it can never fire)
  and about one pointed at a method.
- `@MelodicComponent` warns when a second class registers under an existing selector, and
  every registration is recorded for tooling (`getComponentDefinitions()`).
- **Global styles survive a rejected or cross-origin stylesheet** instead of producing one
  unhandled rejection per constructed component; new `refreshGlobalStyles()` adopts sheets
  added later.
- New `docs/API_SURFACE.md` documents every export, grouped application / extension /
  internal — no name you can import is undocumented any more.

### @melodicdev/components

#### Programmatic state

- **`ml-button-group`, `ml-tabs` and `ml-steps` sync their slotted children from
  `onRender`.** Slotted children are light DOM, so the component's own re-render never
  touched them: a programmatic `value`/`active`/`variant` write — including one from a
  `:formControl` binding, `setValue` or `reset` — was ignored entirely.
- `ml-button-group` reads an item's `value` **property** before its attribute, so
  property-bound items are seen.
- **`ml-step` observes `href`**, so routed slotted steps navigate as documented.
- `ml-calendar-view`'s mini-calendar month state is reactive, so prev/next actually move it.
- `ml-calendar` navigates on a property write, not only an attribute write.
- Tabs and steps route matching prefers the **longest** matching `href`, so `/admin` no
  longer shadows `/admin/users`.
- `routed` can be toggled after mount without leaking or losing the navigation listener.

#### Accessibility

- **`ml-form-field`** describes and labels its slotted control across the shadow boundary
  (`ariaDescribedByElements`, with an `aria-description` fallback); an IDREF into a shadow
  root resolves to nothing. Clicking the label focuses the control, and `disabled` is
  cleared as well as set.
- **`ml-tooltip`** (and the tooltip directive) describe the trigger with the content
  *element* — the tooltip was wired to look right in the DOM and was never announced.
- **`ml-dropdown`** puts `aria-haspopup`/`aria-expanded`/`aria-activedescendant` on the
  trigger's focusable control rather than on the `ml-button` host.
- **`ml-input` / `ml-textarea`** give their inner control an accessible name when there is
  no visible label (an `aria-label` on the host named the custom element, not the input).
- **Table and data-grid headers are keyboard operable**: Enter/Space sorts, Ctrl/Cmd+Arrow
  reorders a grid column. Both were mouse-only.
- **Roving tabindex** for calendar days/months/years and for radio cards — a group is one
  tab stop, not thirty — with arrow-key navigation on radio cards.
- **`ml-calendar-view`** day cells and event pills are focusable, labelled and activate on
  Enter/Space; arrow keys move between days.
- Steps activate on Enter/Space, not clicks only.
- `ml-app-shell`'s mobile drawer closes on Escape, carries `aria-expanded`/`aria-controls`,
  and moves focus into the drawer and back to the menu button.
- The toast container is an `aria-live` region, and only `error` toasts use `role="alert"`.
- New cross-root ARIA utilities: `setCrossRootDescription`, `setCrossRootLabel`,
  `setCrossRootActiveDescendant`, `getFocusableControl`.

#### Behaviour

- **`ml-select` / `ml-autocomplete` only claim Escape while open**, so an enclosing dialog
  or drawer can still be dismissed with focus in the field.
- `ml-select` commits the focused option when Enter is pressed from the search input
  (multiple mode keeps focus there, so Enter could select nothing at all).
- **`DialogRef.afterOpened`/`afterClosed` return an unsubscribe function.** They remain
  persistent — one registration fires on every open/close cycle — so the leak an inline
  `<ml-dialog>` could produce (it reuses its ref, so registering a fresh closure before
  each open leaves every previous one attached) is now releasable. Dev mode warns when
  callbacks pile up on one dialog.
- **`ml-toast` clears its auto-dismiss timer on destroy.**
- **`ToastService` returns a handle**, gained `dismissAll()` and `setMaxVisible()`.
- `ml-popover` manual mode closes on Escape instead of trapping focus with no exit.
- `ml-autocomplete` observes `toggle` (so a popover the platform hides no longer leaves it
  stuck open) and turns a rejected `searchFn` into an `ml:search-error` event instead of an
  unhandled rejection with a spinner running forever.
- `ml-time-picker` only returns focus when focus was still inside it, and its steppers and
  Now button respect `min`/`max`.
- `ml-file-upload` counts `maxFiles` across the whole selection, and both change paths
  report `detail.files` as the full selection.
- `ml-pagination` clamps the active page into the rendered range, so a page beyond the range
  no longer leaves nothing marked `aria-current`.
- `ml-sidebar` notices content slotted after mount.
- **`toggleTheme()` adopts the document's existing `data-theme`**, so it is no longer a
  no-op after an inline anti-FOUC script.

#### Performance

- `ml-table` and `ml-data-grid` memoize their filter/sort/page pipeline, which the virtual
  scroller called on **every scroll event** and four to six times per render.
- The data grid no longer forces layout on every render, and a column resize drives its
  width through a CSS custom property instead of re-rendering every row on each
  `pointermove`.
- Select and autocomplete option keys no longer embed selection state, so toggling an option
  stops destroying and rebuilding its DOM.
- Steps' status lookup is O(n) rather than O(n²).

#### Styling and localization

- **`ml-calendar-view` and `ml-date-picker` take a `locale`** (defaulting to the document's
  `lang`). Month and weekday names come from `Intl` instead of hardcoded English arrays, and
  the date format from the locale instead of a hardcoded `MM/DD/YYYY`.
- Tab and step panels use `hidden` rather than an inline `display`, so consumers can style
  them.
- `ml-stack` and `ml-container` drive layout through component-scoped custom properties
  instead of inline styles that no stylesheet rule could override.
- `ml-app-shell` implements `sidebar-collapsed` (it had zero CSS rules) and shares its
  breakpoint between CSS and JS through `--ml-app-shell-mobile-breakpoint`.
- Alert, progress, pagination and tab-panel declare the custom properties their rules
  reference; pagination gained a `:focus-visible` ring.
- Sidebar, breadcrumb and page-section anchors route through the router when one is
  registered, instead of triggering a full page load while tabs and steps navigate
  client-side.
- `ml-icon` warns in dev on an unknown icon name (it rendered an empty `<i>`).
- `ml-checkbox` gained `name`/`value`; `ml-input` gained `name`, `maxlength`, `minlength`,
  `min`, `max`, `step`, `pattern` and `inputmode`.

### @melodicdev/cli

- The scaffold no longer hardcodes `devMode: true` — it shipped every dev diagnostic to
  production. Its tsconfig includes `vite/client` types, and the sample app models derived
  state with `computed()` instead of methods re-run on every read.

### Migrating to 4.0.0

- **Disabled controls no longer count toward validity.** A form that relied on a disabled
  `required` control keeping `invalid` true will now submit. That is the fix.
- **`updateOn` changes when the view writes to the model.** With `'blur'` or `'submit'`, the
  control's value now updates at that point rather than on every keystroke. Use `'change'`
  (the default) for the previous behaviour.
- **`createValidator(code, fn, message)` no longer writes to the global message registry.**
  Controls using *that validator* still get the message. If you relied on it applying to
  other validators producing the same code, pass `{ global: true }`.
- **Tab and step panels are hidden with the `hidden` attribute**, not an inline
  `display: none`. CSS that assumed the inline style needs `[hidden] { display: none }` —
  the components' own styles already do this.
- **A component field named like a native `HTMLElement` property is no longer mirrored onto
  the element.** `element.hidden`/`title`/`id` now read the platform value. Rename the field.
- **Repeat navigation to the current URL is ignored.** Pass `onSameUrlNavigation: 'reload'`
  where you relied on it re-running resolvers.
- **A guard redirect now runs the target's guards**, so a redirect into a protected area can
  be blocked. Apps that relied on the bypass will see the block; that is the fix.
- **Templates re-render on every signal they read.** A component reading a frequently
  changing signal in its template now re-renders with it. Wrap reads you do not want tracked
  in `untracked()`.
- `@melodicdev/components` requires `@melodicdev/core` `^4.0.0`.

### Also included: the unreleased 3.1.1 hardening pass

#### @melodicdev/core

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
