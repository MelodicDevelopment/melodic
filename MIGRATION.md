# Migration Guide — Unreleased (after 4.0.1)

Changes on the way to the next release. Nothing is removed; these are the places where
correct behaviour differs from what a 4.0.x app may have relied on.

## @melodicdev/core

### HTTP: client defaults stay on your own origins

`defaultHeaders` and `credentials` set on the `HttpClient` are sent to the `baseURL`'s
origin and to the page's own origin only. A request to an absolute URL on any other origin
no longer receives them, so a default `Authorization` header cannot leak to a third party.
Headers and credentials passed on the request itself are always sent.

If you call a second API on another origin and relied on the defaults reaching it, pass the
headers on those requests, or opt back in:

```ts
provideHttp({ baseURL: 'https://api.example.com', allowCrossOriginDefaults: true });
```

Also: any `+json` content type is parsed as JSON (`application/problem+json` used to arrive
as text), typed-array bodies are sent as binary, and a response interceptor's `error`
handler runs once per deduplicated request instead of once per caller.

### Forms: programmatic writes reach disabled controls

`setValue` and `patchValue` now update disabled controls, groups and arrays. `disabled`
keeps the user out of a field, not your code, so `form.patchValue(serverData)` fills
read-only fields too. Code that relied on a disabled control ignoring a write must skip the
write itself.

With `updateOn: 'blur'` or `'submit'`, a control is marked dirty only when the value
actually changed; focusing and leaving a field no longer dirties it.

### Router

- **`onRouteChange` also fires for query-string changes and resolver reloads**, and on
  parent layouts that stay mounted. A handler that refetches on every call will now refetch
  on `?page=2`; compare `change.params` if it should only react to params.
- **`navigate('about')` means `/about`.** A path without a leading slash is resolved from
  the root.
- **`redirectTo` keeps the query string and the fragment** unless the target declares its
  own (`/old?code=abc#top` redirects to `/new?code=abc#top`).
- **A cross-origin `navigate()` resolves `{ success: false }`**, and a router link to
  another origin is left to the browser.
- `RouteContextEvent`, `ROUTE_CONTEXT_EVENT` and `IRouteContextChangeEvent` are deprecated.
  The router never dispatched the event; read the `RouterService` signals instead.

### Templates and components

- **Bindings on one element commit in source order** (previously reverse). Write a binding
  that depends on another after it: `min`/`max` before `.value` on a range input.
- **`css` is no longer an alias of `html`.** Stylesheet text is used verbatim, so entities
  are not decoded and tag-like text is not stripped. A stylesheet that worked around the old
  behaviour (double-escaping `content` strings, for example) needs the workaround removed.
- **`styleMap` keeps custom property names as written** (`'--cardAccent'` is no longer
  lower-cased and hyphenated).
- **A parent's `.prop=` binding now reaches signal fields, function fields and
  observed-attribute properties without an initializer.** A plain value bound to a signal
  field is written with `.set()`. A value bound to a property the component does not declare
  is still ignored, and dev mode now says so (`unknown-prop`): give the field an initializer.
- `repeatRaw` is deprecated in favour of `repeat`. It keeps working.

### State

`ComponentStateBaseService.dispatch` applies every reducer registered for the action type,
in registration order, as `SignalStoreService` does. It previously applied only the first.

## @melodicdev/components

- **`ml-select` / `ml-autocomplete` value sync.** Turning `multiple` on carries `value`
  into `values`; turning it off keeps `values[0]`. In single mode, assigning `values = []`
  no longer clears `value`.
- **Sorting is natural-order for strings and chronological for `Date` values** in
  `ml-table` and `ml-data-grid`. `"item 10"` now sorts after `"item 9"`.
- **`ml-table` no longer has `role="grid"`**, `aria-sort` appears only on sortable headers,
  and rows with `clickable-rows` are tab stops. Tests or styles that select on
  `[role="grid"]` need updating.
