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
