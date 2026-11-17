# Roadmap — planned framework capabilities

Capabilities worth building that have not been scheduled. Tracked here so they get designed deliberately rather than bolted on. Last reconciled against the source on 2026-11-16 (4.0.1).

## Framework capabilities

- **Hierarchical / child injectors** — scoped providers per component subtree (route-level services, per-dialog scopes). Requires defining resolution order and disposal semantics.
- **Importable outside a bundler (prerequisite for SSR and Node-side testing)** — two separate obstacles:
  1. The published `lib/` is compiled with `moduleResolution: bundler`, so its internal imports are extensionless and use directory imports (`from './bootstrap'`). Node's ESM loader rejects those (`ERR_UNSUPPORTED_DIR_IMPORT`), so `import '@melodicdev/core'` works only through a bundler or Vitest. Fixing it means explicit `.js` specifiers in `src/` (or a post-build rewrite).
  2. Any remaining module-top-level `window` / `document` access needs to move behind lazy accessors.
- **Named router outlets / auxiliary routes** — `<router-outlet name>` is still only a child-registration key; real support needs a non-linear match chain.
- **Typed `html` bindings** — `@click=${'not a function'}` still type-checks. Positional typing of a tagged template's values needs a compiler plugin.
- **DevTools browser extension** — the in-page hook and `window.melodic` console API shipped in 4.0; the panel that consumes them has not been built.

### Shipped since this list was first written

- **`effect()`** — 4.0 (`@melodicdev/core/signals`): immediate first run, cleanup functions, `{ name, manual }`.
- **Router event stream** — 4.0: `RouterService.events`, a signal of navigation lifecycle events.
- **`emit()` helper** — 4.0 (`@melodicdev/core/components`): `emit(host, 'ml:change', detail)` with `composed` / `bubbles` defaulting to `true`. A per-component declared event map is still open.

## Standard decorators migration (next major)

Migrate from `experimentalDecorators` to TC39 standard decorators. This is **viral**: consumers' tsconfigs are currently locked to the legacy flag by our types. It requires an `accessor`-based redesign of property observation (the current `observe()` getter/setter replacement doesn't map 1:1), so plan it as the headline of a major release rather than a patch. It was originally pencilled in for 4.0 and did not ship there; 4.x still requires `experimentalDecorators: true` and `useDefineForClassFields: false` (see "TypeScript configuration" in the README). Prerequisite spikes:

1. `accessor` field semantics vs. the current `observe()` (initial-value capture, `propertyTypes` coercion, host exposure).
2. Decorator metadata (`Symbol.metadata`) as the replacement for the current static/prototype bookkeeping in `@MelodicComponent`, `@Inject`, `@Service`.
3. A compatibility story (can one release support both modes?).
4. `@Inject` is a **parameter** decorator, which the TC39 proposal does not have at all — constructor injection needs a different surface (`dependencies: [...]` on `@Injectable`, which already exists, or an `inject()` function).

`emitDecoratorMetadata` is *not* part of the lock-in: nothing in the framework reads `design:*` metadata, and the CLI templates no longer set it.

## Deliberate non-changes

- **`sideEffects: false`** — evaluated and rejected: importing a component module registers its custom element, which is a load-bearing side effect. Bundler tree-shaking must not drop those imports.
- **Trusted Types** — template values never reach the HTML parser (text nodes / `setAttribute` only), so the win is limited to the static template markup itself; deferred until there's consumer demand (noted at the parse site in `template-result.class.ts`).