- **The toast container is a `popover="manual"` element**, so toasts render above modal
  dialogs. A toast's timer pauses while it is hovered or focused.
- **`ml-date-picker` falls back to the browser locale**, not the document `lang`, when no
  locale is set.
- **`prefers-reduced-motion` sets the `--ml-duration-*` tokens to zero.** Code that waits
  on a `transitionend` from a component should not assume one fires.
- **Tooltips and form fields describe their target with `aria-description`** instead of
  element references. Tests asserting on `ariaDescribedByElements` need updating.
- **Phosphor icon fonts ship as woff2 only.** The `.woff`, `.ttf` and `.svg` files are no
  longer published or referenced by the stylesheet. A build step that copies specific font
  files by name needs updating; copying the whole `assets` directory does not.

## @melodicdev/cli

- Names must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`: a trailing or doubled hyphen is
  rejected, and `generate directive` refuses JavaScript reserved words.
- `init` and `add` reject `--dry-run`; that flag and `--force` apply to `generate` only.
- Generated projects no longer set `emitDecoratorMetadata`. It was never required; existing
  projects can keep or drop it.

---

# Migration Guide — Melodic 4.0

Version 4.0 is a review-driven release across the framework and the component library. Most
of it fixes behaviour that was wrong; the items below are the ones where an app written for
3.x may see a difference. The full list of changes is in [CHANGELOG.md](./CHANGELOG.md).

`@melodicdev/components` 4.x requires `@melodicdev/core` `^4.0.0`. Upgrade both together.

## @melodicdev/core

### Templates re-render on every signal they read

The template now runs inside a signal effect, so a signal read from an injected service, a
signal nested in an object or array, or a computed from anywhere re-renders the component.
Previously only signals held directly in component fields did. A component that reads a
frequently changing signal in its template now re-renders with it; wrap a read you do not
want tracked in `untracked()`.

Lifecycle hooks are not tracked. Use `effect()` to react to a signal outside the template.

### Fields named like native `HTMLElement` properties are not mirrored

A component field called `hidden`, `title`, `id`, `slot`, `dir`, `tabIndex` and similar is
no longer copied onto the element, and dev mode warns. `element.hidden` now reads the
platform value. Rename the field (`isHidden`, `cardTitle`).

### Forms

- **Disabled controls no longer count toward validity.** A form that relied on a disabled
  `required` control keeping `invalid()` true will now submit.
- **`updateOn` governs when the view writes to the model.** With `'blur'` or `'submit'`
  the control's value updates at that point, not on every keystroke. `'change'` (the
  default) keeps the previous behaviour. A programmatic `setValue` always validates.
- **`createValidator(code, fn, message)` no longer writes to the global message registry.**
  Controls using that validator still get the message. Pass `{ global: true }` if other
  validators producing the same code relied on it.
- **`FormGroup`/`FormArray` bulk writes emit once.** A `value.subscribe()` callback that
  counted per-child emissions during `setValue`, `patchValue` or `reset` fires once per call.

### Router

- **Repeat navigation to the current URL is ignored.** Pass
  `onSameUrlNavigation: 'reload'` where you relied on it re-running resolvers.
- **A guard redirect runs the target's guards**, so a redirect into a protected route can
  be blocked.
- **Guards run for lazily loaded and default (`path: ''`) children.** Apps that relied on
  those guards silently not running will see navigations blocked.

### Signals

- **Subscriber errors surface to the writer after every other subscriber has run.** Several
  failures arrive as one `AggregateError`.
- **Computed reads inside `batch()` are fresh.** Code that depended on a stale computed
  value within a batch now sees the written values.

### HTTP

- **Deduplication is stricter.** Requests that differ in headers, params, credentials or
  mode no longer share a fetch. Pass identical configuration if sharing is intended.

### Templates

- **Interpolated arrays emit two comment nodes per item** (`<!--item-start-->` and
  `<!--item-end-->`), as `repeat()` always has. Code that walks `childNodes` around an
  interpolated array and counts raw nodes sees the extra comments; `children` and
  `querySelector*` are unaffected.

## @melodicdev/components

- **Tab and step panels are hidden with the `hidden` attribute**, not an inline
  `display: none`. CSS that assumed the inline style needs `[hidden] { display: none }`.
- **4.0.1: component tokens are no longer declared on `:host`.** Rules read each
  `--ml-{component}-*` token with its default as the `var()` fallback, so a value set on any
  ancestor is inherited. No change is needed for overrides that target the element; a token
  set on a wrapper's `:host`, which previously had no effect, now applies. See
  [theming.md](./packages/melodic-components/docs/theming.md).

---

# Migration Guide — Melodic 3.0

Version 3.0 is a remediation release: it fixes long-standing correctness bugs, memory leaks, and accessibility gaps found in a whole-repo review. Most changes make previously-broken behavior work; the items below are the ones where correct behavior differs from what 2.x apps may have relied on.

## @melodicdev/core

### Signals: `computed()` is lazy and read-only

`computed()` no longer recomputes eagerly on every source change — it recomputes when read. Calling `.set()`/`.update()` on a computed (or on a store `select()` result) now **throws**; both are typed as `ReadonlySignal<T>`. If you were writing to a computed, replace it with a `signal()` you own.

One subtlety: effects that depend on a computed are woken when a source changes even if the recomputed value is unchanged; direct subscribers remain equality-gated.

### Router: guards and resolvers run once — and on back/forward

The match→guards→resolvers→commit pipeline now runs entirely in `RouterService`, for programmatic navigation, initial load, **and popstate**:

- Guards/resolvers run exactly **once** per navigation (previously twice for programmatic navigations).
- Back/forward into a guarded route is now **blocked** when `canActivate` fails (the URL is reverted). Previously popstate bypassed guards.
- A blocked navigation no longer partially commits (params/matches stay untouched).
- `history.pushState`/`replaceState` are patched when the first `RouterService` is constructed (or via the new `provideRouter()` bootstrap provider), not at module import.
- `:param` no longer matches an empty segment (`{ path: ':id' }` no longer matches `/`).
- Built paths URL-encode parameter values; `navigate()` merges query strings instead of producing `?a=1?b=2`.
- `routerLink`/`<router-link>` reject `javascript:`-style URLs and pass modifier/middle clicks through to the browser (new-tab behavior is native now).

### HTTP: interceptors run exactly once

- Retried and deduplicated requests no longer run response interceptors multiple times. If an interceptor transforms the payload, retried responses will no longer be double-transformed.
- When all error interceptors fail to recover, the **last interceptor-thrown error** propagates instead of the original `HttpError` — this makes "catch HttpError, throw domain error" work; catch sites that assumed the original error type should catch the domain error instead.
- Prefer `config.signal: AbortSignal` over the deprecated `abortController`.

### Config: environment overrides deep-merge

`defineConfig` env blocks now deep-merge into `base` (matching `extends`). A nested object in an env block no longer wholesale-replaces the base object — it merges per key (arrays still replace). If you relied on replacement, restate the full object in the env block.

### State: keyless dispatch reaches every matching slice

An action registered in multiple slices now updates **all** of them (batched), and slices with effects but no reducers fire their effects. Code accidentally depending on first-slice-wins will see additional updates.

### Component attributes coerce by declared type

Numeric attributes now coerce (`<ml-popover offset="12">` works); `"true"`/`"false"` coerce to booleans for boolean-typed and type-less props; initially-undefined observed props now receive attribute values (previously dropped). Components can declare types explicitly:

```ts
static propertyTypes = { open: 'boolean', offset: 'number', code: 'string' };
```

`@MelodicComponent` now **throws** for invalid custom-element selectors (no hyphen, uppercase, etc.) instead of failing downstream in `customElements.define`.

## @melodicdev/components (requires core ^3.0.0)

### `ml-table` / `ml-data-grid` selection contract

`ml:select` detail is now `{ selectedRows, selectedIndices, allSelected }` where `selectedRows` contains **row objects** (previously sorted-order indices) and `selectedIndices` contains original-order indices into your `rows`. Selection resets when `rows` is replaced, and clearing a selection via sort/filter/page-change now emits `ml:select`.

### Dialog callbacks fire on every close path

`DialogRef.afterClosed` now fires on Escape/backdrop dismissal too (result `undefined`) — code that assumed it only ran for programmatic `close(result)` should handle the undefined case. `afterOpened`/`afterClosed` accumulate multiple callbacks instead of replacing. `DialogService.open()` returns `DialogRef | undefined` (warns for unregistered ids instead of throwing a TypeError).

### Focus and dismissal behavior

- Popover traps focus while open and restores it on close.
- Dropdown/date-picker no longer yank focus back to the trigger when dismissed by clicking elsewhere.
- Select/autocomplete menus follow the trigger on scroll/resize instead of closing.
- `ml-select` in `multiple` mode: clicking the trigger closes an open menu.

### Events

- Dismissal is standardized on `ml:dismiss`: `ml-tag` (`ml:close` deprecated) and file-upload items (`ml:remove` deprecated) emit both during 3.x.
- Internal coordination events (`ml:tab-click`, `ml:step-click`, `ml:sidebar-item-click`) no longer propagate past their parent component; `ml-radio-group` emits exactly one `ml:change` per selection (previously two).
- New lifecycle events: `ml:open`/`ml:close` on dialog and popover; `ml:opened`/`ml:closed` on drawer (after animation).

### `title` attributes are deprecated in favor of prefixed names

`alert-title`, `toast-title`, `hero-title`, `header-title`, `section-title`, and `page-title` replace the reserved global `title` attribute on the eight components that observed it. `title` still works via a shim (with a one-time console warning) but will be removed in the next major; it also still triggers the native browser tooltip, which is why it's being replaced.

### `ml-date-picker` uses a text input

The input is `type="text"` with parse/format (`MM/DD/YYYY`, `M/D/YYYY`, `YYYY-MM-DD`) — the double-picker problem (native + custom calendar) is gone. Native mobile date keyboards no longer appear, and Space types a character instead of opening the calendar (F4/Alt+Down/click still open it). The value contract (ISO strings, `{value}` detail) is unchanged.

### `ml-button` really submits

`type="submit"`/`type="reset"` now submit/reset the enclosing form (previously a no-op). Remove the attribute from buttons that set it decoratively. The redundant host `role="button"` is gone.

### Styling / tokens

- `--ml-tooltip-transition` → `--ml-tooltip-transition-duration` + `--ml-tooltip-transition-easing`; same split for `--ml-pagination-btn-transition`.
- `shift()` positioning middleware no longer clamps the main axis by default (floating-ui parity) — pass `mainAxis: true` to restore.
- `error` is the canonical status variant; `danger` (button, tag dot) still works as a deprecated alias.
- Theme names/values passed to `injectTheme`/`createTheme` are validated and throw on CSS-injection attempts.

### Kebab-case attributes now work

Attributes like `dot-color`, `avatar-src`, `sidebar-collapsed`, `trend-direction`, `step-number` previously never reached their properties. They work now; the quoted property forms (`el['dot-color']`) remain as deprecated aliases.

## @melodicdev/cli

- Names are validated: path separators, `..`, quotes, and non-kebab names are rejected; hyphen-less component names are auto-prefixed `app-`.
- Monorepo scaffolds use npm **workspace packages** (`@<repo>/config`) instead of tsconfig path aliases (`@config`). `add app`/`add lib` require a workspaces root and no longer maintain `paths`-style aliases on old scaffolds — migrate old monorepos to workspace packages or keep using an older CLI for them.
- Generated components use a directory + barrel structure; unknown flags now error (strict argument parsing).

---

# Migration Guide — Melodic 2.0

Version 2.0 is a correctness-first release across `@melodicdev/core` and
`@melodicdev/components`. It fixes a set of real bugs, memory leaks, and
lifecycle hazards. Most apps need no changes, but a few behaviors changed to
align with standard expectations. This guide covers the breaking ones.

## Forms — standard (Angular-aligned) semantics

**Disabled controls are excluded from `value()`.**
Use the new `getRawValue()` to retrieve the full value including disabled controls.

```ts
const form = createFormGroup({ a: createFormControl(''), b: createFormControl('', { disabled: true }) });
form.value();      // { a: '' }            ← disabled 'b' omitted
form.getRawValue(); // { a: '', b: '' }    ← everything
```

**`setValue` is now strict.**
`FormGroup.setValue` throws if the object's keys don't exactly match the controls;
`FormArray.setValue` throws on a length mismatch. Use `patchValue` for partial updates.

```ts
form.setValue({ a: '1' });          // throws: missing value for 'b'
form.patchValue({ a: '1' });        // ok — partial update
```

**Programmatic `setValue` no longer marks a control dirty.**
User input still dirties (via the `:formControl` directive). For programmatic
dirtying, call `markAsDirty()` explicitly. Pass `{ markAsPristine: true }` to keep pristine.

**`markAsTouched()` vs `markAllAsTouched()`.**
`markAsTouched()` touches only that control; `markAllAsTouched()` cascades to children.
To show all errors on submit, call `form.markAllAsTouched()`.

## Component lifecycle

**`onCreate` now fires exactly once** (the first time the element connects), not on
every connect. If you placed repeatable setup in `onCreate`, move it to the new
`onConnect()` hook. Use `onDisconnect()` for the paired teardown.

**Moving an element in the DOM no longer destroys its state.** Disposal of a
component's forms/signals is deferred to a microtask after disconnect and
cancelled if the element reconnects. `onDestroy` runs only on permanent removal.
If you relied on synchronous destruction on `disconnectedCallback`, note it is now
deferred by a microtask.

## Dependency Injection

**Tokens are keyed by identity, not by description.** Previously two
`createToken('x')` calls collided (both stringified to `Symbol(x)`); they are now
distinct. If you depended on that accidental aliasing, give the tokens a shared
reference instead.

## HTTP

- Empty JSON responses (e.g. 201/204 with `Content-Type: application/json`) now
  resolve to `data: null` instead of throwing/becoming a `NetworkError`.
- `IRequestConfig.timeout` is now supported and aborts the request.
- Query params: `null`/`undefined` values are skipped; array values expand to
  repeated keys.
- FormData/Blob/stream request bodies are never deduplicated.

## Components

- **`ml-table`**: the row-click cursor/hover affordance is now opt-in via the
  `clickable-rows` attribute (the global `addEventListener` patch was removed).
  The `ml:row-click` event still fires regardless. Add `clickable-rows` if you
  want the pointer affordance.
- **`ml-data-grid`**: selection is cleared on sort/filter/page change (it was
  positional and silently corrupted across these operations).
- **`createBrandTheme`**: now also generates `-hover`/`-active`/`-subtle` color
  variants. If you previously layered your own variants on top, verify they still
  win (they should, via specificity / later declaration).
- **Custom themes** no longer inherit dark-mode tokens under OS dark preference.
  A `data-theme="brand"` theme stays as defined regardless of OS setting.

## New APIs worth knowing

- `batch(fn)` (signals) — coalesce multiple signal writes into one notification.
- `getRawValue()` (forms) — value including disabled controls.
- `onConnect()` / `onDisconnect()` (component lifecycle hooks).
- `IRequestConfig.timeout` (http).
