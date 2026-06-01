# Changelog

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
