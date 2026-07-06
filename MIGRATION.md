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
